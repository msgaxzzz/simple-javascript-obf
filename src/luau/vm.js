const { walk } = require("./ast");
const { decodeRawString } = require("./strings");

const DEFAULT_MIN_STATEMENTS = 2;

const OPCODES = [
  "NOP",
  "PUSH_CONST",
  "PUSH_LOCAL",
  "SET_LOCAL",
  "PUSH_GLOBAL",
  "SET_GLOBAL",
  "NEW_TABLE",
  "DUP",
  "SWAP",
  "POP",
  "GET_TABLE",
  "SET_TABLE",
  "CALL",
  "RETURN",
  "JMP",
  "JMP_IF_FALSE",
  "JMP_IF_TRUE",
  "ADD",
  "SUB",
  "MUL",
  "DIV",
  "IDIV",
  "MOD",
  "POW",
  "CONCAT",
  "EQ",
  "NE",
  "LT",
  "LE",
  "GT",
  "GE",
  "BAND",
  "BOR",
  "BXOR",
  "SHL",
  "SHR",
  "UNM",
  "NOT",
  "LEN",
  "BNOT",
];

const BINARY_OP_MAP = new Map([
  ["+", "ADD"],
  ["-", "SUB"],
  ["*", "MUL"],
  ["/", "DIV"],
  ["//", "IDIV"],
  ["%", "MOD"],
  ["^", "POW"],
  ["..", "CONCAT"],
  ["==", "EQ"],
  ["~=", "NE"],
  ["<", "LT"],
  ["<=", "LE"],
  [">", "GT"],
  [">=", "GE"],
  ["&", "BAND"],
  ["|", "BOR"],
  ["~", "BXOR"],
  ["<<", "SHL"],
  [">>", "SHR"],
]);

const UNARY_OP_MAP = new Map([
  ["-", "UNM"],
  ["not", "NOT"],
  ["#", "LEN"],
  ["~", "BNOT"],
]);

function luaString(value) {
  const text = String(value);
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/"/g, "\\\"");
  return `"${escaped}"`;
}

function buildOpcodeMap(rng, shuffle) {
  const codes = OPCODES.map((_, idx) => idx + 1);
  if (shuffle && rng) {
    rng.shuffle(codes);
  }
  const mapping = {};
  OPCODES.forEach((name, idx) => {
    mapping[name] = codes[idx];
  });
  return mapping;
}

function splitInstructions(instructions, rng) {
  const total = instructions.length;
  if (!rng || total < 6) {
    return null;
  }
  const maxParts = Math.min(4, total);
  const partCount = rng.int(2, maxParts);
  const parts = [];
  const offsets = [];
  let offset = 0;
  for (let i = 0; i < partCount; i += 1) {
    const remaining = total - offset;
    const remainingParts = partCount - i;
    const minSize = Math.max(1, remaining - (remainingParts - 1));
    const size = i === partCount - 1 ? remaining : rng.int(1, minSize);
    parts.push(instructions.slice(offset, offset + size));
    offsets.push(offset + 1);
    offset += size;
  }
  const order = Array.from({ length: partCount }, (_, i) => i + 1);
  rng.shuffle(order);
  return { parts, offsets, order };
}

function ensureConst(program, value) {
  const idx = program.consts.findIndex((entry) => entry === value);
  if (idx >= 0) {
    return idx + 1;
  }
  program.consts.push(value);
  return program.consts.length;
}

function encodeConstPool(program, rng) {
  const keyLength = rng.int(6, 14);
  const key = Array.from({ length: keyLength }, () => rng.int(1, 255));
  const entries = program.consts.map((value) => {
    let tag = 4;
    let text = "";
    if (value === null || value === undefined) {
      tag = 0;
      text = "";
    } else if (typeof value === "boolean") {
      tag = value ? 2 : 1;
      text = value ? "1" : "0";
    } else if (typeof value === "number") {
      tag = 3;
      text = String(value);
    } else {
      tag = 4;
      text = String(value);
    }
    const bytes = Buffer.from(text, "utf8");
    const out = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
      out[i] = (bytes[i] + key[i % key.length]) & 0xff;
    }
    return { tag, data: out };
  });
  return { key, entries, count: program.consts.length };
}

function injectFakeInstructions(program, rng, probability) {
  if (!probability || probability <= 0) {
    return;
  }
  const nilIndex = ensureConst(program, null);
  const next = [];
  for (const inst of program.instructions) {
    next.push(inst);
    if (rng.bool(probability)) {
      if (rng.bool(0.5)) {
        next.push(["NOP", 0, 0]);
      } else {
        next.push(["PUSH_CONST", nilIndex, 0], ["POP", 0, 0]);
      }
    }
  }
  program.instructions = next;
}

class Emitter {
  constructor() {
    this.instructions = [];
    this.labels = new Map();
    this.jumps = [];
  }

  emit(op, a = 0, b = 0) {
    this.instructions.push([op, a, b]);
    return this.instructions.length - 1;
  }

  label(name) {
    this.labels.set(name, this.instructions.length);
  }

  emitJump(op, label) {
    const idx = this.emit(op, 0, 0);
    this.jumps.push({ idx, label });
  }

  patch() {
    for (const entry of this.jumps) {
      const target = this.labels.get(entry.label);
      if (target === undefined) {
        throw new Error(`Missing label ${entry.label}`);
      }
      this.instructions[entry.idx][1] = target + 1;
    }
  }
}

class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this.bindings = new Map();
  }

  define(name, index) {
    this.bindings.set(name, index);
  }

  resolve(name) {
    let current = this;
    while (current) {
      if (current.bindings.has(name)) {
        return current.bindings.get(name);
      }
      current = current.parent;
    }
    return null;
  }
}

