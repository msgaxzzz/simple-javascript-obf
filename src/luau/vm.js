const { walk } = require("./ast");
const { decodeRawString } = require("./strings");
const { makeDiagnosticErrorFromNode } = require("./custom/diagnostics");
const { addSSAUsedNames, findSSAForNode } = require("./ssa-utils");

const DEFAULT_MIN_STATEMENTS = 1;

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

function raise(message, node = null) {
  throw makeDiagnosticErrorFromNode(message, node);
}

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

function luaByteString(bytes) {
  if (!bytes || !bytes.length) {
    return "\"\"";
  }
  let out = "\"";
  for (const value of bytes) {
    const num = Math.max(0, Math.min(255, Number(value) || 0));
    out += `\\${String(num).padStart(3, "0")}`;
  }
  out += "\"";
  return out;
}

function buildOpcodeMap(rng, shuffle, opcodeList = OPCODES) {
  const codes = opcodeList.map((_, idx) => idx + 1);
  if (shuffle && rng) {
    rng.shuffle(codes);
  }
  const mapping = {};
  opcodeList.forEach((name, idx) => {
    mapping[name] = codes[idx];
  });
  return mapping;
}

function computeSeedFromPieces(pieces, bcLength, constCount) {
  let seed = 0;
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i];
    seed = (seed + piece) ^ ((piece << (i % 3)) & 0xff);
    seed &= 0xff;
  }
  seed = (seed + bcLength + constCount) % 255;
  return seed;
}

function buildSeedState(rng, bcLength, constCount) {
  const pieceCount = rng.int(2, 4);
  const pieces = Array.from({ length: pieceCount }, () => rng.int(5, 240));
  const seed = computeSeedFromPieces(pieces, bcLength, constCount);
  return { pieces, seed };
}

function buildKeySchedule(rng, seedState) {
  const keyCount = rng.int(2, 4);
  const base = seedState.pieces[0] || 0;
  const keys = Array.from({ length: keyCount }, (_, idx) => (
    ((seedState.seed + base + (idx + 1) * 17) % 255) + 1
  ));
  const maskPieces = [rng.int(1, 200), rng.int(1, 200)];
  const mask = ((maskPieces[0] ^ maskPieces[1]) + seedState.seed) % 255 + 1;
  const encoded = keys.map((key, idx) => key ^ ((mask + idx * 13) % 255));
  return { encoded, maskPieces, keys };
}

function buildOpcodeEncoding(opcodeMap, rng, seedState, opcodeList = OPCODES) {
  const keyPieces = [rng.int(1, 200), rng.int(1, 200)];
  const key = ((keyPieces[0] + keyPieces[1] + seedState.seed) % 255) + 1;
  const encoded = opcodeList.map((name, idx) => (
    opcodeMap[name] ^ ((key + idx * 7) % 255)
  ));
  return { encoded, keyPieces };
}

