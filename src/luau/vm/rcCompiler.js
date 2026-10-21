"use strict";

const { RcAllocator } = require("./rcAllocator");
const {
  RC_OPCODES,
  CONST_BIAS,
  toConstIndex,
} = require("./rcOpcodes");

class RcCompiler {
  constructor(options = {}, parent = null) {
    this.options = options;
    this.parent = parent;
    this.root = parent ? parent.root : this;
    this.constants = [];
    this.constMap = new Map();
    this.instructions = [];
    this.allocator = new RcAllocator();
    this.protos = this.root === this ? [] : this.root.protos;
    this.loopStack = [];
    this.upvalues = [];
    this.upvalueMap = new Map();
  }

  getFunctionName(stmt) {
    if (stmt.identifier && stmt.identifier.name) {
      return stmt.identifier.name;
    }
    if (stmt.name) {
      if (typeof stmt.name === "string") return stmt.name;
      if (stmt.name.type === "Identifier") return stmt.name.name;
      if (stmt.name.type === "FunctionName") {
        if (stmt.name.base && stmt.name.base.name) return stmt.name.base.name;
      }
      if (stmt.name.name) return stmt.name.name;
    }
    return "fn";
  }

  resolveIdentifier(name) {
    const localReg = this.allocator.resolveLocal(name);
    if (localReg !== null) {
      return { type: "local", reg: localReg };
    }

    if (this.parent) {
      if (this.upvalueMap.has(name)) {
        return { type: "upval", index: this.upvalueMap.get(name) };
      }
      const parentRes = this.parent.resolveIdentifier(name);
      if (parentRes.type === "local") {
        const upvalIdx = this.upvalues.length;
        this.upvalues.push({ instack: 1, index: parentRes.reg });
        this.upvalueMap.set(name, upvalIdx);
        return { type: "upval", index: upvalIdx };
      } else if (parentRes.type === "upval") {
        const upvalIdx = this.upvalues.length;
        this.upvalues.push({ instack: 0, index: parentRes.index });
        this.upvalueMap.set(name, upvalIdx);
        return { type: "upval", index: upvalIdx };
      }
    }

    return { type: "global", name };
  }

  addConst(value) {
    const key = `${typeof value}:${String(value)}`;
    if (this.constMap.has(key)) {
      return this.constMap.get(key);
    }
    const idx = this.constants.length;
    this.constants.push(value);
    this.constMap.set(key, idx);
    return idx;
  }

  emit(op, a = 0, b = 0, c = 0) {
    const pc = this.instructions.length;
    this.instructions.push([op, a, b, c]);
    return pc;
  }

  compileChunk(ast) {
    const body = Array.isArray(ast.body)
      ? ast.body
      : (ast.body && Array.isArray(ast.body.body) ? ast.body.body : (Array.isArray(ast) ? ast : []));

    for (const stmt of body) {
      this.compileStatement(stmt);
    }

    // Implicit return at end of chunk if last instruction isn't RETURN
    if (
      this.instructions.length === 0 ||
      this.instructions[this.instructions.length - 1][0] !== RC_OPCODES.RETURN
    ) {
      this.emit(RC_OPCODES.RETURN, 0, 1, 0);
    }

    return {
      instructions: this.instructions,
      constants: this.constants,
      upvalues: this.upvalues,
      maxRegisters: Math.max(this.allocator.maxReg, 4),
      protos: this.protos,
    };
  }

  compileStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case "LocalStatement":
        this.compileLocalStatement(stmt);
        break;
      case "AssignmentStatement":
        this.compileAssignmentStatement(stmt);
        break;
      case "CallStatement":
        this.compileCallExpression(stmt.expression, 0);
        break;
      case "IfStatement":
        this.compileIfStatement(stmt);
        break;
      case "WhileStatement":
        this.compileWhileStatement(stmt);
        break;
      case "RepeatStatement":
        this.compileRepeatStatement(stmt);
        break;
      case "DoStatement":
        this.compileDoStatement(stmt);
        break;
      case "ForNumericStatement":
        this.compileForNumericStatement(stmt);
        break;
      case "ForGenericStatement":
        this.compileForGenericStatement(stmt);
        break;
      case "ReturnStatement":
        this.compileReturnStatement(stmt);
        break;
      case "BreakStatement":
        this.compileBreakStatement();
        break;
      case "ContinueStatement":
        this.compileContinueStatement();
        break;
      case "FunctionDeclaration":
        this.compileFunctionDeclaration(stmt);
        break;
      default:
        // Handle ExpressionStatement if wrapped
        if (stmt.expression && stmt.expression.type === "CallExpression") {
          this.compileCallExpression(stmt.expression, 0);
        }
        break;
    }
  }

  isMultiReturnExpr(expr) {
    if (!expr) return false;
    return (
      expr.type === "CallExpression" ||
      expr.type === "MethodCallExpression" ||
      expr.type === "VarargLiteral"
    );
  }

  compileTrailingArg(expr, targetReg) {
    if (expr.type === "VarargLiteral") {
      this.emit(RC_OPCODES.VARARG, targetReg, 0, 0);
    } else {
      this.compileCallExpression(expr, -1, targetReg);
    }
  }

  assignToVariable(v, valReg) {
    if (v.type === "Identifier") {
      const res = this.resolveIdentifier(v.name);
      if (res.type === "local") {
        if (valReg !== null) {
          this.emit(RC_OPCODES.MOVE, res.reg, valReg, 0);
        } else {
          this.emit(RC_OPCODES.LOADNIL, res.reg, res.reg, 0);
        }
      } else if (res.type === "upval") {
        if (valReg !== null) {
          this.emit(RC_OPCODES.SETUPVAL, valReg, res.index, 0);
        } else {
          const nilReg = this.allocator.allocTemp();
          this.emit(RC_OPCODES.LOADNIL, nilReg, nilReg, 0);
          this.emit(RC_OPCODES.SETUPVAL, nilReg, res.index, 0);
          this.allocator.freeTemp(nilReg);
        }
      } else {
        // Global
        const kName = this.addConst(v.name);
        if (valReg !== null) {
          this.emit(RC_OPCODES.SETGLOBAL, valReg, kName, 0);
        } else {
          const nilReg = this.allocator.allocTemp();
          this.emit(RC_OPCODES.LOADNIL, nilReg, nilReg, 0);
          this.emit(RC_OPCODES.SETGLOBAL, nilReg, kName, 0);
          this.allocator.freeTemp(nilReg);
        }
      }
    } else if (v.type === "MemberExpression" || v.type === "IndexExpression") {
      const baseReg = this.compileExpression(v.base);
      const propRK =
        v.type === "MemberExpression"
          ? toConstIndex(this.addConst(v.identifier ? v.identifier.name : v.name))
          : this.compileRK(v.index);

      if (valReg !== null) {
        this.emit(RC_OPCODES.SETTABLE, baseReg, propRK, valReg);
      } else {
        const nilReg = this.allocator.allocTemp();
        this.emit(RC_OPCODES.LOADNIL, nilReg, nilReg, 0);
        this.emit(RC_OPCODES.SETTABLE, baseReg, propRK, nilReg);
        this.allocator.freeTemp(nilReg);
      }
      this.allocator.freeTemp(baseReg);
    }
  }

  compileLocalStatement(stmt) {
    const vars = stmt.variables || [];
    const inits = stmt.init || [];
    const numVars = vars.length;
    const numInits = inits.length;

    const lastInitIsMulti =
      numInits > 0 &&
      numVars > numInits &&
      this.isMultiReturnExpr(inits[numInits - 1]);

    if (lastInitIsMulti) {
      const varRegs = [];
      for (let i = 0; i < numVars; i++) {
        varRegs.push(this.allocator.defineLocal(vars[i].name));
      }

      for (let i = 0; i < numInits - 1; i++) {
        this.compileExpression(inits[i], varRegs[i]);
      }

      const remainingCount = numVars - (numInits - 1);
      const multiRegBase = this.allocator.reserveConsecutive(remainingCount);
      const lastExpr = inits[numInits - 1];

      if (lastExpr.type === "CallExpression" || lastExpr.type === "MethodCallExpression") {
        this.compileCallExpression(lastExpr, remainingCount, multiRegBase);
      } else if (lastExpr.type === "VarargLiteral") {
        this.emit(RC_OPCODES.VARARG, multiRegBase, remainingCount + 1, 0);
      }

      for (let k = 0; k < remainingCount; k++) {
        const destVarReg = varRegs[numInits - 1 + k];
        const srcReg = multiRegBase + k;
        if (destVarReg !== srcReg) {
          this.emit(RC_OPCODES.MOVE, destVarReg, srcReg, 0);
        }
      }
      this.allocator.freeConsecutive(multiRegBase, remainingCount);
      return;
    }

    for (let i = 0; i < vars.length; i++) {
      const v = vars[i];
      const reg = this.allocator.defineLocal(v.name);
      if (i < inits.length) {
        this.compileExpression(inits[i], reg);
      } else {
        this.emit(RC_OPCODES.LOADNIL, reg, reg, 0);
      }
    }
  }

  compileAssignmentStatement(stmt) {
    const vars = stmt.variables || [];
    const inits = stmt.init || [];
    const numVars = vars.length;
    const numInits = inits.length;

    const lastInitIsMulti =
      numInits > 0 &&
      numVars > numInits &&
      this.isMultiReturnExpr(inits[numInits - 1]);

    if (lastInitIsMulti) {
      const evaluated = [];
      for (let i = 0; i < numInits - 1; i++) {
        evaluated.push(this.compileExpression(inits[i]));
      }

      const remainingCount = numVars - (numInits - 1);
      const multiRegBase = this.allocator.reserveConsecutive(remainingCount);
      const lastExpr = inits[numInits - 1];
      if (lastExpr.type === "CallExpression" || lastExpr.type === "MethodCallExpression") {
        this.compileCallExpression(lastExpr, remainingCount, multiRegBase);
      } else if (lastExpr.type === "VarargLiteral") {
        this.emit(RC_OPCODES.VARARG, multiRegBase, remainingCount + 1, 0);
      }

      for (let k = 0; k < remainingCount; k++) {
        evaluated.push(multiRegBase + k);
      }

      for (let i = 0; i < numVars; i++) {
        const v = vars[i];
        const valReg = i < evaluated.length ? evaluated[i] : null;
        this.assignToVariable(v, valReg);
      }

      for (let i = 0; i < numInits - 1; i++) {
        this.allocator.freeTemp(evaluated[i]);
      }
      this.allocator.freeConsecutive(multiRegBase, remainingCount);
      return;
    }

    const evaluated = [];
    for (let i = 0; i < inits.length; i++) {
      evaluated.push(this.compileExpression(inits[i]));
    }

    for (let i = 0; i < vars.length; i++) {
      const v = vars[i];
      const valReg = i < evaluated.length ? evaluated[i] : null;
      this.assignToVariable(v, valReg);
    }

    for (const reg of evaluated) {
      this.allocator.freeTemp(reg);
    }
  }

  compileIfStatement(stmt) {
    const clauses = stmt.clauses || [];
    const jumpToEndList = [];

    for (const clause of clauses) {
      if (clause.condition || clause.type === "IfClause" || clause.type === "ElseifClause") {
        const condReg = this.compileExpression(clause.condition);
        // TEST condReg, 0: if condReg is false/nil, jump past this clause body
        const testJmpPc = this.emit(RC_OPCODES.TEST, condReg, 0, 0);
        this.allocator.freeTemp(condReg);

        this.allocator.enterScope();
        const body = Array.isArray(clause.body) ? clause.body : (clause.body && clause.body.body ? clause.body.body : []);
        for (const s of body) {
          this.compileStatement(s);
        }
        this.allocator.exitScope();

        // Jump to end of entire if statement
        jumpToEndList.push(this.emit(RC_OPCODES.JMP, 0, 0, 0));

        // Patch the test jump to point here (next clause or end)
        this.instructions[testJmpPc][2] = this.instructions.length;
      } else {
        this.allocator.enterScope();
        const body = Array.isArray(clause.body) ? clause.body : (clause.body && clause.body.body ? clause.body.body : []);
        for (const s of body) {
          this.compileStatement(s);
        }
        this.allocator.exitScope();
      }
    }

    if (stmt.elseBody) {
      this.allocator.enterScope();
      const body = Array.isArray(stmt.elseBody) ? stmt.elseBody : (stmt.elseBody.body ? stmt.elseBody.body : []);
      for (const s of body) {
        this.compileStatement(s);
      }
      this.allocator.exitScope();
    }

    const endPc = this.instructions.length;
    for (const jmpPc of jumpToEndList) {
      this.instructions[jmpPc][1] = endPc;
    }
  }

  compileWhileStatement(stmt) {
    const loopStart = this.instructions.length;
    this.loopStack.push({ breaks: [], continues: loopStart });

    const condReg = this.compileExpression(stmt.condition);
    const testJmpPc = this.emit(RC_OPCODES.TEST, condReg, 0, 0);
    this.allocator.freeTemp(condReg);

    this.allocator.enterScope();
    const body = Array.isArray(stmt.body) ? stmt.body : (stmt.body && stmt.body.body ? stmt.body.body : []);
    for (const s of body) {
      this.compileStatement(s);
    }
    this.allocator.exitScope();

    // Jump back to loop condition
    this.emit(RC_OPCODES.JMP, loopStart, 0, 0);

    const loopEnd = this.instructions.length;
    this.instructions[testJmpPc][2] = loopEnd;

    const loopContext = this.loopStack.pop();
    for (const brkPc of loopContext.breaks) {
      this.instructions[brkPc][1] = loopEnd;
    }
  }

  compileRepeatStatement(stmt) {
    const loopStart = this.instructions.length;
    this.loopStack.push({ breaks: [], continues: loopStart });

    this.allocator.enterScope();
    const body = Array.isArray(stmt.body) ? stmt.body : (stmt.body && stmt.body.body ? stmt.body.body : []);
    for (const s of body) {
      this.compileStatement(s);
    }
    this.allocator.exitScope();

    const condReg = this.compileExpression(stmt.condition);
    // If condReg is false, loop again (jump back to loopStart)
    this.emit(RC_OPCODES.TEST, condReg, loopStart, 1);
    this.allocator.freeTemp(condReg);

    const loopEnd = this.instructions.length;
    const loopContext = this.loopStack.pop();
    for (const brkPc of loopContext.breaks) {
      this.instructions[brkPc][1] = loopEnd;
    }
  }

  compileDoStatement(stmt) {
    this.allocator.enterScope();
    const body = Array.isArray(stmt.body) ? stmt.body : (stmt.body && stmt.body.body ? stmt.body.body : []);
    for (const s of body) {
      this.compileStatement(s);
    }
    this.allocator.exitScope();
  }

  compileForNumericStatement(stmt) {
    // Luau numeric for needs 3 internal state registers: (var, limit, step) + user variable
    const baseReg = this.allocator.reserveConsecutive(4);
    const varReg = baseReg;
    const limitReg = baseReg + 1;
    const stepReg = baseReg + 2;
    const userVarReg = baseReg + 3;

    this.compileExpression(stmt.start, varReg);
    this.compileExpression(stmt.end, limitReg);
    if (stmt.step) {
      this.compileExpression(stmt.step, stepReg);
    } else {
      const oneK = this.addConst(1);
      this.emit(RC_OPCODES.LOADK, stepReg, oneK, 0);
    }

    const prepPc = this.emit(RC_OPCODES.FORPREP, baseReg, 0, 0);

    const loopStart = this.instructions.length;
    this.loopStack.push({ breaks: [], continues: loopStart });

    this.allocator.enterScope();
    const varName = stmt.variable ? stmt.variable.name : "i";
    // Bind user variable in current scope to userVarReg
    this.allocator.scopes[this.allocator.scopes.length - 1].set(varName, userVarReg);

    const body = Array.isArray(stmt.body) ? stmt.body : (stmt.body && stmt.body.body ? stmt.body.body : []);
    for (const s of body) {
      this.compileStatement(s);
    }
    this.allocator.exitScope();

    // FORLOOP jumps back to loopStart if not done
    const loopPc = this.emit(RC_OPCODES.FORLOOP, baseReg, loopStart, 0);

    const loopEnd = this.instructions.length;
    this.instructions[prepPc][2] = loopPc;

    const loopContext = this.loopStack.pop();
    for (const brkPc of loopContext.breaks) {
      this.instructions[brkPc][1] = loopEnd;
    }

    this.allocator.freeConsecutive(baseReg, 4);
  }

  compileForGenericStatement(stmt) {
    const iters = stmt.iterators || [];
    const baseReg = this.allocator.reserveConsecutive(3 + (stmt.variables || []).length);
    if (iters.length === 1 && (iters[0].type === "CallExpression" || iters[0].type === "MethodCallExpression")) {
      this.compileCallExpression(iters[0], 3, baseReg);
    } else {
      for (let i = 0; i < Math.min(3, iters.length); i++) {
        this.compileExpression(iters[i], baseReg + i);
      }
      for (let i = iters.length; i < 3; i++) {
        this.emit(RC_OPCODES.LOADNIL, baseReg + i, baseReg + i, 0);
      }
    }

    const prepJmpPc = this.emit(RC_OPCODES.JMP, 0, 0, 0);
    const loopStart = this.instructions.length;
    this.loopStack.push({ breaks: [], continues: loopStart });

    this.allocator.enterScope();
    const vars = stmt.variables || [];
    for (let i = 0; i < vars.length; i++) {
      this.allocator.scopes[this.allocator.scopes.length - 1].set(vars[i].name, baseReg + 3 + i);
    }

    const body = Array.isArray(stmt.body) ? stmt.body : (stmt.body && stmt.body.body ? stmt.body.body : []);
    for (const s of body) {
      this.compileStatement(s);
    }
    this.allocator.exitScope();

    this.instructions[prepJmpPc][1] = this.instructions.length;

    // TFORLOOP: calls generator, unpacks vars. If var1 != nil, jumps to loopStart
    this.emit(RC_OPCODES.TFORLOOP, baseReg, loopStart, vars.length);

    const loopEnd = this.instructions.length;
    const loopContext = this.loopStack.pop();
    for (const brkPc of loopContext.breaks) {
      this.instructions[brkPc][1] = loopEnd;
    }

    this.allocator.freeConsecutive(baseReg, 3 + vars.length);
  }

  compileBreakStatement() {
    if (this.loopStack.length > 0) {
      const brkPc = this.emit(RC_OPCODES.JMP, 0, 0, 0);
      this.loopStack[this.loopStack.length - 1].breaks.push(brkPc);
    }
  }

  compileContinueStatement() {
    if (this.loopStack.length > 0) {
      const continueTarget = this.loopStack[this.loopStack.length - 1].continues;
      this.emit(RC_OPCODES.JMP, continueTarget, 0, 0);
    }
  }

  compileReturnStatement(stmt) {
    const args = stmt.arguments || [];
    if (args.length === 0) {
      this.emit(RC_OPCODES.RETURN, 0, 1, 0);
      return;
    }

    if (args.length === 1 && (args[0].type === "CallExpression" || args[0].type === "MethodCallExpression")) {
      const callExpr = args[0];
      const isMethod = callExpr.type === "MethodCallExpression";
      const callArgs = callExpr.arguments || [];
      const totalSlots = 1 + (isMethod ? 1 : 0) + callArgs.length;
      const baseReg = this.allocator.reserveConsecutive(totalSlots);

      if (isMethod) {
        const objReg = this.compileExpression(callExpr.base);
        const methodName = (callExpr.method && (callExpr.method.name || callExpr.method)) ||
                           (callExpr.identifier && (callExpr.identifier.name || callExpr.identifier)) ||
                           callExpr.name;
        const methodRK = toConstIndex(this.addConst(methodName));
        this.emit(RC_OPCODES.SELF, baseReg, objReg, methodRK);
        this.allocator.freeTemp(objReg);
        for (let i = 0; i < callArgs.length; i++) {
          const isLast = i === callArgs.length - 1;
          if (isLast && this.isMultiReturnExpr(callArgs[i])) {
            this.compileTrailingArg(callArgs[i], baseReg + 2 + i);
          } else {
            this.compileExpression(callArgs[i], baseReg + 2 + i);
          }
        }
      } else {
        this.compileExpression(callExpr.base, baseReg);
        for (let i = 0; i < callArgs.length; i++) {
          const isLast = i === callArgs.length - 1;
          if (isLast && this.isMultiReturnExpr(callArgs[i])) {
            this.compileTrailingArg(callArgs[i], baseReg + 1 + i);
          } else {
            this.compileExpression(callArgs[i], baseReg + 1 + i);
          }
        }
      }

      const numArgs = (isMethod ? 1 : 0) + callArgs.length;
      this.emit(RC_OPCODES.TAILCALL, baseReg, numArgs + 1, 0);
      this.allocator.freeConsecutive(baseReg, totalSlots);
      return;
    }

    const startReg = this.allocator.reserveConsecutive(args.length);
    for (let i = 0; i < args.length; i++) {
      this.compileExpression(args[i], startReg + i);
    }
    this.emit(RC_OPCODES.RETURN, startReg, args.length + 1, 0);
    this.allocator.freeConsecutive(startReg, args.length);
  }

  compileFunctionDeclaration(stmt) {
    const isLocal = stmt.isLocal;
    const name = this.getFunctionName(stmt);

    let targetReg;
    if (isLocal) {
      targetReg = this.allocator.defineLocal(name);
    } else {
      targetReg = this.allocator.allocTemp();
    }

    const subCompiler = new RcCompiler(this.options, this);
    subCompiler.allocator.enterScope();
    const params = stmt.parameters || [];
    for (const p of params) {
      subCompiler.allocator.defineLocal(p.name);
    }
    const compiledSub = subCompiler.compileChunk(stmt.body || stmt);
    const protoId = this.protos.length;
    this.protos.push(compiledSub);

    this.emit(RC_OPCODES.CLOSURE, targetReg, protoId, 0);

    if (!isLocal) {
      const kName = this.addConst(name);
      this.emit(RC_OPCODES.SETGLOBAL, targetReg, kName, 0);
      this.allocator.freeTemp(targetReg);
    }
  }

  compileExpression(expr, targetReg = null) {
    const dest = targetReg !== null ? targetReg : this.allocator.allocTemp();

    if (!expr) {
      this.emit(RC_OPCODES.LOADNIL, dest, dest, 0);
      return dest;
    }

    switch (expr.type) {
      case "NumericLiteral": {
        const kIdx = this.addConst(Number(expr.value));
        this.emit(RC_OPCODES.LOADK, dest, kIdx, 0);
        break;
      }
      case "StringLiteral": {
        const kIdx = this.addConst(String(expr.value));
        this.emit(RC_OPCODES.LOADK, dest, kIdx, 0);
        break;
      }
      case "BooleanLiteral": {
        this.emit(RC_OPCODES.LOADBOOL, dest, expr.value ? 1 : 0, 0);
        break;
      }
      case "NilLiteral": {
        this.emit(RC_OPCODES.LOADNIL, dest, dest, 0);
        break;
      }
      case "VarargLiteral": {
        this.emit(RC_OPCODES.VARARG, dest, 2, 0);
        break;
      }
      case "Identifier": {
        const res = this.resolveIdentifier(expr.name);
        if (res.type === "local") {
          if (dest !== res.reg) {
            this.emit(RC_OPCODES.MOVE, dest, res.reg, 0);
          }
        } else if (res.type === "upval") {
          this.emit(RC_OPCODES.GETUPVAL, dest, res.index, 0);
        } else {
          const kName = this.addConst(res.name);
          this.emit(RC_OPCODES.GETGLOBAL, dest, kName, 0);
        }
        break;
      }
      case "BinaryExpression": {
        this.compileBinaryExpression(expr, dest);
        break;
      }
      case "UnaryExpression": {
        this.compileUnaryExpression(expr, dest);
        break;
      }
      case "TableConstructorExpression": {
        this.compileTableConstructor(expr, dest);
        break;
      }
      case "MemberExpression":
      case "IndexExpression": {
        const baseReg = this.compileExpression(expr.base);
        const propRK = expr.type === "MemberExpression"
          ? toConstIndex(this.addConst(expr.identifier ? expr.identifier.name : expr.name))
          : this.compileRK(expr.index);

        this.emit(RC_OPCODES.GETTABLE, dest, baseReg, propRK);
        this.allocator.freeTemp(baseReg);
        break;
      }
      case "CallExpression":
      case "MethodCallExpression": {
        this.compileCallExpression(expr, 1, dest);
        break;
      }
      case "FunctionExpression": {
        const subCompiler = new RcCompiler(this.options, this);
        subCompiler.allocator.enterScope();
        for (const p of (expr.parameters || [])) {
          subCompiler.allocator.defineLocal(p.name);
        }
        const compiledSub = subCompiler.compileChunk(expr.body || expr);
        const protoId = this.protos.length;
        this.protos.push(compiledSub);
        this.emit(RC_OPCODES.CLOSURE, dest, protoId, 0);
        break;
      }
      case "GroupExpression":
      case "ParenthesizedExpression": {
        return this.compileExpression(expr.expression || expr.base, dest);
      }
      default:
        this.emit(RC_OPCODES.LOADNIL, dest, dest, 0);
        break;
    }

    return dest;
  }

  compileRK(expr) {
    if (!expr) {
      return toConstIndex(this.addConst(null));
    }
    if (expr.type === "GroupExpression" || expr.type === "ParenthesizedExpression") {
      return this.compileRK(expr.expression || expr.base);
    }
    if (expr.type === "NumericLiteral") {
      return toConstIndex(this.addConst(Number(expr.value)));
    }
    if (expr.type === "StringLiteral") {
      return toConstIndex(this.addConst(String(expr.value)));
    }
    if (expr.type === "BooleanLiteral") {
      return toConstIndex(this.addConst(Boolean(expr.value)));
    }
    return this.compileExpression(expr);
  }

  compileBinaryExpression(expr, dest) {
    const op = expr.operator;
    let opcode;
    switch (op) {
      case "+": opcode = RC_OPCODES.ADD; break;
      case "-": opcode = RC_OPCODES.SUB; break;
      case "*": opcode = RC_OPCODES.MUL; break;
      case "/": opcode = RC_OPCODES.DIV; break;
      case "//": opcode = RC_OPCODES.IDIV; break;
      case "%": opcode = RC_OPCODES.MOD; break;
      case "^": opcode = RC_OPCODES.POW; break;
      case "..": opcode = RC_OPCODES.CONCAT; break;
      case "&": opcode = RC_OPCODES.BAND; break;
      case "|": opcode = RC_OPCODES.BOR; break;
      case "~": opcode = RC_OPCODES.BXOR; break;
      case "<<": opcode = RC_OPCODES.SHL; break;
      case ">>": opcode = RC_OPCODES.SHR; break;
      case "==":
      case "~=":
      case "<":
      case "<=":
      case ">":
      case ">=":
        this.compileComparisonExpression(expr, dest);
        return;
      case "and":
      case "or":
        this.compileLogicalExpression(expr, dest);
        return;
      default:
        opcode = RC_OPCODES.ADD;
        break;
    }

    const rkLeft = this.compileRK(expr.left);
    const rkRight = this.compileRK(expr.right);
    this.emit(opcode, dest, rkLeft, rkRight);

    if (rkLeft < CONST_BIAS && rkLeft !== dest) this.allocator.freeTemp(rkLeft);
    if (rkRight < CONST_BIAS && rkRight !== dest) this.allocator.freeTemp(rkRight);
  }

  compileComparisonExpression(expr, dest) {
    const rkB = this.compileRK(expr.left);
    const rkC = this.compileRK(expr.right);
    const op = expr.operator;

    let opId = RC_OPCODES.EQ;
    let expected = 1;

    if (op === "==") {
      opId = RC_OPCODES.EQ; expected = 1;
    } else if (op === "~=") {
      opId = RC_OPCODES.EQ; expected = 0;
    } else if (op === "<") {
      opId = RC_OPCODES.LT; expected = 1;
    } else if (op === "<=") {
      opId = RC_OPCODES.LE; expected = 1;
    } else if (op === ">") {
      // a > b <=> b < a
      opId = RC_OPCODES.LT; expected = 1;
      this.emit(opId, expected, rkC, rkB);
      this.emit(RC_OPCODES.LOADBOOL, dest, 0, 1); // if false, set dest=0, jump 1
      this.emit(RC_OPCODES.LOADBOOL, dest, 1, 0); // else set dest=1
      return;
    } else if (op === ">=") {
      // a >= b <=> b <= a
      opId = RC_OPCODES.LE; expected = 1;
      this.emit(opId, expected, rkC, rkB);
      this.emit(RC_OPCODES.LOADBOOL, dest, 0, 1);
      this.emit(RC_OPCODES.LOADBOOL, dest, 1, 0);
      return;
    }

    this.emit(opId, expected, rkB, rkC);
    this.emit(RC_OPCODES.LOADBOOL, dest, 0, 1); // false branch
    this.emit(RC_OPCODES.LOADBOOL, dest, 1, 0); // true branch

    if (rkB < CONST_BIAS && rkB !== dest) this.allocator.freeTemp(rkB);
    if (rkC < CONST_BIAS && rkC !== dest) this.allocator.freeTemp(rkC);
  }

  compileLogicalExpression(expr, dest) {
    const isAnd = expr.operator === "and";
    this.compileExpression(expr.left, dest);
    // TEST dest, jumpPc
    const testJmpPc = this.emit(RC_OPCODES.TEST, dest, 0, isAnd ? 0 : 1);
    this.compileExpression(expr.right, dest);
    this.instructions[testJmpPc][2] = this.instructions.length;
  }

  compileUnaryExpression(expr, dest) {
    const operandReg = this.compileExpression(expr.argument);
    let opcode;
    switch (expr.operator) {
      case "-": opcode = RC_OPCODES.UNM; break;
      case "not": opcode = RC_OPCODES.NOT; break;
      case "#": opcode = RC_OPCODES.LEN; break;
      case "~": opcode = RC_OPCODES.BNOT; break;
      default: opcode = RC_OPCODES.UNM; break;
    }
    this.emit(opcode, dest, operandReg, 0);
    if (operandReg !== dest) this.allocator.freeTemp(operandReg);
  }

  compileTableConstructor(expr, dest) {
    const fields = expr.fields || [];
    this.emit(RC_OPCODES.NEWTABLE, dest, 0, 0);

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.type === "TableField") {
        if (f.kind === "name" || (f.name && !f.index)) {
          const keyName = f.name.name || f.name;
          const kIdx = toConstIndex(this.addConst(keyName));
          const valReg = this.compileExpression(f.value);
          this.emit(RC_OPCODES.SETTABLE, dest, kIdx, valReg);
          this.allocator.freeTemp(valReg);
        } else if (f.kind === "index" || f.index) {
          const keyRK = this.compileRK(f.index || f.key);
          const valReg = this.compileExpression(f.value);
          this.emit(RC_OPCODES.SETTABLE, dest, keyRK, valReg);
          if (keyRK < CONST_BIAS) this.allocator.freeTemp(keyRK);
          this.allocator.freeTemp(valReg);
        } else {
          // array element
          const keyRK = toConstIndex(this.addConst(i + 1));
          const valReg = this.compileExpression(f.value);
          this.emit(RC_OPCODES.SETTABLE, dest, keyRK, valReg);
          this.allocator.freeTemp(valReg);
        }
      } else if (f.type === "TableKeyString") {
        const kIdx = toConstIndex(this.addConst(f.key.name));
        const valReg = this.compileExpression(f.value);
        this.emit(RC_OPCODES.SETTABLE, dest, kIdx, valReg);
        this.allocator.freeTemp(valReg);
      } else if (f.type === "TableKey") {
        const keyRK = this.compileRK(f.key);
        const valReg = this.compileExpression(f.value);
        this.emit(RC_OPCODES.SETTABLE, dest, keyRK, valReg);
        if (keyRK < CONST_BIAS) this.allocator.freeTemp(keyRK);
        this.allocator.freeTemp(valReg);
      } else if (f.type === "TableValue") {
        const keyRK = toConstIndex(this.addConst(i + 1));
        const valReg = this.compileExpression(f.value);
        this.emit(RC_OPCODES.SETTABLE, dest, keyRK, valReg);
        this.allocator.freeTemp(valReg);
      }
    }
  }

  compileCallExpression(expr, nreturns = 1, dest = null) {
    const isMethod = expr.type === "MethodCallExpression";
    const args = expr.arguments || [];
    const totalSlots = 1 + (isMethod ? 1 : 0) + args.length;
    const baseReg = this.allocator.reserveConsecutive(totalSlots);

    if (isMethod) {
      // base:method(args)
      const objReg = this.compileExpression(expr.base);
      const methodName = (expr.method && (expr.method.name || expr.method)) ||
                         (expr.identifier && (expr.identifier.name || expr.identifier)) ||
                         expr.name;
      const methodRK = toConstIndex(this.addConst(methodName));
      // SELF baseReg, objReg, methodRK
      // Sets baseReg = objReg[methodRK], baseReg+1 = objReg
      this.emit(RC_OPCODES.SELF, baseReg, objReg, methodRK);
      this.allocator.freeTemp(objReg);

      for (let i = 0; i < args.length; i++) {
        const isLast = i === args.length - 1;
        if (isLast && this.isMultiReturnExpr(args[i])) {
          this.compileTrailingArg(args[i], baseReg + 2 + i);
        } else {
          this.compileExpression(args[i], baseReg + 2 + i);
        }
      }
    } else {
      this.compileExpression(expr.base, baseReg);
      for (let i = 0; i < args.length; i++) {
        const isLast = i === args.length - 1;
        if (isLast && this.isMultiReturnExpr(args[i])) {
          this.compileTrailingArg(args[i], baseReg + 1 + i);
        } else {
          this.compileExpression(args[i], baseReg + 1 + i);
        }
      }
    }

    const numArgs = (isMethod ? 1 : 0) + args.length;
    // CALL baseReg, numArgs + 1, nreturns + 1
    this.emit(RC_OPCODES.CALL, baseReg, numArgs + 1, nreturns === -1 ? 0 : nreturns + 1);

    if (dest !== null && nreturns >= 1 && dest !== baseReg) {
      for (let i = 0; i < nreturns; i++) {
        this.emit(RC_OPCODES.MOVE, dest + i, baseReg + i, 0);
      }
    } else if (dest !== null && nreturns === -1 && dest !== baseReg) {
      this.emit(RC_OPCODES.MOVE, dest, baseReg, 0);
    }

    this.allocator.freeConsecutive(baseReg, totalSlots);
  }
}

module.exports = {
  RcCompiler,
};