class VmCompiler {
  constructor({ style, options }) {
    this.style = style;
    this.options = options;
    this.emitter = new Emitter();
    this.consts = [];
    this.constMap = new Map();
    this.localCount = 0;
    this.scope = new Scope();
    this.loopStack = [];
    this.tempCount = 0;
  }

  nextTemp() {
    this.tempCount += 1;
    this.localCount += 1;
    return this.localCount;
  }

  reserveLocal() {
    this.localCount += 1;
    return this.localCount;
  }

  addConst(value) {
    const key = `${typeof value}:${String(value)}`;
    if (this.constMap.has(key)) {
      return this.constMap.get(key);
    }
    const idx = this.consts.length + 1;
    this.consts.push(value);
    this.constMap.set(key, idx);
    return idx;
  }

  defineLocal(name) {
    this.localCount += 1;
    this.scope.define(name, this.localCount);
    return this.localCount;
  }

  resolveLocal(name) {
    return this.scope.resolve(name);
  }

  enterScope() {
    this.scope = new Scope(this.scope);
  }

  exitScope() {
    if (this.scope.parent) {
      this.scope = this.scope.parent;
    }
  }

  emit(op, a = 0, b = 0) {
    this.emitter.emit(op, a, b);
  }

  emitJump(op, label) {
    this.emitter.emitJump(op, label);
  }

  label(name) {
    this.emitter.label(name);
  }

  compileFunction(node) {
    const params = this.getFunctionParams(node);
    this.enterScope();
    params.forEach((param) => {
      if (param) {
        this.defineLocal(param);
      } else {
        this.reserveLocal();
      }
    });
    const body = this.getFunctionBody(node);
    this.compileStatements(body);
    this.emit("RETURN", 0, 0);
    this.emitter.patch();
    this.exitScope();
    return {
      instructions: this.emitter.instructions,
      consts: this.consts,
      localCount: this.localCount,
      paramCount: params.length,
      paramNames: params,
    };
  }

  getFunctionParams(node) {
    const params = node.parameters || [];
    const names = params.map((param) => {
      if (param && typeof param.name === "string") {
        return param.name;
      }
      return null;
    });
    if (this.isMethodFunction(node) && names[0] !== "self") {
      names.unshift("self");
    }
    return names;
  }

  isMethodFunction(node) {
    if (!node || node.type !== "FunctionDeclaration") {
      return false;
    }
    if (this.style === "custom") {
      return Boolean(node.name && node.name.method);
    }
    const identifier = node.identifier;
    return Boolean(
      identifier &&
      identifier.type === "MemberExpression" &&
      identifier.indexer === ":"
    );
  }

  getFunctionBody(node) {
    if (this.style === "custom") {
      return node.body && node.body.body ? node.body.body : [];
    }
    return Array.isArray(node.body) ? node.body : [];
  }

  compileStatements(statements) {
    for (const stmt of statements) {
      this.compileStatement(stmt);
    }
  }

  compileStatement(stmt) {
    if (!stmt || !stmt.type) {
      return;
    }
    switch (stmt.type) {
      case "LocalStatement":
        this.compileLocalStatement(stmt);
        return;
      case "AssignmentStatement":
        this.compileAssignmentStatement(stmt);
        return;
      case "CompoundAssignmentStatement":
        this.compileCompoundAssignment(stmt);
        return;
      case "CallStatement":
        this.compileCallStatement(stmt);
        return;
      case "ReturnStatement":
        this.compileReturnStatement(stmt);
        return;
      case "IfStatement":
        this.compileIfStatement(stmt);
        return;
      case "WhileStatement":
        this.compileWhileStatement(stmt);
        return;
      case "RepeatStatement":
        this.compileRepeatStatement(stmt);
        return;
      case "ForNumericStatement":
        this.compileForNumeric(stmt);
        return;
      case "ForGenericStatement":
        this.compileForGeneric(stmt);
        return;
      case "DoStatement":
        this.enterScope();
        this.compileStatements(this.getBlockStatements(stmt.body));
        this.exitScope();
        return;
      case "BreakStatement":
        this.compileBreak();
        return;
      case "ContinueStatement":
        this.compileContinue();
        return;
      case "TypeAliasStatement":
      case "ExportTypeStatement":
      case "TypeFunctionStatement":
      case "ExportTypeFunctionStatement":
        return;
      default:
        throw new Error(`Unsupported statement ${stmt.type}`);
    }
  }

  getBlockStatements(body) {
    if (!body) {
      return [];
    }
    if (Array.isArray(body)) {
      return body;
    }
    if (body.body && Array.isArray(body.body)) {
      return body.body;
    }
    return [];
  }

  compileLocalStatement(stmt) {
    const variables = stmt.variables || [];
    const init = stmt.init || [];
    if (variables.length <= 1 && init.length <= 1) {
      if (init.length === 1) {
        this.compileExpression(init[0]);
      } else {
        const nilIdx = this.addConst(null);
        this.emit("PUSH_CONST", nilIdx, 0);
      }
      const name = variables[0] ? variables[0].name : null;
      const localIdx = name ? this.defineLocal(name) : this.nextTemp();
      this.emit("SET_LOCAL", localIdx, 0);
      return;
    }
    this.compileMultiAssign(variables, init, true);
  }

  compileAssignmentStatement(stmt) {
    const variables = stmt.variables || [];
    const init = stmt.init || [];
    if (variables.length <= 1 && init.length <= 1) {
      if (init.length === 1) {
        this.compileExpression(init[0]);
      } else {
        const nilIdx = this.addConst(null);
        this.emit("PUSH_CONST", nilIdx, 0);
      }
      this.compileAssignTarget(variables[0]);
      return;
    }
    this.compileMultiAssign(variables, init, false);
  }