function buildIndexExpression(index, rng) {
  if (!rng) {
    return String(index);
  }
  const salt = rng.int(1, 9);
  return `(${index + salt} - ${salt})`;
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

const ISA_XOR_VARIANT_OPS = new Set([
  "PUSH_CONST",
  "PUSH_LOCAL",
  "SET_LOCAL",
  "PUSH_GLOBAL",
  "SET_GLOBAL",
  "JMP",
  "JMP_IF_FALSE",
  "JMP_IF_TRUE",
  "CALL",
]);

function normalizeVmMode(value, allowed, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.toLowerCase();
  if (allowed.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function applyPolymorphicBlockISA(program, rng, vmOptions = {}) {
  let isaMode = "auto";
  if (typeof vmOptions.isaPolymorph === "boolean") {
    isaMode = vmOptions.isaPolymorph ? "on" : "off";
  } else {
    isaMode = normalizeVmMode(vmOptions.isaPolymorph, new Set(["off", "on", "auto"]), "auto");
  }
  const enabled = isaMode === "on" || (isaMode === "auto" && rng.bool(0.85));
  const stackModeRaw = normalizeVmMode(vmOptions.stackProtocol, new Set(["auto", "direct", "api"]), "auto");
  const stackProtocol = stackModeRaw === "auto" ? (rng.bool(0.5) ? "api" : "direct") : stackModeRaw;
  const dispatchGraph = normalizeVmMode(vmOptions.dispatchGraph, new Set(["auto", "tree", "sparse"]), "auto");
  const fakeEdges = vmOptions.fakeEdges !== false;
  const profile = {
    enabled,
    keyA: rng.int(1, 255),
    keyB: rng.int(1, 255),
    stackProtocol,
    dispatchGraph,
    fakeEdges,
  };
  if (!enabled || !program || !Array.isArray(program.instructions)) {
    return profile;
  }
  program.instructions = program.instructions.map((inst) => {
    const op = inst[0];
    const a = inst[1] || 0;
    const b = inst[2] || 0;
    if (!ISA_XOR_VARIANT_OPS.has(op) || !rng.bool(0.72)) {
      return inst;
    }
    if (op === "CALL") {
      return [`${op}_X`, a ^ profile.keyA, b ^ profile.keyB];
    }
    return [`${op}_X`, a ^ profile.keyA, b];
  });
  return profile;
}

function encodeU32(value) {
  const v = value >>> 0;
  return [
    v & 0xff,
    (v >>> 8) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 24) & 0xff,
  ];
}

function escapeRegexLiteral(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceIdentifierToken(source, from, to) {
  if (!source || from === to) {
    return source;
  }
  const pattern = new RegExp(`\\b${escapeRegexLiteral(from)}\\b`, "g");
  return source.replace(pattern, to);
}

function encodeBytecodeStream(instructions, rng, seedState, splitInfo) {
  const keyPieces = [rng.int(1, 200), rng.int(1, 200)];
  const seedValue = seedState ? seedState.seed : 0;
  const key = ((keyPieces[0] + keyPieces[1] + seedValue) % 255) + 1;
  const parts = splitInfo && Array.isArray(splitInfo.parts) && splitInfo.parts.length
    ? splitInfo.parts
    : [instructions];
  const encodedParts = new Array(parts.length);
  let offset = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const bytes = [];
    for (const inst of part) {
      bytes.push(...encodeU32(inst[0] || 0));
      bytes.push(...encodeU32(inst[1] || 0));
      bytes.push(...encodeU32(inst[2] || 0));
    }
    const encoded = bytes.map((byte, idx) => (
      byte ^ ((key + ((offset + idx) * 17)) % 256)
    ));
    encodedParts[i] = encoded;
    offset += bytes.length;
  }

  let storageOrder = parts.map((_, idx) => idx + 1);
  if (splitInfo && Array.isArray(splitInfo.order) && splitInfo.order.length === parts.length) {
    storageOrder = splitInfo.order.slice();
  } else if (parts.length > 1) {
    rng.shuffle(storageOrder);
  }

  const storedParts = storageOrder.map((idx) => encodedParts[idx - 1]);
  const order = new Array(parts.length);
  storageOrder.forEach((partIndex, storageIndex) => {
    order[partIndex - 1] = storageIndex + 1;
  });

  return {
    keyPieces,
    parts: storedParts,
    order,
    totalBytes: offset,
  };
}

function bytesToLuaString(bytes, chunkSize = 60) {
  if (!bytes.length) {
    return "\"\"";
  }
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.slice(i, i + chunkSize);
    chunks.push(`string.char(${slice.join(", ")})`);
  }
  return chunks.join(" .. ");
}

function ensureConst(program, value) {
  const idx = program.consts.findIndex((entry) => entry === value);
  if (idx >= 0) {
    return idx + 1;
  }
  program.consts.push(value);
  return program.consts.length;
}

function encodeConstPool(program, rng, seedState) {
  const keyLength = rng.int(6, 14);
  const key = Array.from({ length: keyLength }, () => rng.int(1, 255));
  const maskPieces = [rng.int(1, 200), rng.int(1, 200)];
  const seedValue = seedState ? seedState.seed : 0;
  const mask = ((maskPieces[0] ^ maskPieces[1]) + seedValue) % 255 + 1;
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
  const keyEncoded = key.map((value, idx) => value ^ ((mask + idx * 11) % 255));
  return {
    keyEncoded,
    maskPieces,
    entries,
    count: program.consts.length,
  };
}

function splitConstEntries(entries, rng, targetSize) {
  if (!entries || entries.length <= targetSize) {
    return [entries];
  }
  const minSize = Math.max(4, Math.floor(targetSize * 0.6));
  const maxSize = Math.max(minSize, Math.floor(targetSize * 1.4));
  const parts = [];
  let index = 0;
  while (index < entries.length) {
    const remaining = entries.length - index;
    const size = rng
      ? Math.min(remaining, rng.int(minSize, maxSize))
      : Math.min(remaining, targetSize);
    parts.push(entries.slice(index, index + size));
    index += size;
  }
  return parts;
}

function buildDecoyVmStrings(rng, count) {
  const heads = [
    "vm",
    "dispatch",
    "trace",
    "handler",
    "opcode",
    "const",
    "seed",
    "stack",
    "guard",
    "decrypt",
  ];
  const tails = [
    "probe",
    "state",
    "route",
    "graph",
    "flow",
    "node",
    "mask",
    "table",
    "core",
    "stub",
  ];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const left = rng.pick(heads);
    const right = rng.pick(tails);
    const stamp = rng.int(0x1000, 0xffff).toString(16);
    out.push(`${left}_${right}_${stamp}`);
  }
  return out;
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
        raise(`Missing label ${entry.label}`);
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
    this.userLabelNames = new Map();
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

  getUserLabelName(labelNode) {
    const raw = labelNode && labelNode.type === "Identifier"
      ? labelNode.name
      : (typeof labelNode === "string" ? labelNode : null);
    if (!raw) {
      raise("Invalid goto/label target", labelNode || null);
    }
    let name = this.userLabelNames.get(raw);
    if (!name) {
      name = this.makeLabel(`user_${raw}`);
      this.userLabelNames.set(raw, name);
    }
    return name;
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

  compileChunk(node, {
    statements = null,
    preboundLocals = null,
  } = {}) {
    const body = Array.isArray(statements)
      ? statements
      : (node && Array.isArray(node.body) ? node.body : []);
    const locals = Array.isArray(preboundLocals)
      ? preboundLocals.filter((name) => typeof name === "string" && name.length > 0)
      : [];
    this.enterScope();
    locals.forEach((name) => {
      this.defineLocal(name);
    });
    this.compileStatements(body);
    this.emit("RETURN", 0, 0);
    this.emitter.patch();
    this.exitScope();
    return {
      instructions: this.emitter.instructions,
      consts: this.consts,
      localCount: this.localCount,
      paramCount: locals.length,
      paramNames: locals,
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
      case "LabelStatement":
        this.compileLabelStatement(stmt);
        return;
      case "GotoStatement":
        this.compileGotoStatement(stmt);
        return;
      case "TypeAliasStatement":
      case "ExportTypeStatement":
      case "TypeFunctionStatement":
      case "ExportTypeFunctionStatement":
        return;
      default:
        raise(`Unsupported statement ${stmt.type}`, stmt);
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
    const normalizedOperator = typeof stmt.operator === "string" && stmt.operator.endsWith("=")
      ? stmt.operator.slice(0, -1)
      : stmt.operator;
    const opName = BINARY_OP_MAP.get(normalizedOperator);
    if (!opName) {
      raise(`Unsupported compound operator ${stmt.operator}`, stmt);
    }
    const target = stmt.variable;
    if (target.type === "Identifier") {
      this.compileExpression(target);
      this.compileExpression(stmt.value);
      this.emit(opName, 0, 0);
      this.compileAssignTarget(target);
      return;
    }
    if (target.type === "MemberExpression") {
      const baseTmp = this.nextTemp();
      const valueTmp = this.nextTemp();
      this.compileExpression(target.base);
      this.emit("SET_LOCAL", baseTmp, 0);
      this.emit("PUSH_LOCAL", baseTmp, 0);
      this.emit("PUSH_CONST", this.addConst(target.identifier.name), 0);
      this.emit("GET_TABLE", 0, 0);
      this.compileExpression(stmt.value);
      this.emit(opName, 0, 0);
      this.emit("SET_LOCAL", valueTmp, 0);
      this.emit("PUSH_LOCAL", baseTmp, 0);
      this.emit("PUSH_CONST", this.addConst(target.identifier.name), 0);
      this.emit("PUSH_LOCAL", valueTmp, 0);
      this.emit("SET_TABLE", 0, 0);
      return;
    }
    if (target.type === "IndexExpression") {
      const baseTmp = this.nextTemp();
      const indexTmp = this.nextTemp();
      const valueTmp = this.nextTemp();
      this.compileExpression(target.base);
      this.emit("SET_LOCAL", baseTmp, 0);
      this.compileExpression(target.index);
      this.emit("SET_LOCAL", indexTmp, 0);
      this.emit("PUSH_LOCAL", baseTmp, 0);
      this.emit("PUSH_LOCAL", indexTmp, 0);
      this.emit("GET_TABLE", 0, 0);
      this.compileExpression(stmt.value);
      this.emit(opName, 0, 0);
      this.emit("SET_LOCAL", valueTmp, 0);
      this.emit("PUSH_LOCAL", baseTmp, 0);
      this.emit("PUSH_LOCAL", indexTmp, 0);
      this.emit("PUSH_LOCAL", valueTmp, 0);
      this.emit("SET_TABLE", 0, 0);
      return;
    }
    raise("Compound assignment supports identifiers/member/index targets only", target);
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
    const slots = [fnIdx, stateIdx, ctrlIdx];
    const isMultiReturn = (expr) => (
      expr &&
      (expr.type === "CallExpression" ||
        expr.type === "MethodCallExpression" ||
        expr.type === "TableCallExpression" ||
        expr.type === "StringCallExpression")
    );
    let slotIndex = 0;
    for (let i = 0; i < iterators.length && slotIndex < slots.length; i += 1) {
      const expr = iterators[i];
      const isLast = i === iterators.length - 1;
      const remaining = slots.length - slotIndex;
      if (expr && isLast && remaining > 1 && isMultiReturn(expr)) {
        this.compileCallExpression(expr, remaining);
        for (let j = remaining - 1; j >= 0; j -= 1) {
          this.emit("SET_LOCAL", slots[slotIndex + j], 0);
        }
        slotIndex = slots.length;
        break;
      }
      if (expr) {
        this.compileExpression(expr);
      } else {
        this.emit("PUSH_CONST", this.addConst(null), 0);
      }
      this.emit("SET_LOCAL", slots[slotIndex], 0);
      slotIndex += 1;
    }
    while (slotIndex < slots.length) {
      this.emit("PUSH_CONST", this.addConst(null), 0);
      this.emit("SET_LOCAL", slots[slotIndex], 0);
      slotIndex += 1;
    }

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
      raise("break outside loop");
    }
    this.emitJump("JMP", loop.breakLabel);
  }

  compileContinue() {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) {
      raise("continue outside loop");
    }
    this.emitJump("JMP", loop.continueLabel);
  }

  compileLabelStatement(stmt) {
    const label = stmt && (stmt.label || stmt.name) ? (stmt.label || stmt.name) : null;
    this.label(this.getUserLabelName(label));
  }

  compileGotoStatement(stmt) {
    const label = stmt && (stmt.label || stmt.name) ? (stmt.label || stmt.name) : null;
    this.emitJump("JMP", this.getUserLabelName(label));
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
    raise(`Unsupported assignment target ${target.type}`, target);
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
        raise("vararg unsupported", expr);
      case "UnaryExpression": {
        const op = UNARY_OP_MAP.get(expr.operator);
        if (!op) {
          raise(`Unsupported unary ${expr.operator}`, expr);
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
          raise(`Unsupported binary ${expr.operator}`, expr);
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
        raise(`Unsupported expression ${expr.type}`, expr);
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

function hasNestedFunction(fnNode) {
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

function cloneAst(node) {
  if (node === null || node === undefined) {
    return node;
  }
  return JSON.parse(JSON.stringify(node));
}

function makeIdentifierNode(name) {
  return {
    type: "Identifier",
    name,
  };
}

function makeFunctionNameNode(name) {
  return {
    type: "FunctionName",
    base: makeIdentifierNode(name),
    members: [],
    method: null,
  };
}

function makeNilLiteralNode() {
  return {
    type: "NilLiteral",
    value: null,
    raw: "nil",
  };
}

function walkAny(node, visitor, parent = null, key = null) {
  if (node === null || node === undefined) {
    return;
  }
  visitor(node, parent, key);
  if (Array.isArray(node)) {
    node.forEach((item) => walkAny(item, visitor, parent, key));
    return;
  }
  if (typeof node !== "object") {
    return;
  }
  Object.keys(node).forEach((childKey) => {
    const child = node[childKey];
    if (Array.isArray(child)) {
      child.forEach((item) => walkAny(item, visitor, node, childKey));
      return;
    }
    walkAny(child, visitor, node, childKey);
  });
}

function isFunctionNode(node) {
  return Boolean(node && (node.type === "FunctionDeclaration" || node.type === "FunctionExpression"));
}

function getFunctionBodyStatementsByStyle(fnNode, style) {
  if (!isFunctionNode(fnNode)) {
    return [];
  }
  if (style === "custom") {
    return fnNode.body && Array.isArray(fnNode.body.body) ? fnNode.body.body : [];
  }
  return Array.isArray(fnNode.body) ? fnNode.body : [];
}

function isTaskCallbackCall(node) {
  if (!node || node.type !== "CallExpression" || !node.base) {
    return false;
  }
  const base = node.base;
  if (base.type !== "MemberExpression" || base.indexer !== ".") {
    return false;
  }
  if (!base.base || base.base.type !== "Identifier" || base.base.name !== "task") {
    return false;
  }
  const method = base.identifier && base.identifier.name;
  return method === "spawn" || method === "defer" || method === "delay";
}

function getTaskCallbackArgIndex(node) {
  if (!isTaskCallbackCall(node)) {
    return -1;
  }
  const method = node.base && node.base.identifier ? node.base.identifier.name : "";
  if (method === "delay") {
    return 1;
  }
  return 0;
}

function isReferenceIdentifier(node, parent, key) {
  if (!node || node.type !== "Identifier" || !parent) {
    return true;
  }
  if ((parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") && key === "parameters") {
    return false;
  }
  if (parent.type === "FunctionName") {
    return false;
  }
  if (parent.type === "LocalStatement" && key === "variables") {
    return false;
  }
  if (parent.type === "ForNumericStatement" && key === "variable") {
    return false;
  }
  if (parent.type === "ForGenericStatement" && key === "variables") {
    return false;
  }
  if (parent.type === "MemberExpression" && key === "identifier") {
    return false;
  }
  return true;
}

function collectFunctionLocalNames(fnNode) {
  const names = new Set();
  const params = Array.isArray(fnNode.parameters) ? fnNode.parameters : [];
  params.forEach((param) => {
    if (param && param.type === "Identifier" && param.name) {
      names.add(param.name);
    }
  });
  walkAny(fnNode, (node, parent, key) => {
    if (!node || typeof node !== "object" || !node.type) {
      return;
    }
    if (node.type === "Identifier" && parent) {
      if (parent.type === "LocalStatement" && key === "variables" && node.name) {
        names.add(node.name);
        return;
      }
      if (parent.type === "ForNumericStatement" && key === "variable" && node.name) {
        names.add(node.name);
        return;
      }
      if (parent.type === "ForGenericStatement" && key === "variables" && node.name) {
        names.add(node.name);
      }
      return;
    }
    if (node.type === "FunctionDeclaration" && node.isLocal) {
      const fnName = getFunctionName(node);
      if (fnName && !fnName.includes(".")) {
        names.add(fnName);
      }
    }
  });
  return names;
}

function collectDeclaredNamesInFunction(fnNode) {
  return collectFunctionLocalNames(fnNode);
}

function collectUsedIdentifierOrder(fnNode) {
  const names = [];
  const seen = new Set();
  walkAny(fnNode, (node, parent, key) => {
    if (!node || node.type !== "Identifier" || !node.name) {
      return;
    }
    if (!isReferenceIdentifier(node, parent, key)) {
      return;
    }
    if (seen.has(node.name)) {
      return;
    }
    seen.add(node.name);
    names.push(node.name);
  });
  return names;
}

function buildLiftedLocalFunction(name, fnExpr, captureNames = []) {
  const originalParams = Array.isArray(fnExpr.parameters)
    ? fnExpr.parameters.filter((param) => param && param.type === "Identifier")
    : [];
  return {
    type: "FunctionDeclaration",
    name: makeFunctionNameNode(name),
    parameters: [
      ...cloneAst(originalParams),
      ...captureNames.map((capture) => makeIdentifierNode(capture)),
    ],
    hasVararg: false,
    varargAnnotation: null,
    returnType: null,
    typeParameters: [],
    isLocal: true,
    body: cloneAst(fnExpr.body),
  };
}

function liftNestedVmCallbacksInFunction(fnNode, style, makeHelperName) {
  const lifted = [];
  const hostLocals = collectFunctionLocalNames(fnNode);
  const body = getFunctionBodyStatementsByStyle(fnNode, style);
  if (!body.length) {
    return lifted;
  }

  const visitNode = (node, depth) => {
    if (!node || typeof node !== "object") {
      return;
    }

    const isCall = node.type === "CallExpression" || node.type === "MethodCallExpression";
    if (depth === 0 && isCall && Array.isArray(node.arguments) && isTaskCallbackCall(node)) {
      const callbackArgIndex = getTaskCallbackArgIndex(node);
      if (callbackArgIndex < 0) {
        return;
      }
      for (let argIndex = 0; argIndex < node.arguments.length; argIndex += 1) {
        const arg = node.arguments[argIndex];
        if (argIndex !== callbackArgIndex || !arg || arg.type !== "FunctionExpression") {
          continue;
        }
        if (arg.hasVararg) {
          continue;
        }
        if (!canVirtualizeFunction(arg, style)) {
          continue;
        }

        const declared = collectDeclaredNamesInFunction(arg);
        const used = collectUsedIdentifierOrder(arg);
        const captures = [];
        const captureSet = new Set();
        used.forEach((name) => {
          if (declared.has(name) || !hostLocals.has(name) || captureSet.has(name)) {
            return;
          }
          captureSet.add(name);
          captures.push(name);
        });

        const helperName = makeHelperName();
        const helperFn = buildLiftedLocalFunction(helperName, arg, captures);
        lifted.push(helperFn);

        node.arguments[argIndex] = makeIdentifierNode(helperName);
        if (captures.length > 0) {
          const declaredParamCount = Array.isArray(arg.parameters) ? arg.parameters.length : 0;
          const existingArgCount = Math.max(0, node.arguments.length - (callbackArgIndex + 1));
          const paddingCount = Math.max(0, declaredParamCount - existingArgCount);
          const padding = [];
          for (let i = 0; i < paddingCount; i += 1) {
            padding.push(makeNilLiteralNode());
          }
          node.arguments.push(
            ...padding,
            ...captures.map((capture) => makeIdentifierNode(capture))
          );
        }
      }
    }

    Object.keys(node).forEach((childKey) => {
      const child = node[childKey];
      if (Array.isArray(child)) {
        child.forEach((item) => {
          if (!item || typeof item !== "object") {
            return;
          }
          visitNode(item, depth + (isFunctionNode(item) ? 1 : 0));
        });
        return;
      }
      if (child && typeof child === "object") {
        visitNode(child, depth + (isFunctionNode(child) ? 1 : 0));
      }
    });
  };

  body.forEach((stmt) => visitNode(stmt, 0));
  return lifted;
}

function liftNestedVmCallbacks(ast, ctx, style) {
  const usedNames = new Set();
  walk(ast, (node) => {
    if (node && node.type === "Identifier" && node.name) {
      usedNames.add(node.name);
    }
  });

  const makeHelperName = () => {
    let name = "";
    while (!name || usedNames.has(name)) {
      const rand = ctx && ctx.rng && typeof ctx.rng.int === "function"
        ? ctx.rng.int(1, 1_000_000_000)
        : Math.floor(Math.random() * 1_000_000_000) + 1;
      name = `__vm_lift_${rand}`;
    }
    usedNames.add(name);
    return name;
  };

  const inserts = [];
  walk(ast, (node, parent, key, index) => {
    if (!isFunctionNode(node)) {
      return;
    }
    if (!parent || key === null || key === undefined || index === null || index === undefined) {
      return;
    }
    const container = parent[key];
    if (!Array.isArray(container)) {
      return;
    }
    const lifted = liftNestedVmCallbacksInFunction(node, style, makeHelperName);
    if (!lifted.length) {
      return;
    }
    inserts.push({
      container,
      index,
      nodes: lifted,
    });
  });

  const groups = new Map();
  inserts.forEach((entry) => {
    const existing = groups.get(entry.container) || [];
    existing.push(entry);
    groups.set(entry.container, existing);
  });
  groups.forEach((entries, container) => {
    entries.sort((a, b) => b.index - a.index);
    entries.forEach((entry) => {
      container.splice(entry.index, 0, ...entry.nodes);
    });
  });
}

function canVirtualizeFunction(fnNode, style) {
  if (hasNestedFunction(fnNode)) {
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
      case "VarargLiteral":
        unsupported = true;
        return;
      default:
        return;
    }
  });
  return !unsupported;
}

function buildBlockIds(count, rng) {
  const ids = [];
  const used = new Set();
  const max = 0x3fffffff;
  for (let i = 0; i < count; i += 1) {
    let id = 0;
    while (!id || used.has(id)) {
      id = rng.int(1, max);
    }
    used.add(id);
    ids.push(id);
  }
  return ids;
}

function buildDispatchTree(blocks, rng, emitBlock, indent = "") {
  if (!blocks.length) {
    return [`${indent}pc = 0`];
  }
  if (blocks.length === 1) {
    const lines = emitBlock(blocks[0]);
    return lines.map((line) => `${indent}${line}`);
  }
  const mid = Math.floor(blocks.length / 2);
  const left = blocks.slice(0, mid);
  const right = blocks.slice(mid);
  const lower = left[left.length - 1].id;
  const upper = right[0].id;
  const bound = lower + 1 <= upper ? rng.int(lower + 1, upper) : upper;
  const lines = [];
  lines.push(`${indent}if pc < ${bound} then`);
  lines.push(...buildDispatchTree(left, rng, emitBlock, `${indent}  `));
  lines.push(`${indent}else`);
  lines.push(...buildDispatchTree(right, rng, emitBlock, `${indent}  `));
  lines.push(`${indent}end`);
  return lines;
}

function buildSparseDispatch(blocks, rng, emitBlock, indent = "", { fakeEdges = true } = {}) {
  if (!blocks.length) {
    return [`${indent}pc = 0`];
  }
  const blockIds = new Set(blocks.map((block) => block.id));
  const bucketCount = Math.max(3, Math.min(11, Math.floor(Math.sqrt(blocks.length)) + 1));
  const salt = rng.int(9, 251);
  const buckets = Array.from({ length: bucketCount }, () => []);
  for (const block of blocks) {
    const idx = (block.id + salt) % bucketCount;
    buckets[idx].push(block);
  }
  buckets.forEach((bucket) => rng.shuffle(bucket));

  const fakeEntries = Array.from({ length: bucketCount }, (_, idx) => {
    let fakeId = 0;
    while (!fakeId || blockIds.has(fakeId)) {
      fakeId = rng.int(1, 0x3fffffff);
    }
    const fallback = buckets[idx].length
      ? rng.pick(buckets[idx]).id
      : blocks[0].id;
    return { id: fakeId, fallback };
  });
  const noiseSeed = rng.int(100, 0x7fff);
  const makeDispatchName = () => `d${rng.int(1, 0x3fffffff).toString(36)}`;
  const saltName = makeDispatchName();
  const bucketCountName = makeDispatchName();
  const noiseName = makeDispatchName();
  const bucketName = makeDispatchName();

  const lines = [];
  lines.push(`${indent}local ${saltName} = ${salt}`);
  lines.push(`${indent}local ${bucketCountName} = ${bucketCount}`);
  lines.push(`${indent}local ${noiseName} = ${noiseSeed}`);
  lines.push(`${indent}while pc ~= 0 do`);
  lines.push(`${indent}  local ${bucketName} = ((pc + ${saltName}) % ${bucketCountName}) + 1`);
  lines.push(`${indent}  ${noiseName} = (${noiseName} + ${bucketName} + top + 1) % 2147483647`);

  for (let i = 0; i < bucketCount; i += 1) {
    const prefix = i === 0 ? "if" : "elseif";
    lines.push(`${indent}  ${prefix} ${bucketName} == ${i + 1} then`);
    if (fakeEdges) {
      lines.push(`${indent}    if ${noiseName} < 0 then`);
      lines.push(`${indent}      pc = ${fakeEntries[i].id}`);
      lines.push(`${indent}    end`);
    }
    const bucket = buckets[i];
    if (!bucket.length) {
      lines.push(`${indent}    if pc == ${fakeEntries[i].id} then`);
      lines.push(`${indent}      pc = ${fakeEntries[i].fallback}`);
      lines.push(`${indent}    else`);
      lines.push(`${indent}      pc = 0`);
      lines.push(`${indent}    end`);
      continue;
    }
    for (let j = 0; j < bucket.length; j += 1) {
      const block = bucket[j];
      const branch = j === 0 ? "if" : "elseif";
      lines.push(`${indent}    ${branch} pc == ${block.id} then`);
      const emitted = emitBlock(block);
      emitted.forEach((line) => lines.push(`${indent}      ${line}`));
    }
    lines.push(`${indent}    elseif pc == ${fakeEntries[i].id} then`);
    lines.push(`${indent}      pc = ${fakeEntries[i].fallback}`);
    lines.push(`${indent}    else`);
    lines.push(`${indent}      pc = 0`);
    lines.push(`${indent}    end`);
  }
  lines.push(`${indent}  else`);
  lines.push(`${indent}    pc = 0`);
  lines.push(`${indent}  end`);
  lines.push(`${indent}end`);
  return lines;
}

function buildVmSource(
  program,
  opcodeInfo,
  paramNames,
  seedState,
  keySchedule,
  bcInfo,
  constInfo,
  rng,
  vmOptions = {},
  reservedNames = null,
  opcodeList = OPCODES,
  isaProfile = null
) {
  const constCount = constInfo ? constInfo.count : program.consts.length;
  const blockDispatch = Boolean(vmOptions.blockDispatch);
  const useBytecodeStream = !blockDispatch && vmOptions.bytecodeEncrypt !== false;
  const localsInit = (paramNames || []).map((name) => (name ? name : "nil"));
  const localsTable = `{ ${localsInit.join(", ")} }`;
  const seedPieces = seedState ? seedState.pieces : [];
  const keyMaskPieces = keySchedule ? keySchedule.maskPieces : null;
  const keyEncoded = keySchedule ? keySchedule.encoded : null;
  const opEncoded = opcodeInfo ? opcodeInfo.encoded : null;
  const opKeyPieces = opcodeInfo ? opcodeInfo.keyPieces : null;
  const LUA_KEYWORDS = new Set([
    "and",
    "break",
    "do",
    "else",
    "elseif",
    "end",
    "false",
    "for",
    "function",
    "if",
    "in",
    "local",
    "nil",
    "not",
    "or",
    "repeat",
    "return",
    "then",
    "true",
    "until",
    "while",
  ]);
  const RESERVED_NAMES = new Set([
    "bc",
    "seed",
    "locals",
    "stack",
    "top",
    "pc",
    "env",
    "pack",
    "unpack",
    "math",
    "string",
    "table",
    "_G",
    "_ENV",
    "bit32",
    "debug",
    "utf8",
  ]);
  const nameUsed = new Set();
  if (reservedNames && typeof reservedNames.forEach === "function") {
    reservedNames.forEach((name) => {
      if (name) {
        nameUsed.add(name);
      }
    });
  }
  const firstAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const restAlphabet = `${firstAlphabet}0123456789`;
  const makeName = () => {
    let out = "";
    while (!out || LUA_KEYWORDS.has(out) || RESERVED_NAMES.has(out) || nameUsed.has(out) || out.toLowerCase().includes("obf")) {
      const length = rng.int(4, 8);
      let name = firstAlphabet[rng.int(0, firstAlphabet.length - 1)];
      for (let i = 1; i < length; i += 1) {
        name += restAlphabet[rng.int(0, restAlphabet.length - 1)];
      }
      out = name;
    }
    nameUsed.add(out);
    return out;
  };
  const bitNames = {
    mod: makeName(),
    bit: makeName(),
    norm: makeName(),
    u64: makeName(),
    from: makeName(),
    lo: makeName(),
    add: makeName(),
    modn: makeName(),
    modSmall: makeName(),
    bxor64: makeName(),
    band64: makeName(),
    bor64: makeName(),
    bnot64: makeName(),
    lshift64: makeName(),
    rshift64: makeName(),
    bxor32: makeName(),
    band32: makeName(),
    bor32: makeName(),
    bnot32: makeName(),
    lshift32: makeName(),
    rshift32: makeName(),
  };
  const helperNames = {
    getConst: makeName(),
    getInst: makeName(),
    byte: makeName(),
    u32: makeName(),
    partByte: makeName(),
    constEntry: makeName(),
  };
  const vmStateNames = {
    bcKeyCount: makeName(),
  };
  const vmMeta = {
    isaKeyA: makeName(),
    isaKeyB: makeName(),
  };
  const decoyNames = {
    pool: makeName(),
    key: makeName(),
    decode: makeName(),
    vm: makeName(),
    pc: makeName(),
    stack: makeName(),
    sink: makeName(),
    guard: makeName(),
    token: makeName(),
    opcode: makeName(),
    probe: makeName(),
  };
  const activeIsa = isaProfile || {
    enabled: false,
    keyA: 0,
    keyB: 0,
    stackProtocol: "direct",
    dispatchGraph: "tree",
    fakeEdges: false,
  };
  const runtimeTools = {
    bundle: makeName(),
    char: makeName(),
    byte: makeName(),
    concat: makeName(),
    pack: makeName(),
    unpack: makeName(),
    select: makeName(),
    type: makeName(),
    floor: makeName(),
    getfenv: makeName(),
  };
  const call = (fn, args) => `${fn}(${args.join(", ")})`;
  const u64from = (v) => call(bitNames.from, [v]);
  const u64lo = (v) => call(bitNames.lo, [v]);
  const u64add = (a, b) => call(bitNames.add, [a, b]);
  const u64mod = (a, m) => call(bitNames.modn, [a, m]);
  const u64modSmall = (a) => call(bitNames.modSmall, [a]);
  const bxor64 = (a, b) => call(bitNames.bxor64, [a, b]);
  const band64 = (a, b) => call(bitNames.band64, [a, b]);
  const bor64 = (a, b) => call(bitNames.bor64, [a, b]);
  const lshift64 = (a, b) => call(bitNames.lshift64, [a, b]);
  const rshift64 = (a, b) => call(bitNames.rshift64, [a, b]);
  const bnot64 = (a) => call(bitNames.bnot64, [a]);
  const bxor32 = (a, b) => call(bitNames.bxor32, [a, b]);
  const band32 = (a, b) => call(bitNames.band32, [a, b]);
  const bor32 = (a, b) => call(bitNames.bor32, [a, b]);
  const lshift32 = (a, b) => call(bitNames.lshift32, [a, b]);
  const rshift32 = (a, b) => call(bitNames.rshift32, [a, b]);
  const bnot32 = (a) => call(bitNames.bnot32, [a]);

  const lines = [
    `do`,
  ];
  lines.push(
    `local ${runtimeTools.bundle} = { string.char, string.byte, table.concat, table.pack, table.unpack, select, type, math.floor, getfenv }`,
    `local ${runtimeTools.char} = ${runtimeTools.bundle}[1]`,
    `local ${runtimeTools.byte} = ${runtimeTools.bundle}[2]`,
    `local ${runtimeTools.concat} = ${runtimeTools.bundle}[3]`,
    `local ${runtimeTools.pack} = ${runtimeTools.bundle}[4]`,
    `local ${runtimeTools.unpack} = ${runtimeTools.bundle}[5]`,
    `local ${runtimeTools.select} = ${runtimeTools.bundle}[6]`,
    `local ${runtimeTools.type} = ${runtimeTools.bundle}[7]`,
    `local ${runtimeTools.floor} = ${runtimeTools.bundle}[8]`,
    `local ${runtimeTools.getfenv} = ${runtimeTools.bundle}[9]`,
  );
  const upperPoolLines = [];
  const lowerPoolLines = [];
  let upperPoolInsertIndex = lines.length;
  const poolPlacementMode = normalizeVmMode(
    vmOptions.poolPlacement,
    new Set(["auto", "top", "bottom", "spread"]),
    "spread"
  );
  const resolvePoolPlacement = () => {
    if (poolPlacementMode === "top" || poolPlacementMode === "bottom") {
      return poolPlacementMode;
    }
    return rng.bool(0.5) ? "top" : "bottom";
  };
  const appendPoolLines = (_kind, poolLines) => {
    if (!poolLines || !poolLines.length) return;
    if (resolvePoolPlacement() === "top") {
      upperPoolLines.push(...poolLines);
    } else {
      lowerPoolLines.push(...poolLines);
    }
  };
  const appendPoolAssignments = (kind, target, values) => {
    for (let i = 0; i < values.length; i += 1) {
      appendPoolLines(`${kind}_${i + 1}`, [`${target}[${i + 1}] = ${values[i]}`]);
    }
  };
  lines.push(
    `local bc_parts, bc_order, bc_part_lengths = {}, {}, {}`,
    `local const_parts, const_order, const_part_sizes, consts_data = {}, {}, {}, {}`
  );
  upperPoolInsertIndex = lines.length;

  const bitNameBytes = [98, 105, 116, 51, 50];
  const bitKey = rng.int(11, 200);
  const bitEncoded = bitNameBytes.map((value) => (value - bitKey + 256) % 256);
  lines.push(`local ${bitNames.mod} = 4294967296`);
  lines.push(`local ${bitNames.bit}`);
  lines.push(`do`);
  lines.push(`  local k = ${bitKey}`);
  lines.push(`  local d = { ${bitEncoded.join(", ")} }`);
  lines.push(`  local out = {}`);
  lines.push(`  for i = 1, #d do`);
  lines.push(`    out[i] = ${runtimeTools.char}((d[i] + k) % 256)`);
  lines.push(`  end`);
  lines.push(`  local env`);
  lines.push(`  local getf = ${runtimeTools.getfenv}`);
  lines.push(`  if ${runtimeTools.type}(getf) == "function" then env = getf(1) end`);
  lines.push(`  if ${runtimeTools.type}(env) ~= "table" then env = _G end`);
  lines.push(`  ${bitNames.bit} = env[${runtimeTools.concat}(out)]`);
  lines.push(`end`);
  lines.push(`if ${bitNames.bit} == nil then`);
  lines.push(`  local function ${bitNames.norm}(x)`);
  lines.push(`    x = x % ${bitNames.mod}`);
  lines.push(`    if x < 0 then x = x + ${bitNames.mod} end`);
  lines.push(`    return x`);
  lines.push(`  end`);
  lines.push(`  ${bitNames.bit} = {}`);
  lines.push(`  function ${bitNames.bit}.band(a, b)`);
  lines.push(`    a = ${bitNames.norm}(a)`);
  lines.push(`    b = ${bitNames.norm}(b)`);
  lines.push(`    local res = 0`);
  lines.push(`    local bit = 1`);
  lines.push(`    for i = 0, 31 do`);
  lines.push(`      local abit = a % 2`);
  lines.push(`      local bbit = b % 2`);
  lines.push(`      if abit == 1 and bbit == 1 then res = res + bit end`);
  lines.push(`      a = (a - abit) / 2`);
  lines.push(`      b = (b - bbit) / 2`);
  lines.push(`      bit = bit * 2`);
  lines.push(`    end`);
  lines.push(`    return res`);
  lines.push(`  end`);
  lines.push(`  function ${bitNames.bit}.bor(a, b)`);
  lines.push(`    a = ${bitNames.norm}(a)`);
  lines.push(`    b = ${bitNames.norm}(b)`);
  lines.push(`    local res = 0`);
  lines.push(`    local bit = 1`);
  lines.push(`    for i = 0, 31 do`);
  lines.push(`      local abit = a % 2`);
  lines.push(`      local bbit = b % 2`);
  lines.push(`      if abit == 1 or bbit == 1 then res = res + bit end`);
  lines.push(`      a = (a - abit) / 2`);
  lines.push(`      b = (b - bbit) / 2`);
  lines.push(`      bit = bit * 2`);
  lines.push(`    end`);
  lines.push(`    return res`);
  lines.push(`  end`);
  lines.push(`  function ${bitNames.bit}.bxor(a, b)`);
  lines.push(`    a = ${bitNames.norm}(a)`);
  lines.push(`    b = ${bitNames.norm}(b)`);
  lines.push(`    local res = 0`);
  lines.push(`    local bit = 1`);
  lines.push(`    for i = 0, 31 do`);
  lines.push(`      local abit = a % 2`);
  lines.push(`      local bbit = b % 2`);
  lines.push(`      if abit + bbit == 1 then res = res + bit end`);
  lines.push(`      a = (a - abit) / 2`);
  lines.push(`      b = (b - bbit) / 2`);
  lines.push(`      bit = bit * 2`);
  lines.push(`    end`);
  lines.push(`    return res`);
  lines.push(`  end`);
  lines.push(`  function ${bitNames.bit}.bnot(a)`);
  lines.push(`    return ${bitNames.mod} - 1 - ${bitNames.norm}(a)`);
  lines.push(`  end`);
  lines.push(`  function ${bitNames.bit}.lshift(a, b)`);
  lines.push(`    b = b % 32`);
  lines.push(`    return (${bitNames.norm}(a) * (2 ^ b)) % ${bitNames.mod}`);
  lines.push(`  end`);
  lines.push(`  function ${bitNames.bit}.rshift(a, b)`);
  lines.push(`    b = b % 32`);
  lines.push(`    return ${runtimeTools.floor}(${bitNames.norm}(a) / (2 ^ b))`);
  lines.push(`  end`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.u64}(hi, lo)`);
  lines.push(`  return { hi, lo }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.from}(v)`);
  lines.push(`  return { 0, v % ${bitNames.mod} }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.lo}(v)`);
  lines.push(`  return v[2]`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.add}(a, b)`);
  lines.push(`  local lo = a[2] + b[2]`);
  lines.push(`  local carry = 0`);
  lines.push(`  if lo >= ${bitNames.mod} then`);
  lines.push(`    lo = lo - ${bitNames.mod}`);
  lines.push(`    carry = 1`);
  lines.push(`  end`);
  lines.push(`  local hi = (a[1] + b[1] + carry) % ${bitNames.mod}`);
  lines.push(`  return { hi, lo }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.modn}(a, m)`);
  lines.push(`  local v = (a[1] % m) * (${bitNames.mod} % m) + (a[2] % m)`);
  lines.push(`  return v % m`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.modSmall}(a)`);
  lines.push(`  local v = (a[1] % 255) + (a[2] % 255)`);
  lines.push(`  return v % 255`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bxor64}(a, b)`);
  lines.push(`  return { ${bitNames.bit}.bxor(a[1], b[1]), ${bitNames.bit}.bxor(a[2], b[2]) }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.band64}(a, b)`);
  lines.push(`  return { ${bitNames.bit}.band(a[1], b[1]), ${bitNames.bit}.band(a[2], b[2]) }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bor64}(a, b)`);
  lines.push(`  return { ${bitNames.bit}.bor(a[1], b[1]), ${bitNames.bit}.bor(a[2], b[2]) }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bnot64}(a)`);
  lines.push(`  return { ${bitNames.bit}.bnot(a[1]), ${bitNames.bit}.bnot(a[2]) }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.lshift64}(a, b)`);
  lines.push(`  b = b % 64`);
  lines.push(`  if b == 0 then`);
  lines.push(`    return { a[1], a[2] }`);
  lines.push(`  end`);
  lines.push(`  if b >= 32 then`);
  lines.push(`    local hi = ${bitNames.bit}.lshift(a[2], b - 32)`);
  lines.push(`    return { hi, 0 }`);
  lines.push(`  end`);
  lines.push(`  local hi = ${bitNames.bit}.bor(${bitNames.bit}.lshift(a[1], b), ${bitNames.bit}.rshift(a[2], 32 - b))`);
  lines.push(`  local lo = ${bitNames.bit}.lshift(a[2], b)`);
  lines.push(`  return { hi, lo }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.rshift64}(a, b)`);
  lines.push(`  b = b % 64`);
  lines.push(`  if b == 0 then`);
  lines.push(`    return { a[1], a[2] }`);
  lines.push(`  end`);
  lines.push(`  if b >= 32 then`);
  lines.push(`    local lo = ${bitNames.bit}.rshift(a[1], b - 32)`);
  lines.push(`    return { 0, lo }`);
  lines.push(`  end`);
  lines.push(`  local hi = ${bitNames.bit}.rshift(a[1], b)`);
  lines.push(`  local lo = ${bitNames.bit}.bor(${bitNames.bit}.rshift(a[2], b), ${bitNames.bit}.lshift(a[1], 32 - b))`);
  lines.push(`  return { hi, lo }`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bxor32}(a, b)`);
  lines.push(`  return ${bitNames.bit}.bxor(a, b)`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.band32}(a, b)`);
  lines.push(`  return ${bitNames.bit}.band(a, b)`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bor32}(a, b)`);
  lines.push(`  return ${bitNames.bit}.bor(a, b)`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.bnot32}(a)`);
  lines.push(`  return ${bitNames.bit}.bnot(a)`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.lshift32}(a, b)`);
  lines.push(`  return ${bitNames.bit}.lshift(a, b)`);
  lines.push(`end`);
  lines.push(`local function ${bitNames.rshift32}(a, b)`);
  lines.push(`  return ${bitNames.bit}.rshift(a, b)`);
  lines.push(`end`);

  if (!blockDispatch && !useBytecodeStream) {
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
  }

  if (seedPieces.length) {
    const bcLenExpr = !blockDispatch && !useBytecodeStream
      ? "#bc"
      : String(program.instructions.length);
    lines.push(`local seed_pieces = { ${seedPieces.join(", ")} }`);
    lines.push(`local seed = ${u64from("0")}`);
    lines.push(`for i = 1, #seed_pieces do`);
    lines.push(`  local v = seed_pieces[i]`);
    lines.push(`  local v64 = ${u64from("v")}`);
    lines.push(`  seed = ${bxor64(u64add("seed", "v64"), band64(lshift64("v64", "(i - 1) % 3"), u64from("0xff")))}`);
    lines.push(`  seed = ${band64("seed", u64from("0xff"))}`);
    lines.push(`end`);
    lines.push(`seed = ${u64modSmall(u64add("seed", u64from(`${bcLenExpr} + ${constCount}`)))}`);
  } else {
    lines.push(`local seed = 0`);
  }
  lines.push(`local ${vmMeta.isaKeyA} = ${activeIsa.keyA || 0}`);
  lines.push(`local ${vmMeta.isaKeyB} = ${activeIsa.keyB || 0}`);

  if (!blockDispatch && opEncoded && opKeyPieces) {
    lines.push(`local op_data = { ${opEncoded.join(", ")} }`);
    lines.push(`local op_key = ${opKeyPieces[0]} + ${opKeyPieces[1]} + seed`);
    lines.push(`op_key = (op_key % 255) + 1`);
    lines.push(`local op_map = {}`);
    lines.push(`for i = 1, #op_data do`);
    lines.push(`  local mix = i - 1`);
    lines.push(`  mix = mix * 7`);
    lines.push(`  mix = mix + op_key`);
    lines.push(`  mix = mix % 255`);
    lines.push(`  op_map[i] = ${bxor32("op_data[i]", "mix")}`);
    lines.push(`end`);
    const opConst = opcodeList.map((name, idx) => (
      `local OP_${name} = op_map[${buildIndexExpression(idx + 1, rng)}]`
    )).join("\n");
    lines.push(opConst);
  }

  if (!blockDispatch && keyEncoded && keyMaskPieces) {
    lines.push(`local bc_key_data = { ${keyEncoded.join(", ")} }`);
    lines.push(`local bc_key_mask = ${bxor32(String(keyMaskPieces[0]), String(keyMaskPieces[1]))} + seed`);
    lines.push(`bc_key_mask = (bc_key_mask % 255) + 1`);
    lines.push(`local bc_keys = {}`);
    lines.push(`for i = 1, #bc_key_data do`);
    lines.push(`  local mix = i - 1`);
    lines.push(`  mix = mix * 13`);
    lines.push(`  mix = mix + bc_key_mask`);
    lines.push(`  mix = mix % 255`);
    lines.push(`  bc_keys[i] = ${bxor32("bc_key_data[i]", "mix")}`);
    lines.push(`end`);
    lines.push(`local ${vmStateNames.bcKeyCount} = #bc_keys`);
  } else {
    lines.push(`local bc_keys = {}`);
    lines.push(`local ${vmStateNames.bcKeyCount} = 0`);
  }

  const decoyProbability = typeof vmOptions.decoyProbability === "number"
    ? vmOptions.decoyProbability
    : 0.85;
  const enableDecoyVm = vmOptions.decoyRuntime !== false
    && rng.bool(Math.max(0, Math.min(1, decoyProbability)));
  if (enableDecoyVm) {
    const decoyCountRaw = Number(vmOptions.decoyStrings);
    const decoyCount = Number.isFinite(decoyCountRaw)
      ? Math.max(4, Math.min(96, Math.floor(decoyCountRaw)))
      : 12;
    const decoyShift = rng.int(5, 37);
    const decoyStrings = buildDecoyVmStrings(rng, decoyCount);
    const decoyEncoded = decoyStrings.map((text) => {
      const bytes = [];
      for (let i = 0; i < text.length; i += 1) {
        bytes.push((text.charCodeAt(i) + decoyShift) & 0xff);
      }
      return luaByteString(bytes);
    });
    const decoyOrder = Array.from({ length: decoyEncoded.length }, (_, idx) => idx + 1);
    rng.shuffle(decoyOrder);
    lines.push(`local ${decoyNames.pool} = {}`);
    for (const idx of decoyOrder) {
      lines.push(`${decoyNames.pool}[${idx}] = ${decoyEncoded[idx - 1]}`);
    }
    lines.push(`local ${decoyNames.key} = (${decoyShift} + (seed - seed)) % 256`);
    lines.push(`local function ${decoyNames.decode}(i)`);
    lines.push(`  local raw = ${decoyNames.pool}[i]`);
    lines.push(`  if not raw then return nil end`);
    lines.push(`  local out = {}`);
    lines.push(`  for j = 1, #raw do`);
    lines.push(`    local v = ${runtimeTools.byte}(raw, j) - ${decoyNames.key}`);
    lines.push(`    if v < 0 then v = v + 256 end`);
    lines.push(`    out[j] = ${runtimeTools.char}(v)`);
    lines.push(`  end`);
    lines.push(`  return ${runtimeTools.concat}(out)`);
    lines.push(`end`);
    lines.push(`local function ${decoyNames.vm}(${decoyNames.pc}, ${decoyNames.stack})`);
    lines.push(`  local ${decoyNames.sink} = 0`);
    lines.push(`  local ${decoyNames.guard} = 0`);
    lines.push(`  while ${decoyNames.pc} > 0 do`);
    lines.push(`    ${decoyNames.guard} = ${decoyNames.guard} + 1`);
    lines.push(`    if ${decoyNames.guard} > #${decoyNames.pool} then break end`);
    lines.push(`    local ${decoyNames.token} = ${decoyNames.decode}(${decoyNames.pc})`);
    lines.push(`    local ${decoyNames.opcode} = ${decoyNames.token} and (${runtimeTools.byte}(${decoyNames.token}, 1) % 6) or 0`);
    lines.push(`    if ${decoyNames.opcode} == 0 then`);
    lines.push(`      ${decoyNames.sink} = ${decoyNames.sink} + ${decoyNames.pc}`);
    lines.push(`      ${decoyNames.pc} = ${decoyNames.pc} + 1`);
    lines.push(`    elseif ${decoyNames.opcode} == 1 then`);
    lines.push(`      ${decoyNames.sink} = ${bxor32(decoyNames.sink, decoyNames.guard)}`);
    lines.push(`      ${decoyNames.pc} = ${decoyNames.pc} + 1`);
    lines.push(`    elseif ${decoyNames.opcode} == 2 then`);
    lines.push(`      ${decoyNames.sink} = ${decoyNames.sink} + (${decoyNames.token} and #${decoyNames.token} or 0)`);
    lines.push(`      ${decoyNames.pc} = ${decoyNames.pc} + 2`);
    lines.push(`    elseif ${decoyNames.opcode} == 3 then`);
    lines.push(`      ${decoyNames.pc} = 0`);
    lines.push(`    else`);
    lines.push(`      ${decoyNames.pc} = ${decoyNames.pc} + 1`);
    lines.push(`    end`);
    lines.push(`  end`);
    lines.push(`  return ${decoyNames.sink}, ${decoyNames.stack}`);
    lines.push(`end`);
    lines.push(`local ${decoyNames.probe} = (seed + ${vmStateNames.bcKeyCount} + #${decoyNames.pool}) % 19`);
    lines.push(`if ${decoyNames.probe} == 31 then`);
    lines.push(`  ${decoyNames.vm}(1, {})`);
    lines.push(`end`);
  }

  if (constInfo) {
    const constEncoding = vmOptions.constsEncoding === "table" ? "table" : "string";
    const renderConstEntry = (entry) => {
      if (constEncoding === "string") {
        return `{ ${entry.tag}, ${luaByteString(entry.data)} }`;
      }
      const data = entry.data.join(", ");
      return `{ ${entry.tag}, { ${data} } }`;
    };
    if (vmOptions.constsSplit && constInfo.entries.length > (vmOptions.constsSplitSize || 0)) {
      const parts = splitConstEntries(constInfo.entries, rng, vmOptions.constsSplitSize || 24);
      const storageOrder = parts.map((_, idx) => idx + 1);
      rng.shuffle(storageOrder);
      const storedParts = storageOrder.map((idx) => parts[idx - 1]);
      const logicalOrder = new Array(parts.length);
      storageOrder.forEach((partIndex, storageIndex) => {
        logicalOrder[partIndex - 1] = storageIndex + 1;
      });
      const partStrings = storedParts.map((part) => `{ ${part.map(renderConstEntry).join(", ")} }`);
      const logicalSizes = parts.map((part) => part.length);
      appendPoolAssignments("const_parts", "const_parts", partStrings);
      appendPoolAssignments("const_order", "const_order", logicalOrder.map(String));
      appendPoolAssignments("const_part_sizes", "const_part_sizes", logicalSizes.map(String));
      lines.push(`local function ${helperNames.constEntry}(i)`);
      lines.push(`  local offset = 0`);
      lines.push(`  for p = 1, #const_part_sizes do`);
      lines.push(`    local size = const_part_sizes[p]`);
      lines.push(`    local limit = offset + size`);
      lines.push(`    if i <= limit then`);
      lines.push(`      local part = const_parts[const_order[p]]`);
      lines.push(`      return part[i - offset]`);
      lines.push(`    end`);
      lines.push(`    offset = limit`);
      lines.push(`  end`);
      lines.push(`  return nil`);
      lines.push(`end`);
    } else {
      const constEntries = constInfo.entries.map(renderConstEntry);
      appendPoolAssignments("consts_data", "consts_data", constEntries);
      lines.push(`local function ${helperNames.constEntry}(i)`);
      lines.push(`  return consts_data[i]`);
      lines.push(`end`);
    }
    lines.push(`local consts_key_enc = { ${constInfo.keyEncoded.join(", ")} }`);
    lines.push(`local consts_key = {}`);
    lines.push(`local consts_cache = {}`);
    lines.push(`local consts_ready = {}`);
    lines.push(`local const_key_mask = ${bxor32(String(constInfo.maskPieces[0]), String(constInfo.maskPieces[1]))} + seed`);
    lines.push(`const_key_mask = (const_key_mask % 255) + 1`);
    lines.push(`for i = 1, #consts_key_enc do`);
    lines.push(`  local mix = i - 1`);
    lines.push(`  mix = mix * 11`);
    lines.push(`  mix = mix + const_key_mask`);
    lines.push(`  mix = mix % 255`);
    lines.push(`  consts_key[i] = ${bxor32("consts_key_enc[i]", "mix")}`);
    lines.push(`end`);
    lines.push(`local keyLen = #consts_key`);
    if (constEncoding === "string") {
      lines.push(`local const_byte = ${runtimeTools.byte}`);
    }
    lines.push(`local function ${helperNames.getConst}(i)`);
    lines.push(`  if consts_ready[i] then`);
    lines.push(`    return consts_cache[i]`);
    lines.push(`  end`);
    lines.push(`  consts_ready[i] = true`);
    lines.push(`  local entry = ${helperNames.constEntry}(i)`);
    lines.push(`  if not entry then`);
    lines.push(`    return nil`);
    lines.push(`  end`);
    lines.push(`  local tag = entry[1]`);
    lines.push(`  local data = entry[2]`);
    lines.push(`  local out = {}`);
    lines.push(`  for j = 1, #data do`);
    lines.push(`    local idx = (j - 1) % keyLen + 1`);
    if (constEncoding === "string") {
      lines.push(`    local v = const_byte(data, j) - consts_key[idx]`);
    } else {
      lines.push(`    local v = data[j] - consts_key[idx]`);
    }
    lines.push(`    if v < 0 then v = v + 256 end`);
    lines.push(`    out[j] = ${runtimeTools.char}(v)`);
    lines.push(`  end`);
    lines.push(`  local s = ${runtimeTools.concat}(out)`);
    lines.push(`  local value`);
    lines.push(`  if tag == 0 then`);
    lines.push(`    value = nil`);
    lines.push(`  elseif tag == 1 then`);
    lines.push(`    value = false`);
    lines.push(`  elseif tag == 2 then`);
    lines.push(`    value = true`);
    lines.push(`  elseif tag == 3 then`);
    lines.push(`    value = tonumber(s)`);
    lines.push(`  else`);
    lines.push(`    value = s`);
    lines.push(`  end`);
    lines.push(`  consts_cache[i] = value`);
    lines.push(`  return value`);
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
    lines.push(`local function ${helperNames.getConst}(i)`);
    lines.push(`  return consts[i]`);
    lines.push(`end`);
  }

  lines.push(
    `local locals = ${localsTable}`,
    `local stack = {}`,
    `local top = 0`,
    `local env`,
    `local getf = ${runtimeTools.getfenv}`,
    `if ${runtimeTools.type}(getf) == "function" then env = getf(1) end`,
    `if ${runtimeTools.type}(env) ~= "table" then env = _G end`,
    `local pack = ${runtimeTools.pack}`,
    `if pack == nil then`,
    `  pack = function(...) return { n = ${runtimeTools.select}("#", ...), ... } end`,
    `end`,
    `local unpack = ${runtimeTools.unpack}`,
    `if unpack == nil then`,
    `  local function unpack_fn(t, i, j)`,
    `    i = i or 1`,
    `    j = j or (t.n or #t)`,
    `    if i > j then return end`,
    `    return t[i], unpack_fn(t, i + 1, j)`,
    `  end`,
    `  unpack = unpack_fn`,
    `end`,
  );

  if (useBytecodeStream) {
    const stream = encodeBytecodeStream(program.instructions, rng, seedState, bcInfo);
    const partStrings = stream.parts.map((part) => bytesToLuaString(part));
    const logicalPartLengths = stream.order.map((storageIndex) => stream.parts[storageIndex - 1].length);
    appendPoolAssignments("bc_parts", "bc_parts", partStrings);
    appendPoolAssignments("bc_order", "bc_order", stream.order.map(String));
    appendPoolAssignments("bc_part_lengths", "bc_part_lengths", logicalPartLengths.map(String));
    lines.push(`local bc_key = ${stream.keyPieces[0]} + ${stream.keyPieces[1]} + seed`);
    lines.push(`bc_key = (bc_key % 255) + 1`);
    lines.push(`local bc_byte = ${runtimeTools.byte}`);
    lines.push(`local function ${helperNames.partByte}(pos)`);
    lines.push(`  local offset = 0`);
    lines.push(`  for p = 1, #bc_order do`);
    lines.push(`    local len = bc_part_lengths[p]`);
    lines.push(`    local limit = offset + len`);
    lines.push(`    if pos <= limit then`);
    lines.push(`      local part = bc_parts[bc_order[p]]`);
    lines.push(`      return bc_byte(part, pos - offset)`);
    lines.push(`    end`);
    lines.push(`    offset = limit`);
    lines.push(`  end`);
    lines.push(`  return nil`);
    lines.push(`end`);
    lines.push(`local function ${helperNames.byte}(i)`);
    lines.push(`  local b = ${helperNames.partByte}(i)`);
    lines.push(`  if b == nil then`);
    lines.push(`    return 0`);
    lines.push(`  end`);
    lines.push(`  local mix = i - 1`);
    lines.push(`  mix = mix * 17`);
    lines.push(`  mix = mix + bc_key`);
    lines.push(`  mix = mix % 256`);
    lines.push(`  return ${bxor32("b", "mix")}`);
    lines.push(`end`);
    lines.push(`local function ${helperNames.u32}(pos)`);
    lines.push(`  local b1 = ${helperNames.byte}(pos)`);
    lines.push(`  local b2 = ${helperNames.byte}(pos + 1)`);
    lines.push(`  local b3 = ${helperNames.byte}(pos + 2)`);
    lines.push(`  local b4 = ${helperNames.byte}(pos + 3)`);
    lines.push(`  return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216`);
    lines.push(`end`);
    lines.push(`local function ${helperNames.getInst}(pc)`);
    lines.push(`  local base = pc - 1`);
    lines.push(`  base = base * 12 + 1`);
    lines.push(`  local op = ${helperNames.u32}(base)`);
    lines.push(`  local a = ${helperNames.u32}(base + 4)`);
    lines.push(`  local b = ${helperNames.u32}(base + 8)`);
    lines.push(`  return op, a, b`);
    lines.push(`end`);
  }

  if (lowerPoolLines.length) {
    lines.push(...lowerPoolLines);
    lowerPoolLines.length = 0;
  }

  if (blockDispatch) {
    const ids = buildBlockIds(program.instructions.length, rng);
    const idByIndex = new Map();
    const blocks = program.instructions.map((inst, idx) => {
      const entry = {
        id: ids[idx],
        index: idx + 1,
        op: inst[0],
        a: inst[1] || 0,
        b: inst[2] || 0,
      };
      idByIndex.set(entry.index, entry.id);
      return entry;
    });
    const entryId = ids[0] || 0;
    const sorted = blocks.slice().sort((a, b) => a.id - b.id);
    const emitBlock = (block) => {
      const opName = typeof block.op === "string" ? block.op : (opcodeList[block.op - 1] || "NOP");
      const a = block.a || 0;
      const b = block.b || 0;
      const isX = typeof opName === "string" && opName.endsWith("_X");
      const aExpr = isX ? bxor32(String(a), vmMeta.isaKeyA) : String(a);
      const bExpr = opName === "CALL_X" ? bxor32(String(b), vmMeta.isaKeyB) : String(b);
      const aValue = isX ? (a ^ (activeIsa.keyA || 0)) : a;
      const nextId = idByIndex.get(block.index + 1) || 0;
      const targetId = idByIndex.get(aValue) || 0;
      switch (opName) {
        case "NOP":
          return [`pc = ${nextId}`];
        case "PUSH_CONST":
        case "PUSH_CONST_X":
          return [
            activeIsa.stackProtocol === "api" ? "top = push(stack, top, nil)" : "top = top + 1",
            `stack[top] = ${helperNames.getConst}(${aExpr})`,
            `pc = ${nextId}`,
          ];
        case "PUSH_LOCAL":
        case "PUSH_LOCAL_X":
          return [
            activeIsa.stackProtocol === "api" ? "top = push(stack, top, nil)" : "top = top + 1",
            `stack[top] = locals[${aExpr}]`,
            `pc = ${nextId}`,
          ];
        case "SET_LOCAL":
        case "SET_LOCAL_X":
          return [
            `locals[${aExpr}] = stack[top]`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "PUSH_GLOBAL":
        case "PUSH_GLOBAL_X":
          return [
            activeIsa.stackProtocol === "api" ? "top = push(stack, top, nil)" : "top = top + 1",
            `stack[top] = env[${helperNames.getConst}(${aExpr})]`,
            `pc = ${nextId}`,
          ];
        case "SET_GLOBAL":
        case "SET_GLOBAL_X":
          return [
            `env[${helperNames.getConst}(${aExpr})] = stack[top]`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "NEW_TABLE":
          return [
            "top = top + 1",
            "stack[top] = {}",
            `pc = ${nextId}`,
          ];
        case "DUP":
          return [
            "top = top + 1",
            "stack[top] = stack[top - 1]",
            `pc = ${nextId}`,
          ];
        case "SWAP":
          return [
            "stack[top], stack[top - 1] = stack[top - 1], stack[top]",
            `pc = ${nextId}`,
          ];
        case "POP":
          return [
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "GET_TABLE":
          return [
            "local idx = stack[top]",
            "stack[top] = nil",
            "local base = stack[top - 1]",
            "stack[top - 1] = base[idx]",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "SET_TABLE":
          return [
            "local val = stack[top]",
            "stack[top] = nil",
            "local key = stack[top - 1]",
            "stack[top - 1] = nil",
            "local base = stack[top - 2]",
            "base[key] = val",
            "stack[top - 2] = nil",
            "top = top - 3",
            `pc = ${nextId}`,
          ];
        case "CALL":
        case "CALL_X":
          return [
            `local argc = ${aExpr}`,
            `local retc = ${bExpr}`,
            "local base = top - argc",
            "local fn = stack[base]",
            "if retc == 0 then",
            "  fn(unpack(stack, base + 1, top))",
            "  for i = top, base, -1 do",
            "    stack[i] = nil",
            "  end",
            "  top = base - 1",
            "else",
            "  local res = pack(fn(unpack(stack, base + 1, top)))",
            "  for i = top, base, -1 do",
            "    stack[i] = nil",
            "  end",
            "  top = base - 1",
            "  if retc == 1 then",
            "    top = top + 1",
            "    stack[top] = res[1]",
            "  else",
            "    for i = 1, retc do",
            "      top = top + 1",
            "      stack[top] = res[i]",
            "    end",
            "  end",
            "end",
            `pc = ${nextId}`,
          ];
        case "RETURN":
          return [
            `local count = ${a}`,
            "if count == 0 then",
            "  return",
            "elseif count == 1 then",
            "  return stack[top]",
            "else",
            "  local base = top - count + 1",
            "  return unpack(stack, base, top)",
            "end",
          ];
        case "JMP":
        case "JMP_X":
          return [`pc = ${targetId}`];
        case "JMP_IF_FALSE":
        case "JMP_IF_FALSE_X":
          return [
            "if not stack[top] then",
            `  pc = ${targetId}`,
            "else",
            `  pc = ${nextId}`,
            "end",
          ];
        case "JMP_IF_TRUE":
        case "JMP_IF_TRUE_X":
          return [
            "if stack[top] then",
            `  pc = ${targetId}`,
            "else",
            `  pc = ${nextId}`,
            "end",
          ];
        case "ADD":
          return [
            "stack[top - 1] = stack[top - 1] + stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "SUB":
          return [
            "stack[top - 1] = stack[top - 1] - stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "MUL":
          return [
            "stack[top - 1] = stack[top - 1] * stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "DIV":
          return [
            "stack[top - 1] = stack[top - 1] / stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "IDIV":
          return [
            `stack[top - 1] = ${runtimeTools.floor}(stack[top - 1] / stack[top])`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "MOD":
          return [
            "stack[top - 1] = stack[top - 1] % stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "POW":
          return [
            "stack[top - 1] = stack[top - 1] ^ stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "CONCAT":
          return [
            "stack[top - 1] = stack[top - 1] .. stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "EQ":
          return [
            "stack[top - 1] = stack[top - 1] == stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "NE":
          return [
            "stack[top - 1] = stack[top - 1] ~= stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "LT":
          return [
            "stack[top - 1] = stack[top - 1] < stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "LE":
          return [
            "stack[top - 1] = stack[top - 1] <= stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "GT":
          return [
            "stack[top - 1] = stack[top - 1] > stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "GE":
          return [
            "stack[top - 1] = stack[top - 1] >= stack[top]",
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "BAND":
          return [
            `stack[top - 1] = ${band32("stack[top - 1]", "stack[top]")}`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "BOR":
          return [
            `stack[top - 1] = ${bor32("stack[top - 1]", "stack[top]")}`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "BXOR":
          return [
            `stack[top - 1] = ${bxor32("stack[top - 1]", "stack[top]")}`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "SHL":
          return [
            `stack[top - 1] = ${lshift32("stack[top - 1]", "stack[top]")}`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "SHR":
          return [
            `stack[top - 1] = ${rshift32("stack[top - 1]", "stack[top]")}`,
            "stack[top] = nil",
            "top = top - 1",
            `pc = ${nextId}`,
          ];
        case "UNM":
          return [
            "stack[top] = -stack[top]",
            `pc = ${nextId}`,
          ];
        case "NOT":
          return [
            "stack[top] = not stack[top]",
            `pc = ${nextId}`,
          ];
        case "LEN":
          return [
            "stack[top] = #stack[top]",
            `pc = ${nextId}`,
          ];
        case "BNOT":
          return [
            `stack[top] = ${bnot32("stack[top]")}`,
            `pc = ${nextId}`,
          ];
        default:
          return [`pc = ${nextId}`];
      }
    };

    if (activeIsa.stackProtocol === "api") {
      lines.push(`local function push(arr, t, v)`);
      lines.push(`  t = t + 1`);
      lines.push(`  arr[t] = v`);
      lines.push(`  return t`);
      lines.push(`end`);
    }
    const dispatchMode = activeIsa.dispatchGraph === "auto"
      ? (sorted.length > 8 ? "sparse" : "tree")
      : activeIsa.dispatchGraph;
    lines.push(`local pc = ${entryId}`);
    if (dispatchMode === "sparse") {
      lines.push(...buildSparseDispatch(sorted, rng, emitBlock, "", { fakeEdges: activeIsa.fakeEdges }));
    } else {
      lines.push(`while pc ~= 0 do`);
      lines.push(...buildDispatchTree(sorted, rng, emitBlock, "  "));
      lines.push("end");
    }
    lines.push("end");
  } else {
    const loopLines = [
      `local pc = 1`,
      `while true do`,
    ];
    if (useBytecodeStream) {
      loopLines.push(`  local op, a, b = ${helperNames.getInst}(pc)`);
    } else {
      loopLines.push(`  local inst = bc[pc]`);
      loopLines.push(`  local op = inst[1]`);
      loopLines.push(`  local a = inst[2]`);
      loopLines.push(`  local b = inst[3]`);
    }
    loopLines.push(
      `  local key = 0`,
      `  if ${vmStateNames.bcKeyCount} > 0 then`,
      `    local idx = pc + seed - 1`,
      `    idx = idx % ${vmStateNames.bcKeyCount}`,
      `    idx = idx + 1`,
      `    key = bc_keys[idx]`,
      `    op = ${bxor32("op", "key")}`,
      `    a = ${bxor32("a", "key")}`,
      `    b = ${bxor32("b", "key")}`,
      `  end`,
      `  if op == OP_NOP then`,
      `    pc = pc + 1`,
      `  elseif op == OP_PUSH_CONST then`,
      `    top = top + 1`,
      `    stack[top] = ${helperNames.getConst}(a)`,
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
      `    stack[top] = env[${helperNames.getConst}(a)]`,
      `    pc = pc + 1`,
      `  elseif op == OP_SET_GLOBAL then`,
      `    env[${helperNames.getConst}(a)] = stack[top]`,
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
      `    stack[top - 2] = nil`,
      `    top = top - 3`,
      `    pc = pc + 1`,
      `  elseif op == OP_CALL then`,
      `    local argc = a`,
      `    local retc = b`,
      `    local base = top - argc`,
      `    local fn = stack[base]`,
      `    if retc == 0 then`,
      `      fn(unpack(stack, base + 1, top))`,
      `      for i = top, base, -1 do`,
      `        stack[i] = nil`,
      `      end`,
      `      top = base - 1`,
      `    else`,
      `      local res = pack(fn(unpack(stack, base + 1, top)))`,
      `      for i = top, base, -1 do`,
      `        stack[i] = nil`,
      `      end`,
      `      top = base - 1`,
      `      if retc == 1 then`,
      `        top = top + 1`,
      `        stack[top] = res[1]`,
      `      else`,
      `        for i = 1, retc do`,
      `          top = top + 1`,
      `          stack[top] = res[i]`,
      `        end`,
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
      `      local base = top - count + 1`,
      `      return unpack(stack, base, top)`,
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
      `    stack[top - 1] = ${runtimeTools.floor}(stack[top - 1] / stack[top])`,
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
      `    stack[top - 1] = ${band32("stack[top - 1]", "stack[top]")}`,
      `    stack[top] = nil`,
      `    top = top - 1`,
      `    pc = pc + 1`,
      `  elseif op == OP_BOR then`,
      `    stack[top - 1] = ${bor32("stack[top - 1]", "stack[top]")}`,
      `    stack[top] = nil`,
      `    top = top - 1`,
      `    pc = pc + 1`,
      `  elseif op == OP_BXOR then`,
      `    stack[top - 1] = ${bxor32("stack[top - 1]", "stack[top]")}`,
      `    stack[top] = nil`,
      `    top = top - 1`,
      `    pc = pc + 1`,
      `  elseif op == OP_SHL then`,
      `    stack[top - 1] = ${lshift32("stack[top - 1]", "stack[top]")}`,
      `    stack[top] = nil`,
      `    top = top - 1`,
      `    pc = pc + 1`,
      `  elseif op == OP_SHR then`,
      `    stack[top - 1] = ${rshift32("stack[top - 1]", "stack[top]")}`,
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
      `    stack[top] = ${bnot32("stack[top]")}`,
      `    pc = pc + 1`,
      `  else`,
      `    return`,
      `  end`,
      `end`,
      `end`,
    );
    lines.push(...loopLines);
  }

  if (upperPoolLines.length) {
    lines.splice(upperPoolInsertIndex, 0, ...upperPoolLines);
  }
  let vmSource = lines.join("\n");
  const coreAliases = {
    bc: makeName(),
    bc_keys: makeName(),
    consts: makeName(),
    locals: makeName(),
    stack: makeName(),
    top: makeName(),
    pc: makeName(),
    env: makeName(),
  };
  Object.entries(coreAliases).forEach(([from, to]) => {
    vmSource = replaceIdentifierToken(vmSource, from, to);
  });
  return vmSource;
}

function replaceFunctionBody(fnNode, vmAst, style) {
  const body = vmAst.body || [];
  if (style === "custom") {
    fnNode.body = { type: "Block", body };
    return;
  }
  fnNode.body = body;
}

function replaceChunkBody(ast, vmAst, prefix = null) {
  if (!ast || !Array.isArray(ast.body)) {
    return;
  }
  const prefixBody = Array.isArray(prefix) ? prefix : [];
  const vmBody = vmAst && Array.isArray(vmAst.body) ? vmAst.body : [];
  ast.body = [...prefixBody, ...vmBody];
}

function markVmNodes(vmAst) {
  if (!vmAst || typeof vmAst !== "object") {
    return;
  }
  vmAst.__obf_vm = true;
  walk(vmAst, (node) => {
    node.__obf_vm = true;
  });
}

function shouldVirtualizeTopLevelChunk(ast, options) {
  if (!ast || ast.type !== "Chunk") {
    return false;
  }
  if (ast.__obf_vm_chunk) {
    return false;
  }
  if (!options || !options.vm || options.vm.topLevel !== true) {
    return false;
  }
  return true;
}

function pushTopLevelLocalName(names, seen, name) {
  if (!name || typeof name !== "string" || name.includes(".")) {
    return;
  }
  if (seen.has(name)) {
    const index = names.indexOf(name);
    if (index !== -1) {
      names.splice(index, 1);
    }
  }
  seen.add(name);
  names.push(name);
}

function collectTopLevelPreboundLocals(statements) {
  const names = [];
  const seen = new Set();
  if (!Array.isArray(statements)) {
    return names;
  }
  statements.forEach((stmt) => {
    if (!stmt || !stmt.type) {
      return;
    }
    if (stmt.type === "LocalStatement") {
      const vars = Array.isArray(stmt.variables) ? stmt.variables : [];
      vars.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          pushTopLevelLocalName(names, seen, variable.name);
        }
      });
      return;
    }
    if (stmt.type === "FunctionDeclaration" && stmt.isLocal) {
      pushTopLevelLocalName(names, seen, getFunctionName(stmt));
    }
  });
  return names;
}

function buildTopLevelChunkPlan(ast) {
  const body = ast && Array.isArray(ast.body) ? ast.body : [];
  let splitIndex = 0;
  for (let i = 0; i < body.length; i += 1) {
    const stmt = body[i];
    if (stmt && stmt.type === "FunctionDeclaration") {
      splitIndex = i + 1;
    }
  }
  const prefix = body.slice(0, splitIndex);
  const statements = body.slice(splitIndex);
  const preboundLocals = collectTopLevelPreboundLocals(prefix);
  return {
    prefix,
    statements,
    preboundLocals,
  };
}

function virtualizeLuau(ast, ctx) {
  const style = ctx.options && ctx.options.luauParser === "luaparse" ? "luaparse" : "custom";
  liftNestedVmCallbacks(ast, ctx, style);
  const layers = Math.max(1, ctx.options.vm?.layers || 1);
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;
  for (let layer = 0; layer < layers; layer += 1) {
    const minStatements = ctx.options.vm?.minStatements ?? DEFAULT_MIN_STATEMENTS;

    walk(ast, (node) => {
      if (node && node.__obf_vm) {
        return;
      }
      if (node && node.__obf_skip_vm) {
        return;
      }
      if (!node || (node.type !== "FunctionDeclaration" && node.type !== "FunctionExpression")) {
        return;
      }
      const fnName = getFunctionName(node);
      if (fnName && fnName.startsWith("__obf_")) {
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
        const debug = Boolean(ctx.options.vm?.debug) || process.env.JS_OBF_VM_DEBUG === "1";
        if (debug) {
          const name = getFunctionName(node) || "<anonymous>";
          const message = err && err.message ? err.message : String(err);
          console.warn(`[js-obf] luau-vm skipped ${name}: ${message}`);
        }
        return;
      }

      injectFakeInstructions(program, ctx.rng, ctx.options.vm?.fakeOpcodes ?? 0);

      const blockDispatch = Boolean(ctx.options.vm?.blockDispatch);
      const isaProfile = blockDispatch
        ? applyPolymorphicBlockISA(program, ctx.rng, ctx.options.vm || {})
        : {
            enabled: false,
            keyA: 0,
            keyB: 0,
            stackProtocol: "direct",
            dispatchGraph: "tree",
            fakeEdges: false,
          };
      const opcodeList = Array.from(new Set([
        ...OPCODES,
        ...program.instructions
          .map((inst) => inst && inst[0])
          .filter((name) => typeof name === "string"),
      ]));
      const seedState = buildSeedState(ctx.rng, program.instructions.length, program.consts.length);
      let opcodeInfo = null;
      let keySchedule = null;
      let bcInfo = null;

      if (!blockDispatch) {
        const opcodeMap = buildOpcodeMap(ctx.rng, ctx.options.vm?.opcodeShuffle !== false, opcodeList);
        opcodeInfo = buildOpcodeEncoding(opcodeMap, ctx.rng, seedState, opcodeList);

        program.instructions = program.instructions.map((inst) => [
          opcodeMap[inst[0]],
          inst[1] || 0,
          inst[2] || 0,
        ]);

        keySchedule = ctx.options.vm?.runtimeKey === false
          ? null
          : buildKeySchedule(ctx.rng, seedState);
        if (keySchedule) {
          const keyCount = keySchedule.keys.length;
          const seedValue = seedState.seed;
          program.instructions = program.instructions.map((inst, idx) => {
            const key = keyCount
              ? keySchedule.keys[(idx + seedValue) % keyCount]
              : 0;
            if (!key) {
              return inst;
            }
            return [
              inst[0] ^ key,
              (inst[1] || 0) ^ key,
              (inst[2] || 0) ^ key,
            ];
          });
        }

        bcInfo = ctx.options.vm?.runtimeSplit === false
          ? null
          : splitInstructions(program.instructions, ctx.rng);
      }

      const constInfo = ctx.options.vm?.constsEncrypt === false
        ? null
        : encodeConstPool(program, ctx.rng, seedState);
      const reservedNames = new Set();
      if (ssaRoot) {
        const ssa = findSSAForNode(ssaRoot, node);
        if (ssa) {
          addSSAUsedNames(ssa, reservedNames);
        }
      }
      const vmSource = buildVmSource(
        program,
        opcodeInfo,
        program.paramNames,
        seedState,
        keySchedule,
        bcInfo,
        constInfo,
        ctx.rng,
        ctx.options.vm,
        reservedNames,
        opcodeList,
        isaProfile
      );
      const vmAst = style === "custom"
        ? ctx.parseCustom(vmSource)
        : ctx.parseLuaparse(vmSource);
      markVmNodes(vmAst);
      replaceFunctionBody(node, vmAst, style);
    });

    if (!shouldVirtualizeTopLevelChunk(ast, ctx.options)) {
      continue;
    }
    const chunkPlan = buildTopLevelChunkPlan(ast);
    if (!Array.isArray(chunkPlan.statements) || chunkPlan.statements.length < minStatements) {
      continue;
    }

    const compiler = new VmCompiler({ style, options: ctx.options });
    let program;
    try {
      program = compiler.compileChunk(ast, {
        statements: chunkPlan.statements,
        preboundLocals: chunkPlan.preboundLocals,
      });
    } catch (err) {
      const debug = Boolean(ctx.options.vm?.debug) || process.env.JS_OBF_VM_DEBUG === "1";
      if (debug) {
        const message = err && err.message ? err.message : String(err);
        console.warn(`[js-obf] luau-vm skipped <chunk>: ${message}`);
      }
      continue;
    }

    injectFakeInstructions(program, ctx.rng, ctx.options.vm?.fakeOpcodes ?? 0);

    const blockDispatch = Boolean(ctx.options.vm?.blockDispatch);
    const isaProfile = blockDispatch
      ? applyPolymorphicBlockISA(program, ctx.rng, ctx.options.vm || {})
      : {
          enabled: false,
          keyA: 0,
          keyB: 0,
          stackProtocol: "direct",
          dispatchGraph: "tree",
          fakeEdges: false,
        };
    const opcodeList = Array.from(new Set([
      ...OPCODES,
      ...program.instructions
        .map((inst) => inst && inst[0])
        .filter((name) => typeof name === "string"),
    ]));
    const seedState = buildSeedState(ctx.rng, program.instructions.length, program.consts.length);
    let opcodeInfo = null;
    let keySchedule = null;
    let bcInfo = null;

    if (!blockDispatch) {
      const opcodeMap = buildOpcodeMap(ctx.rng, ctx.options.vm?.opcodeShuffle !== false, opcodeList);
      opcodeInfo = buildOpcodeEncoding(opcodeMap, ctx.rng, seedState, opcodeList);

      program.instructions = program.instructions.map((inst) => [
        opcodeMap[inst[0]],
        inst[1] || 0,
        inst[2] || 0,
      ]);

      keySchedule = ctx.options.vm?.runtimeKey === false
        ? null
        : buildKeySchedule(ctx.rng, seedState);
      if (keySchedule) {
        const keyCount = keySchedule.keys.length;
        const seedValue = seedState.seed;
        program.instructions = program.instructions.map((inst, idx) => {
          const key = keyCount
            ? keySchedule.keys[(idx + seedValue) % keyCount]
            : 0;
          if (!key) {
            return inst;
          }
          return [
            inst[0] ^ key,
            (inst[1] || 0) ^ key,
            (inst[2] || 0) ^ key,
          ];
        });
      }

      bcInfo = ctx.options.vm?.runtimeSplit === false
        ? null
        : splitInstructions(program.instructions, ctx.rng);
    }

    const constInfo = ctx.options.vm?.constsEncrypt === false
      ? null
      : encodeConstPool(program, ctx.rng, seedState);
    const reservedNames = new Set();
    if (ssaRoot) {
      const ssa = findSSAForNode(ssaRoot, ast);
      if (ssa) {
        addSSAUsedNames(ssa, reservedNames);
      }
    }
    const vmSource = buildVmSource(
      program,
      opcodeInfo,
      program.paramNames,
      seedState,
      keySchedule,
      bcInfo,
      constInfo,
      ctx.rng,
      ctx.options.vm,
      reservedNames,
      opcodeList,
      isaProfile
    );
    const vmAst = style === "custom"
      ? ctx.parseCustom(vmSource)
      : ctx.parseLuaparse(vmSource);
    markVmNodes(vmAst);
    replaceChunkBody(ast, vmAst, chunkPlan.prefix);
    ast.__obf_vm_chunk = true;
  }
}

module.exports = {
  virtualizeLuau,
};