  compileMultiAssign(variables, init, isLocal) {
    const temp = this.nextTemp();
    this.emit("NEW_TABLE", 0, 0);
    this.emit("SET_LOCAL", temp, 0);
    init.forEach((expr, idx) => {
      this.emit("PUSH_LOCAL", temp, 0);
      const keyIdx = this.addConst(idx + 1);
      this.emit("PUSH_CONST", keyIdx, 0);
      this.compileExpression(expr);
      this.emit("SET_TABLE", 0, 0);
    });

    variables.forEach((variable, idx) => {
      this.emit("PUSH_LOCAL", temp, 0);
      const keyIdx = this.addConst(idx + 1);
      this.emit("PUSH_CONST", keyIdx, 0);
      this.emit("GET_TABLE", 0, 0);
      if (isLocal && variable && variable.type === "Identifier") {
        const localIdx = this.defineLocal(variable.name);
        this.emit("SET_LOCAL", localIdx, 0);
      } else {
        this.compileAssignTarget(variable);
      }
    });
  }

  compileCompoundAssignment(stmt) {
    if (!stmt || !stmt.variable) {
      return;
    }
    if (stmt.variable.type !== "Identifier") {
      throw new Error("Compound assignment supports identifiers only");
    }
    const opName = BINARY_OP_MAP.get(stmt.operator);
    if (!opName) {
      throw new Error(`Unsupported compound operator ${stmt.operator}`);
    }
    this.compileExpression(stmt.variable);
    this.compileExpression(stmt.value);
    this.emit(opName, 0, 0);
    this.compileAssignTarget(stmt.variable);
  }

  compileCallStatement(stmt) {
    this.compileCallExpression(stmt.expression, 0);
  }

  compileReturnStatement(stmt) {
    const args = stmt.arguments || [];
    if (!args.length) {
      this.emit("RETURN", 0, 0);
      return;
    }
    args.forEach((expr) => this.compileExpression(expr));
    this.emit("RETURN", args.length, 0);
  }

  compileIfStatement(stmt) {
    const clauses = this.getIfClauses(stmt);
    const endLabel = this.makeLabel("ifend");
    let idx = 0;
    for (const clause of clauses) {
      if (!clause.condition) {
        this.compileStatements(clause.body);
        this.emitJump("JMP", endLabel);
        break;
      }
      const nextLabel = this.makeLabel(`ifnext_${idx}`);
      this.compileExpression(clause.condition);
      this.emitJump("JMP_IF_FALSE", nextLabel);
      this.emit("POP", 0, 0);
      this.enterScope();
      this.compileStatements(clause.body);
      this.exitScope();
      this.emitJump("JMP", endLabel);
      this.label(nextLabel);
      this.emit("POP", 0, 0);
      idx += 1;
    }
    this.label(endLabel);
  }

  getIfClauses(stmt) {
    if (this.style === "custom") {
      const clauses = (stmt.clauses || []).map((clause) => ({
        condition: clause.condition,
        body: this.getBlockStatements(clause.body),
      }));
      if (stmt.elseBody) {
        clauses.push({
          condition: null,
          body: this.getBlockStatements(stmt.elseBody),
        });
      }
      return clauses;
    }
    const clauses = [];
    for (const clause of stmt.clauses || []) {
      if (clause.type === "ElseClause") {
        clauses.push({ condition: null, body: clause.body || [] });
      } else {
        clauses.push({ condition: clause.condition, body: clause.body || [] });
      }
    }
    return clauses;
  }

  compileWhileStatement(stmt) {
    const startLabel = this.makeLabel("while_start");
    const endLabel = this.makeLabel("while_end");
    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel });
    this.label(startLabel);
    this.compileExpression(stmt.condition);
    this.emitJump("JMP_IF_FALSE", endLabel);
    this.emit("POP", 0, 0);
    this.enterScope();
    this.compileStatements(this.getBlockStatements(stmt.body));
    this.exitScope();
    this.emitJump("JMP", startLabel);
    this.label(endLabel);
    this.emit("POP", 0, 0);
    this.loopStack.pop();
  }

  compileRepeatStatement(stmt) {
    const startLabel = this.makeLabel("repeat_start");
    const endLabel = this.makeLabel("repeat_end");
    const condLabel = this.makeLabel("repeat_cond");
    this.loopStack.push({ breakLabel: endLabel, continueLabel: condLabel });
    this.label(startLabel);
    this.enterScope();
    this.compileStatements(this.getBlockStatements(stmt.body));
    this.exitScope();
    this.label(condLabel);
    this.compileExpression(stmt.condition);
    this.emitJump("JMP_IF_FALSE", startLabel);
    this.emit("POP", 0, 0);
    this.label(endLabel);
    this.loopStack.pop();
  }

  compileForNumeric(stmt) {
    const startLabel = this.makeLabel("for_start");
    const endLabel = this.makeLabel("for_end");
    const continueLabel = this.makeLabel("for_continue");

    this.enterScope();
    const varName = stmt.variable ? stmt.variable.name : null;
    const varIdx = varName ? this.defineLocal(varName) : this.nextTemp();
    const limitIdx = this.nextTemp();
    const stepIdx = this.nextTemp();

    this.compileExpression(stmt.start);
    this.emit("SET_LOCAL", varIdx, 0);
    this.compileExpression(stmt.end);
    this.emit("SET_LOCAL", limitIdx, 0);
    if (stmt.step) {
      this.compileExpression(stmt.step);
    } else {
      const oneIdx = this.addConst(1);
      this.emit("PUSH_CONST", oneIdx, 0);
    }
    this.emit("SET_LOCAL", stepIdx, 0);

    this.loopStack.push({ breakLabel: endLabel, continueLabel });

    this.label(startLabel);
    this.emit("PUSH_LOCAL", stepIdx, 0);
    const zeroIdx = this.addConst(0);
    this.emit("PUSH_CONST", zeroIdx, 0);
    this.emit("GE", 0, 0);
    const branchLabel = this.makeLabel("for_branch");
    this.emitJump("JMP_IF_FALSE", branchLabel);
    this.emit("POP", 0, 0);
    this.emit("PUSH_LOCAL", varIdx, 0);
    this.emit("PUSH_LOCAL", limitIdx, 0);
    this.emit("LE", 0, 0);
    const condOkLabel = this.makeLabel("for_cond_ok");
    this.emitJump("JMP_IF_FALSE", endLabel);
    this.emitJump("JMP", condOkLabel);
    this.label(branchLabel);
    this.emit("POP", 0, 0);
    this.emit("PUSH_LOCAL", varIdx, 0);
    this.emit("PUSH_LOCAL", limitIdx, 0);
    this.emit("GE", 0, 0);
    this.emitJump("JMP_IF_FALSE", endLabel);
    this.label(condOkLabel);
    this.emit("POP", 0, 0);

    this.compileStatements(this.getBlockStatements(stmt.body));

    this.label(continueLabel);
    this.emit("PUSH_LOCAL", varIdx, 0);
    this.emit("PUSH_LOCAL", stepIdx, 0);
    this.emit("ADD", 0, 0);
    this.emit("SET_LOCAL", varIdx, 0);
    this.emitJump("JMP", startLabel);
    this.label(endLabel);

    this.loopStack.pop();
    this.exitScope();
  }

  compileForGeneric(stmt) {
    const startLabel = this.makeLabel("forg_start");
    const endLabel = this.makeLabel("forg_end");
    const nilLabel = this.makeLabel("forg_nil");

    this.enterScope();

    const fnIdx = this.nextTemp();
    const stateIdx = this.nextTemp();
    const ctrlIdx = this.nextTemp();

    const iterators = stmt.iterators || [];
    if (iterators[0]) {
      this.compileExpression(iterators[0]);
    } else {
      this.emit("PUSH_CONST", this.addConst(null), 0);
    }
    this.emit("SET_LOCAL", fnIdx, 0);
    if (iterators[1]) {
      this.compileExpression(iterators[1]);
    } else {
      this.emit("PUSH_CONST", this.addConst(null), 0);
    }
    this.emit("SET_LOCAL", stateIdx, 0);
    if (iterators[2]) {
      this.compileExpression(iterators[2]);
    } else {
      this.emit("PUSH_CONST", this.addConst(null), 0);
    }
    this.emit("SET_LOCAL", ctrlIdx, 0);

    const variables = stmt.variables || [];
    const varLocals = variables.map((variable) => {
      if (variable && variable.type === "Identifier") {
        return this.defineLocal(variable.name);
      }
      return this.nextTemp();
    });

    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel });

    this.label(startLabel);
    this.emit("PUSH_LOCAL", fnIdx, 0);
    this.emit("PUSH_LOCAL", stateIdx, 0);
    this.emit("PUSH_LOCAL", ctrlIdx, 0);
    const retCount = Math.max(1, varLocals.length);
    this.emit("CALL", 2, retCount);
    for (let i = varLocals.length - 1; i >= 0; i -= 1) {
      this.emit("SET_LOCAL", varLocals[i], 0);
    }

    if (varLocals.length > 0) {
      this.emit("PUSH_LOCAL", varLocals[0], 0);
      this.emit("PUSH_CONST", this.addConst(null), 0);
      this.emit("EQ", 0, 0);
      this.emitJump("JMP_IF_TRUE", nilLabel);
      this.emit("POP", 0, 0);
      this.emit("PUSH_LOCAL", varLocals[0], 0);
      this.emit("SET_LOCAL", ctrlIdx, 0);
    }

    this.compileStatements(this.getBlockStatements(stmt.body));

    this.emitJump("JMP", startLabel);
    this.label(nilLabel);
    this.emit("POP", 0, 0);
    this.label(endLabel);

    this.loopStack.pop();
    this.exitScope();
  }

  compileBreak() {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) {
      throw new Error("break outside loop");
    }
    this.emitJump("JMP", loop.breakLabel);
  }

  compileContinue() {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) {
      throw new Error("continue outside loop");
    }
    this.emitJump("JMP", loop.continueLabel);
  }

  compileAssignTarget(target) {
    if (!target) {
      this.emit("POP", 0, 0);
      return;
    }
    if (target.type === "Identifier") {
      const localIdx = this.resolveLocal(target.name);
      if (localIdx) {
        this.emit("SET_LOCAL", localIdx, 0);
      } else {
        const nameIdx = this.addConst(target.name);
        this.emit("SET_GLOBAL", nameIdx, 0);
      }
      return;
    }
    if (target.type === "MemberExpression") {
      this.compileExpression(target.base);
      const keyIdx = this.addConst(target.identifier.name);
      this.emit("PUSH_CONST", keyIdx, 0);
      this.emit("SWAP", 0, 0);
      this.emit("SET_TABLE", 0, 0);
      return;
    }
    if (target.type === "IndexExpression") {
      this.compileExpression(target.base);
      this.compileExpression(target.index);
      this.emit("SWAP", 0, 0);
      this.emit("SET_TABLE", 0, 0);
      return;
    }
    throw new Error(`Unsupported assignment target ${target.type}`);
  }

  compileExpression(expr) {
    if (!expr || !expr.type) {
      const nilIdx = this.addConst(null);
      this.emit("PUSH_CONST", nilIdx, 0);
      return;
    }
    switch (expr.type) {
      case "Identifier": {
        const localIdx = this.resolveLocal(expr.name);
        if (localIdx) {
          this.emit("PUSH_LOCAL", localIdx, 0);
        } else {
          const nameIdx = this.addConst(expr.name);
          this.emit("PUSH_GLOBAL", nameIdx, 0);
        }
        return;
      }
      case "NumericLiteral":
      case "StringLiteral":
      case "BooleanLiteral":
      case "NilLiteral": {
        const value = expr.type === "NilLiteral" ? null : expr.value ?? this.extractLiteral(expr);
        const idx = this.addConst(value);
        this.emit("PUSH_CONST", idx, 0);
        return;
      }
      case "VarargLiteral":
        throw new Error("vararg unsupported");
      case "UnaryExpression": {
        const op = UNARY_OP_MAP.get(expr.operator);
        if (!op) {
          throw new Error(`Unsupported unary ${expr.operator}`);
        }
        this.compileExpression(expr.argument);
        this.emit(op, 0, 0);
        return;
      }
      case "LogicalExpression":
        this.compileLogicalExpression(expr);
        return;
      case "BinaryExpression": {
        if (expr.operator === "and" || expr.operator === "or") {
          this.compileLogicalExpression(expr);
          return;
        }
        const op = BINARY_OP_MAP.get(expr.operator);
        if (!op) {
          throw new Error(`Unsupported binary ${expr.operator}`);
        }
        this.compileExpression(expr.left);
        this.compileExpression(expr.right);
        this.emit(op, 0, 0);
        return;
      }
      case "GroupExpression":
        this.compileExpression(expr.expression);
        return;
      case "MemberExpression":
        this.compileExpression(expr.base);
        this.emit("PUSH_CONST", this.addConst(expr.identifier.name), 0);
        this.emit("GET_TABLE", 0, 0);
        return;
      case "IndexExpression":
        this.compileExpression(expr.base);
        this.compileExpression(expr.index);
        this.emit("GET_TABLE", 0, 0);
        return;
      case "CallExpression":
        this.compileCallExpression(expr, 1);
        return;
      case "MethodCallExpression":
        this.compileMethodCall(expr, 1);
        return;
      case "TableCallExpression":
        this.compileTableCall(expr, 1);
        return;
      case "StringCallExpression":
        this.compileStringCall(expr, 1);
        return;
      case "TableConstructorExpression":
        this.compileTableConstructor(expr);
        return;
      case "IfExpression":
        this.compileIfExpression(expr);
        return;
      case "TypeAssertion":
        this.compileExpression(expr.expression);
        return;
      case "InterpolatedString":
        this.compileInterpolated(expr);
        return;
      default:
        throw new Error(`Unsupported expression ${expr.type}`);
    }
  }

  extractLiteral(node) {
    if (node.type === "StringLiteral") {
      if (typeof node.value === "string") {
        return node.value;
      }
      if (typeof node.raw === "string") {
        const decoded = decodeRawString(node.raw);
        if (decoded !== null) {
          return decoded;
        }
        if (node.raw.length >= 2) {
          return node.raw.slice(1, -1);
        }
      }
      return "";
    }
    if (node.type === "NumericLiteral") {
      if (typeof node.value === "number") {
        return node.value;
      }
      if (typeof node.raw === "string") {
        return Number(node.raw);
      }
      return Number(node.value);
    }
    return node.value;
  }

  compileLogicalExpression(expr) {
    const endLabel = this.makeLabel("logic_end");
    if (expr.operator === "and") {
      this.compileExpression(expr.left);
      this.emitJump("JMP_IF_FALSE", endLabel);
      this.emit("POP", 0, 0);
      this.compileExpression(expr.right);
      this.label(endLabel);
      return;
    }
    this.compileExpression(expr.left);
    this.emitJump("JMP_IF_TRUE", endLabel);
    this.emit("POP", 0, 0);
    this.compileExpression(expr.right);
    this.label(endLabel);
  }

  compileCallExpression(expr, retCount) {
    if (expr.base && expr.base.type === "MemberExpression" && expr.base.indexer === ":") {
      this.compileExpression(expr.base.base);
      this.emit("DUP", 0, 0);
      this.emit("PUSH_CONST", this.addConst(expr.base.identifier.name), 0);
      this.emit("GET_TABLE", 0, 0);
      this.emit("SWAP", 0, 0);
      const args = expr.arguments || [];
      args.forEach((arg) => this.compileExpression(arg));
      this.emit("CALL", args.length + 1, retCount);
      return;
    }
    this.compileExpression(expr.base);
    const args = expr.arguments || [];
    args.forEach((arg) => this.compileExpression(arg));
    this.emit("CALL", args.length, retCount);
  }

  compileMethodCall(expr, retCount) {
    this.compileExpression(expr.base);
    this.emit("DUP", 0, 0);
    this.emit("PUSH_CONST", this.addConst(expr.method.name), 0);
    this.emit("GET_TABLE", 0, 0);
    this.emit("SWAP", 0, 0);
    const args = expr.arguments || [];
    args.forEach((arg) => this.compileExpression(arg));
    this.emit("CALL", args.length + 1, retCount);
  }

  compileTableCall(expr, retCount) {
    this.compileExpression(expr.base);
    this.compileExpression(expr.arguments);
    this.emit("CALL", 1, retCount);
  }

  compileStringCall(expr, retCount) {
    this.compileExpression(expr.base);
    this.compileExpression(expr.argument);
    this.emit("CALL", 1, retCount);
  }

  compileTableConstructor(expr) {
    this.emit("NEW_TABLE", 0, 0);
    let listIndex = 1;
    const fields = expr.fields || [];
    for (const field of fields) {
      if (field.type === "TableKey") {
        this.emit("DUP", 0, 0);
        this.compileExpression(field.key);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
      } else if (field.type === "TableKeyString") {
        this.emit("DUP", 0, 0);
        this.emit("PUSH_CONST", this.addConst(field.key.name), 0);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
      } else if (field.type === "TableValue") {
        this.emit("DUP", 0, 0);
        this.emit("PUSH_CONST", this.addConst(listIndex), 0);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
        listIndex += 1;
      } else if (field.kind === "index") {
        this.emit("DUP", 0, 0);
        this.compileExpression(field.key);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
      } else if (field.kind === "name") {
        this.emit("DUP", 0, 0);
        this.emit("PUSH_CONST", this.addConst(field.name.name), 0);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
      } else if (field.kind === "list") {
        this.emit("DUP", 0, 0);
        this.emit("PUSH_CONST", this.addConst(listIndex), 0);
        this.compileExpression(field.value);
        this.emit("SET_TABLE", 0, 0);
        listIndex += 1;
      }
    }
  }

  compileIfExpression(expr) {
    const endLabel = this.makeLabel("ifexpr_end");
    const clauses = expr.clauses || [];
    let idx = 0;
    for (const clause of clauses) {
      const nextLabel = this.makeLabel(`ifexpr_next_${idx}`);
      this.compileExpression(clause.condition);
      this.emitJump("JMP_IF_FALSE", nextLabel);
      this.emit("POP", 0, 0);
      this.compileExpression(clause.value);
      this.emitJump("JMP", endLabel);
      this.label(nextLabel);
      this.emit("POP", 0, 0);
      idx += 1;
    }
    this.compileExpression(expr.elseValue);
    this.label(endLabel);
  }

  compileInterpolated(expr) {
    if (expr.raw) {
      const idx = this.addConst(expr.raw.slice(1, -1));
      this.emit("PUSH_CONST", idx, 0);
      return;
    }
    const parts = expr.parts || [];
    if (!parts.length) {
      const idx = this.addConst("");
      this.emit("PUSH_CONST", idx, 0);
      return;
    }
    let first = true;
    for (const part of parts) {
      if (part.type === "InterpolatedStringText") {
        this.emit("PUSH_CONST", this.addConst(part.raw), 0);
      } else {
        this.compileExpression(part);
      }
      if (first) {
        first = false;
      } else {
        this.emit("CONCAT", 0, 0);
      }
    }
  }

  makeLabel(prefix) {
    if (!this.labelCount) {
      this.labelCount = 0;
    }
    const name = `${prefix}_${this.labelCount}`;
    this.labelCount += 1;
    return name;
  }
}

function hasNestedFunction(ast, fnNode) {
  let found = false;
  walk(fnNode, (node) => {
    if (found || !node || !node.type) {
      return;
    }
    if (node === fnNode) {
      return;
    }
    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
      found = true;
    }
  });
  return found;
}

function hasVararg(fnNode, style) {
  if (style === "custom") {
    return Boolean(fnNode.hasVararg);
  }
  return false;
}

function shouldVirtualizeFunction(fnNode, options) {
  const include = options.vm && Array.isArray(options.vm.include) ? options.vm.include : [];
  const all = options.vm && options.vm.all;
  if (all || include.length === 0) {
    return true;
  }
  const name = getFunctionName(fnNode);
  return name ? include.includes(name) : false;
}

function getFunctionName(fnNode) {
  if (!fnNode) {
    return null;
  }
  if (fnNode.name && fnNode.name.type === "FunctionName") {
    const parts = [fnNode.name.base.name, ...fnNode.name.members.map((m) => m.name)];
    if (fnNode.name.method) {
      parts.push(fnNode.name.method.name);
    }
    return parts.join(".");
  }
  if (fnNode.identifier && fnNode.identifier.type === "Identifier") {
    return fnNode.identifier.name;
  }
  return null;
}

function canVirtualizeFunction(fnNode, style) {
  if (hasNestedFunction(null, fnNode)) {
    return false;
  }
  if (hasVararg(fnNode, style)) {
    return false;
  }
  let unsupported = false;
  walk(fnNode, (node) => {
    if (unsupported || !node || !node.type) {
      return;
    }
    if (node === fnNode) {
      return;
    }
    switch (node.type) {
      case "GotoStatement":
      case "LabelStatement":
      case "VarargLiteral":
        unsupported = true;
        return;
      default:
        return;
    }
  });
  return !unsupported;
}

function buildVmSource(program, opcodeMap, paramNames, runtimeKeySeed, bcInfo, constInfo) {
  const opConst = OPCODES.map((name) => `local OP_${name} = ${opcodeMap[name]}`).join("\n");
  const constCount = constInfo ? constInfo.count : program.consts.length;
  const localsInit = (paramNames || []).map((name) => (name ? name : "nil"));
  const localsTable = `{ ${localsInit.join(", ")} }`;

  const keyLine = runtimeKeySeed
    ? `local key = ((${runtimeKeySeed} + #bc + ${constCount}) % 255) + 1`
    : `local key = 0`;

  const lines = [
    `do`,
    opConst,
  ];

  if (bcInfo && bcInfo.parts && bcInfo.parts.length > 1) {
    const partStrings = bcInfo.parts.map((part) => {
      const items = part
        .map((inst) => `{ ${inst[0]}, ${inst[1] || 0}, ${inst[2] || 0} }`)
        .join(", ");
      return `{ ${items} }`;
    });
    lines.push(`local bc_parts = { ${partStrings.join(", ")} }`);
    lines.push(`local bc_offsets = { ${bcInfo.offsets.join(", ")} }`);
    lines.push(`local bc_order = { ${bcInfo.order.join(", ")} }`);
    lines.push(`local bc = {}`);
    lines.push(`for i = 1, #bc_order do`);
    lines.push(`  local idx = bc_order[i]`);
    lines.push(`  local part = bc_parts[idx]`);
    lines.push(`  local offset = bc_offsets[idx]`);
    lines.push(`  for j = 1, #part do`);
    lines.push(`    bc[offset + j - 1] = part[j]`);
    lines.push(`  end`);
    lines.push(`end`);
  } else {
    const bc = program.instructions
      .map((inst) => `{ ${inst[0]}, ${inst[1] || 0}, ${inst[2] || 0} }`)
      .join(", ");
    lines.push(`local bc = { ${bc} }`);
  }

  if (constInfo) {
    const constEntries = constInfo.entries.map((entry) => {
      const data = entry.data.join(", ");
      return `{ ${entry.tag}, { ${data} } }`;
    });
    lines.push(`local consts_data = { ${constEntries.join(", ")} }`);
    lines.push(`local consts_key = { ${constInfo.key.join(", ")} }`);
    lines.push(`local consts = {}`);
    lines.push(`local keyLen = #consts_key`);
    lines.push(`for i = 1, ${constInfo.count} do`);
    lines.push(`  local entry = consts_data[i]`);
    lines.push(`  local tag = entry[1]`);
    lines.push(`  local data = entry[2]`);
    lines.push(`  local out = {}`);
    lines.push(`  for j = 1, #data do`);
    lines.push(`    local idx = (j - 1) % keyLen + 1`);
    lines.push(`    local v = data[j] - consts_key[idx]`);
    lines.push(`    if v < 0 then v = v + 256 end`);
    lines.push(`    out[j] = string.char(v)`);
    lines.push(`  end`);
    lines.push(`  local s = table.concat(out)`);
    lines.push(`  if tag == 0 then`);
    lines.push(`    consts[i] = nil`);
    lines.push(`  elseif tag == 1 then`);
    lines.push(`    consts[i] = false`);
    lines.push(`  elseif tag == 2 then`);
    lines.push(`    consts[i] = true`);
    lines.push(`  elseif tag == 3 then`);
    lines.push(`    consts[i] = tonumber(s)`);
    lines.push(`  else`);
    lines.push(`    consts[i] = s`);
    lines.push(`  end`);
    lines.push(`end`);
  } else {
    const consts = program.consts.map((value) => {
      if (value === null || value === undefined) {
        return "nil";
      }
      if (typeof value === "string") {
        return luaString(value);
      }
      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }
      return String(value);
    });
    const constTable = `{ ${consts.join(", ")} }`;
    lines.push(`local consts = ${constTable}`);
  }

  lines.push(
    keyLine,
    `local locals = ${localsTable}`,
    `local stack = {}`,
    `local top = 0`,
    `local pc = 1`,
    `local env = _ENV`,
    `local pack = table.pack`,
    `local unpack = table.unpack`,
    `while true do`,
    `  local inst = bc[pc]`,
    `  local op = inst[1]`,
    `  local a = inst[2]`,
    `  local b = inst[3]`,
    `  if key ~= 0 then`,
    `    op = op ~ key`,
    `    a = a ~ key`,
    `    b = b ~ key`,
    `  end`,
    `  if op == OP_NOP then`,
    `    pc = pc + 1`,
    `  elseif op == OP_PUSH_CONST then`,
    `    top = top + 1`,
    `    stack[top] = consts[a]`,
    `    pc = pc + 1`,
    `  elseif op == OP_PUSH_LOCAL then`,
    `    top = top + 1`,
    `    stack[top] = locals[a]`,
    `    pc = pc + 1`,
    `  elseif op == OP_SET_LOCAL then`,
    `    locals[a] = stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_PUSH_GLOBAL then`,
    `    top = top + 1`,
    `    stack[top] = env[consts[a]]`,
    `    pc = pc + 1`,
    `  elseif op == OP_SET_GLOBAL then`,
    `    env[consts[a]] = stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_NEW_TABLE then`,
    `    top = top + 1`,
    `    stack[top] = {}`,
    `    pc = pc + 1`,
    `  elseif op == OP_DUP then`,
    `    top = top + 1`,
    `    stack[top] = stack[top - 1]`,
    `    pc = pc + 1`,
    `  elseif op == OP_SWAP then`,
    `    stack[top], stack[top - 1] = stack[top - 1], stack[top]`,
    `    pc = pc + 1`,
    `  elseif op == OP_POP then`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_GET_TABLE then`,
    `    local idx = stack[top]`,
    `    stack[top] = nil`,
    `    local base = stack[top - 1]`,
    `    stack[top - 1] = base[idx]`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_SET_TABLE then`,
    `    local val = stack[top]`,
    `    stack[top] = nil`,
    `    local key = stack[top - 1]`,
    `    stack[top - 1] = nil`,
    `    local base = stack[top - 2]`,
    `    base[key] = val`,
    `    top = top - 2`,
    `    pc = pc + 1`,
    `  elseif op == OP_CALL then`,
    `    local argc = a`,
    `    local retc = b`,
    `    local args = {}`,
    `    for i = argc, 1, -1 do`,
    `      args[i] = stack[top]`,
    `      stack[top] = nil`,
    `      top = top - 1`,
    `    end`,
    `    local fn = stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    local res = pack(fn(unpack(args, 1, argc)))`,
    `    if retc == 1 then`,
    `      top = top + 1`,
    `      stack[top] = res[1]`,
    `    elseif retc > 1 then`,
    `      for i = 1, retc do`,
    `        top = top + 1`,
    `        stack[top] = res[i]`,
    `      end`,
    `    end`,
    `    pc = pc + 1`,
    `  elseif op == OP_RETURN then`,
    `    local count = a`,
    `    if count == 0 then`,
    `      return`,
    `    elseif count == 1 then`,
    `      return stack[top]`,
    `    else`,
    `      local out = {}`,
    `      for i = count, 1, -1 do`,
    `        out[i] = stack[top]`,
    `        stack[top] = nil`,
    `        top = top - 1`,
    `      end`,
    `      return unpack(out, 1, count)`,
    `    end`,
    `  elseif op == OP_JMP then`,
    `    pc = a`,
    `  elseif op == OP_JMP_IF_FALSE then`,
    `    if not stack[top] then`,
    `      pc = a`,
    `    else`,
    `      pc = pc + 1`,
    `    end`,
    `  elseif op == OP_JMP_IF_TRUE then`,
    `    if stack[top] then`,
    `      pc = a`,
    `    else`,
    `      pc = pc + 1`,
    `    end`,
    `  elseif op == OP_ADD then`,
    `    stack[top - 1] = stack[top - 1] + stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_SUB then`,
    `    stack[top - 1] = stack[top - 1] - stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_MUL then`,
    `    stack[top - 1] = stack[top - 1] * stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_DIV then`,
    `    stack[top - 1] = stack[top - 1] / stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_IDIV then`,
    `    stack[top - 1] = stack[top - 1] // stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_MOD then`,
    `    stack[top - 1] = stack[top - 1] % stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_POW then`,
    `    stack[top - 1] = stack[top - 1] ^ stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_CONCAT then`,
    `    stack[top - 1] = stack[top - 1] .. stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_EQ then`,
    `    stack[top - 1] = stack[top - 1] == stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_NE then`,
    `    stack[top - 1] = stack[top - 1] ~= stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_LT then`,
    `    stack[top - 1] = stack[top - 1] < stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_LE then`,
    `    stack[top - 1] = stack[top - 1] <= stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_GT then`,
    `    stack[top - 1] = stack[top - 1] > stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_GE then`,
    `    stack[top - 1] = stack[top - 1] >= stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_BAND then`,
    `    stack[top - 1] = stack[top - 1] & stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_BOR then`,
    `    stack[top - 1] = stack[top - 1] | stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_BXOR then`,
    `    stack[top - 1] = stack[top - 1] ~ stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_SHL then`,
    `    stack[top - 1] = stack[top - 1] << stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_SHR then`,
    `    stack[top - 1] = stack[top - 1] >> stack[top]`,
    `    stack[top] = nil`,
    `    top = top - 1`,
    `    pc = pc + 1`,
    `  elseif op == OP_UNM then`,
    `    stack[top] = -stack[top]`,
    `    pc = pc + 1`,
    `  elseif op == OP_NOT then`,
    `    stack[top] = not stack[top]`,
    `    pc = pc + 1`,
    `  elseif op == OP_LEN then`,
    `    stack[top] = #stack[top]`,
    `    pc = pc + 1`,
    `  elseif op == OP_BNOT then`,
    `    stack[top] = ~stack[top]`,
    `    pc = pc + 1`,
    `  else`,
    `    return`,
    `  end`,
    `end`,
    `end`,
  );

  return lines.join("\n");
}

function replaceFunctionBody(fnNode, vmAst, style) {
  const body = vmAst.body || [];
  if (style === "custom") {
    fnNode.body = { type: "Block", body };
    return;
  }
  fnNode.body = body;
}

function virtualizeLuau(ast, ctx) {
  const style = ctx.options.luauParser === "custom" ? "custom" : "luaparse";
  const layers = Math.max(1, ctx.options.vm?.layers || 1);
  for (let layer = 0; layer < layers; layer += 1) {
    const minStatements = ctx.options.vm?.minStatements ?? DEFAULT_MIN_STATEMENTS;

    walk(ast, (node) => {
      if (!node || (node.type !== "FunctionDeclaration" && node.type !== "FunctionExpression")) {
        return;
      }
      if (!shouldVirtualizeFunction(node, ctx.options)) {
        return;
      }
      if (!canVirtualizeFunction(node, style)) {
        return;
      }
      const body = style === "custom"
        ? (node.body && node.body.body ? node.body.body : [])
        : Array.isArray(node.body) ? node.body : [];
      if (!body || body.length < minStatements) {
        return;
      }

    const compiler = new VmCompiler({ style, options: ctx.options });
    let program;
    try {
      program = compiler.compileFunction(node);
    } catch (err) {
      return;
    }

    injectFakeInstructions(program, ctx.rng, ctx.options.vm?.fakeOpcodes ?? 0);

    const opcodeMap = buildOpcodeMap(ctx.rng, ctx.options.vm?.opcodeShuffle !== false);
    program.instructions = program.instructions.map((inst) => [
      opcodeMap[inst[0]],
      inst[1] || 0,
      inst[2] || 0,
    ]);

    const runtimeKeySeed = ctx.options.vm?.runtimeKey === false ? 0 : ctx.rng.int(1, 255);
    if (runtimeKeySeed) {
      const keyValue = ((runtimeKeySeed + program.instructions.length + program.consts.length) % 255) + 1;
      program.instructions = program.instructions.map((inst) => [
        inst[0] ^ keyValue,
        (inst[1] || 0) ^ keyValue,
        (inst[2] || 0) ^ keyValue,
      ]);
    }

    const bcInfo = ctx.options.vm?.runtimeSplit === false
      ? null
      : splitInstructions(program.instructions, ctx.rng);
    const constInfo = ctx.options.vm?.constsEncrypt === false
      ? null
      : encodeConstPool(program, ctx.rng);
    const vmSource = buildVmSource(
      program,
      opcodeMap,
      program.paramNames,
      runtimeKeySeed || 0,
      bcInfo,
      constInfo
    );
    const vmAst = ctx.options.luauParser === "custom"
      ? ctx.parseCustom(vmSource)
      : ctx.parseLuaparse(vmSource);
      replaceFunctionBody(node, vmAst, style);
    });
  }
}

module.exports = {
  virtualizeLuau,
};
