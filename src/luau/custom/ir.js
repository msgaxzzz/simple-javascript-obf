const { makeDiagnosticErrorFromNode } = require("./diagnostics");
const { buildScope } = require("./scope");

function isNode(value) {
  return value && typeof value === "object" && typeof value.type === "string";
}

function createBlock(fn, kind, label = null) {
  const block = {
    id: fn.blocks.length,
    kind,
    label,
    instructions: [],
    successors: new Set(),
    predecessors: new Set(),
  };
  fn.blocks.push(block);
  return block;
}

function isTerminator(inst) {
  if (!inst) {
    return false;
  }
  return inst.op === "jump" || inst.op === "branch" || inst.op === "return";
}

function blockHasTerminator(block) {
  if (!block || !block.instructions.length) {
    return false;
  }
  return isTerminator(block.instructions[block.instructions.length - 1]);
}

function connect(from, to) {
  if (!from || !to) {
    return;
  }
  from.successors.add(to.id);
  to.predecessors.add(from.id);
}

function finalizeBlocks(fn) {
  fn.blocks.forEach((block) => {
    block.successors = Array.from(block.successors);
    block.predecessors = Array.from(block.predecessors);
  });
}

function computeDominators(fn) {
  const entryId = fn.entryId;
  const allIds = fn.blocks.map((block) => block.id);
  const allSet = new Set(allIds);
  const dom = new Map();
  fn.blocks.forEach((block) => {
    if (block.id === entryId) {
      dom.set(block.id, new Set([block.id]));
    } else {
      dom.set(block.id, new Set(allSet));
    }
  });

  let changed = true;
  while (changed) {
    changed = false;
    for (const block of fn.blocks) {
      if (block.id === entryId) {
        continue;
      }
      const preds = block.predecessors;
      let next = null;
      if (!preds.length) {
        next = new Set([block.id]);
      } else {
        for (const pred of preds) {
          const predDom = dom.get(pred);
          if (!predDom) {
            continue;
          }
          if (!next) {
            next = new Set(predDom);
          } else {
            for (const value of Array.from(next)) {
              if (!predDom.has(value)) {
                next.delete(value);
              }
            }
          }
        }
        if (!next) {
          next = new Set();
        }
        next.add(block.id);
      }
      const current = dom.get(block.id);
      if (!setsEqual(current, next)) {
        dom.set(block.id, next);
        changed = true;
      }
    }
  }

  const idom = new Map();
  for (const block of fn.blocks) {
    if (block.id === entryId) {
      idom.set(block.id, null);
      continue;
    }
    const domSet = new Set(dom.get(block.id));
    domSet.delete(block.id);
    let immediate = null;
    for (const candidate of domSet) {
      let dominatedByOther = false;
      for (const other of domSet) {
        if (other === candidate) {
          continue;
        }
        if (dom.get(candidate).has(other)) {
          dominatedByOther = true;
          break;
        }
      }
      if (!dominatedByOther) {
        immediate = candidate;
        break;
      }
    }
    idom.set(block.id, immediate);
  }

  const dominators = {};
  const immediateDominators = {};
  const dominatorTree = {};
  const dominanceFrontier = {};
  dom.forEach((set, id) => {
    dominators[id] = Array.from(set);
  });
  idom.forEach((value, id) => {
    immediateDominators[id] = value;
  });
  fn.blocks.forEach((block) => {
    dominatorTree[block.id] = [];
    dominanceFrontier[block.id] = new Set();
  });
  idom.forEach((parent, id) => {
    if (parent !== null && dominatorTree[parent]) {
      dominatorTree[parent].push(id);
    }
  });
  for (const block of fn.blocks) {
    if (block.predecessors.length < 2) {
      continue;
    }
    const idomOfBlock = immediateDominators[block.id];
    for (const pred of block.predecessors) {
      let runner = pred;
      while (runner !== null && runner !== idomOfBlock) {
        dominanceFrontier[runner].add(block.id);
        runner = immediateDominators[runner];
      }
    }
  }
  const dominanceFrontierOut = {};
  Object.keys(dominanceFrontier).forEach((id) => {
    dominanceFrontierOut[id] = Array.from(dominanceFrontier[id]);
  });
  fn.dominators = dominators;
  fn.immediateDominators = immediateDominators;
  fn.dominatorTree = dominatorTree;
  fn.dominanceFrontier = dominanceFrontierOut;
}

function setsEqual(a, b) {
  if (!a || !b || a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function makeOperand(kind, value) {
  return { kind, value };
}

function isUpvalueBinding(ctx, bindingId) {
  if (!ctx || !ctx.upvalues || bindingId == null) {
    return false;
  }
  return ctx.upvalues.has(bindingId);
}

function makeTemp(ctx) {
  const id = ctx.fn.tempCount;
  ctx.fn.tempCount += 1;
  return { kind: "temp", value: id, name: `t${id}` };
}

function makeVar(bindingId, name) {
  return { kind: "var", value: bindingId, name };
}

function makeConst(value) {
  return makeOperand("const", value);
}

function makeGlobal(name) {
  return { kind: "global", value: name, name };
}

function makeUpvalue(bindingId, name) {
  return { kind: "upvalue", value: bindingId, name };
}

function makeVararg() {
  return { kind: "vararg", value: "..." };
}

function emit(ctx, op, data, node = null) {
  if (!ctx.current) {
    ctx.current = createBlock(ctx.fn, "block");
  }
  const inst = {
    op,
    ...data,
  };
  if (node && node.loc) {
    inst.loc = node.loc;
  }
  if (node && node.range) {
    inst.range = node.range;
  }
  ctx.current.instructions.push(inst);
  return inst;
}

function getBindingId(ctx, node) {
  if (!ctx || !ctx.scopeInfo || !node) {
    return null;
  }
  if (ctx.scopeInfo.referenceByNode && ctx.scopeInfo.referenceByNode.has(node)) {
    return ctx.scopeInfo.referenceByNode.get(node);
  }
  if (ctx.scopeInfo.bindingByNode && ctx.scopeInfo.bindingByNode.has(node)) {
    return ctx.scopeInfo.bindingByNode.get(node);
  }
  return null;
}

function getBindingName(ctx, bindingId) {
  if (!ctx || !ctx.scopeInfo || bindingId == null) {
    return null;
  }
  if (ctx.scopeInfo.bindingNames) {
    return ctx.scopeInfo.bindingNames.get(bindingId) || null;
  }
  return null;
}

function emitJump(ctx, target, node = null) {
  emit(ctx, "jump", { target: target.id }, node);
  connect(ctx.current, target);
  ctx.current = null;
}

function emitBranch(ctx, test, consequent, alternate, node = null) {
  emit(ctx, "branch", { test, consequent: consequent.id, alternate: alternate.id }, node);
  connect(ctx.current, consequent);
  connect(ctx.current, alternate);
  ctx.current = null;
}

function ensureBlock(ctx, kind) {
  if (!ctx.current) {
    ctx.current = createBlock(ctx.fn, kind || "block");
  }
  return ctx.current;
}

function terminateWithJump(ctx, block, target, node) {
  if (!block) {
    return;
  }
  if (blockHasTerminator(block)) {
    return;
  }
  ctx.current = block;
  emitJump(ctx, target, node);
}

function lowerExpression(expr, ctx) {
  if (!isNode(expr)) {
    return makeConst(null);
  }
  switch (expr.type) {
    case "Identifier":
      {
        const bindingId = getBindingId(ctx, expr);
        if (bindingId == null) {
          return makeGlobal(expr.name);
        }
        if (isUpvalueBinding(ctx, bindingId)) {
          return makeUpvalue(bindingId, getBindingName(ctx, bindingId) || expr.name);
        }
        return makeVar(bindingId, getBindingName(ctx, bindingId) || expr.name);
      }
    case "NumericLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
    case "NilLiteral":
      return makeConst(expr.value ?? null);
    case "VarargLiteral":
      return makeVararg();
    case "UnaryExpression": {
      const argument = lowerExpression(expr.argument, ctx);
      const dest = makeTemp(ctx);
      emit(ctx, "unary", { operator: expr.operator, argument, dest }, expr);
      return dest;
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      if (expr.operator === "and" || expr.operator === "or") {
        return lowerLogicalExpression(expr, ctx);
      }
      const left = lowerExpression(expr.left, ctx);
      const right = lowerExpression(expr.right, ctx);
      const dest = makeTemp(ctx);
      emit(ctx, "binary", { operator: expr.operator, left, right, dest }, expr);
      return dest;
    }
    case "GroupExpression":
      return lowerExpression(expr.expression, ctx);
    case "TypeAssertion":
      return lowerExpression(expr.expression, ctx);
    case "IndexExpression": {
      const base = lowerExpression(expr.base, ctx);
      const index = lowerExpression(expr.index, ctx);
      const dest = makeTemp(ctx);
      emit(ctx, "get_index", { base, index, dest }, expr);
      return dest;
    }
    case "MemberExpression": {
      const base = lowerExpression(expr.base, ctx);
      const dest = makeTemp(ctx);
      const name = expr.identifier ? expr.identifier.name : null;
      emit(ctx, "get_member", { base, name, dest }, expr);
      return dest;
    }
    case "CallExpression":
      return lowerCallExpression(expr, ctx, true);
    case "MethodCallExpression":
      return lowerCallExpression(expr, ctx, true);
    case "TableConstructorExpression":
      return lowerTableConstructor(expr, ctx);
    case "FunctionExpression": {
      const fn = buildFunctionIR(expr, ctx.root, "function", ctx.upvalueInfo);
      return makeOperand("function", fn.id);
    }
    case "IfExpression":
      return lowerIfExpression(expr, ctx);
    case "InterpolatedString":
      return lowerInterpolatedString(expr, ctx);
    default:
      throw makeDiagnosticErrorFromNode(`Unsupported expression ${expr.type}`, expr);
  }
}

function lowerInterpolatedString(expr, ctx) {
  const parts = [];
  if (Array.isArray(expr.parts)) {
    expr.parts.forEach((part) => {
      if (part && part.type === "InterpolatedStringText") {
        parts.push(makeConst(part.value ?? part.raw ?? ""));
      } else {
        parts.push(lowerExpression(part, ctx));
      }
    });
  }
  const dest = makeTemp(ctx);
  emit(ctx, "interpolate", { parts, dest }, expr);
  return dest;
}

function lowerLogicalExpression(expr, ctx) {
  const left = lowerExpression(expr.left, ctx);
  const dest = makeTemp(ctx);
  const truthyBlock = createBlock(ctx.fn, "logical-true");
  const falsyBlock = createBlock(ctx.fn, "logical-false");
  const joinBlock = createBlock(ctx.fn, "logical-join");
  if (expr.operator === "and") {
    emitBranch(ctx, left, truthyBlock, falsyBlock, expr);
  } else {
    emitBranch(ctx, left, falsyBlock, truthyBlock, expr);
  }
  ctx.current = falsyBlock;
  emit(ctx, "move", { dest, src: left }, expr);
  emitJump(ctx, joinBlock, expr);
  ctx.current = truthyBlock;
  const right = lowerExpression(expr.right, ctx);
  emit(ctx, "move", { dest, src: right }, expr);
  emitJump(ctx, joinBlock, expr);
  ctx.current = joinBlock;
  return dest;
}

function lowerIfExpression(expr, ctx) {
  const dest = makeTemp(ctx);
  const clauses = expr.clauses || [];
  const joinBlock = createBlock(ctx.fn, "if-expr-join");
  let currentBlock = ctx.current || ensureBlock(ctx, "if-expr");
  for (let i = 0; i < clauses.length; i += 1) {
    const clause = clauses[i];
    if (!clause) {
      continue;
    }
    const condition = clause.condition ? lowerExpression(clause.condition, ctx) : null;
    const thenBlock = createBlock(ctx.fn, "if-expr-then");
    const nextBlock = createBlock(ctx.fn, "if-expr-next");
    if (condition) {
      emitBranch(ctx, condition, thenBlock, nextBlock, clause.condition);
    } else {
      emitJump(ctx, thenBlock, clause);
    }
    ctx.current = thenBlock;
    const value = clause.value ? lowerExpression(clause.value, ctx) : makeConst(null);
    emit(ctx, "move", { dest, src: value }, clause.value);
    emitJump(ctx, joinBlock, clause);
    ctx.current = nextBlock;
    currentBlock = nextBlock;
  }
  const elseValue = expr.elseValue ? lowerExpression(expr.elseValue, ctx) : makeConst(null);
  emit(ctx, "move", { dest, src: elseValue }, expr.elseValue);
  emitJump(ctx, joinBlock, expr);
  ctx.current = joinBlock;
  return dest;
}

function lowerTableConstructor(expr, ctx) {
  const dest = makeTemp(ctx);
  emit(ctx, "table_new", { dest }, expr);
  let listIndex = 1;
  const fields = expr.fields || [];
  fields.forEach((field) => {
    if (!field) {
      return;
    }
    if (field.type === "TableField") {
      if (field.kind === "list") {
        const value = lowerExpression(field.value, ctx);
        emit(ctx, "table_set", { base: dest, key: makeConst(listIndex), value, kind: "list" }, field);
        listIndex += 1;
        return;
      }
      if (field.kind === "name") {
        const value = lowerExpression(field.value, ctx);
        const name = field.name ? field.name.name : null;
        emit(ctx, "table_set", { base: dest, key: makeConst(name), value, kind: "name" }, field);
        return;
      }
      if (field.kind === "index") {
        const key = lowerExpression(field.key, ctx);
        const value = lowerExpression(field.value, ctx);
        emit(ctx, "table_set", { base: dest, key, value, kind: "index" }, field);
      }
      return;
    }
    if (field.type === "TableValue") {
      const value = lowerExpression(field.value, ctx);
      emit(ctx, "table_set", { base: dest, key: makeConst(listIndex), value, kind: "list" }, field);
      listIndex += 1;
      return;
    }
    if (field.type === "TableKey") {
      const key = lowerExpression(field.key, ctx);
      const value = lowerExpression(field.value, ctx);
      emit(ctx, "table_set", { base: dest, key, value, kind: "index" }, field);
      return;
    }
    if (field.type === "TableKeyString") {
      const value = lowerExpression(field.value, ctx);
      emit(ctx, "table_set", { base: dest, key: makeConst(field.key.name), value, kind: "name" }, field);
    }
  });
  return dest;
}

function lowerCallExpression(expr, ctx, needResult) {
  const base = lowerExpression(expr.base, ctx);
  const args = [];
  const list = expr.arguments || [];
  list.forEach((arg) => args.push(lowerExpression(arg, ctx)));
  const dest = needResult ? makeTemp(ctx) : null;
  if (expr.type === "MethodCallExpression") {
    const name = expr.method ? expr.method.name : null;
    emit(ctx, "method_call", { base, method: name, args, dest }, expr);
    return dest || makeConst(null);
  }
  emit(ctx, "call", { base, args, dest }, expr);
  return dest || makeConst(null);
}

function lowerAssignmentTarget(target, ctx) {
  if (!isNode(target)) {
    return { kind: "unknown" };
  }
  if (target.type === "Identifier") {
    const bindingId = getBindingId(ctx, target);
    if (bindingId == null) {
      return { kind: "global", name: target.name };
    }
    if (isUpvalueBinding(ctx, bindingId)) {
      return { kind: "upvalue", name: getBindingName(ctx, bindingId) || target.name, id: bindingId };
    }
    return { kind: "var", name: getBindingName(ctx, bindingId) || target.name, id: bindingId };
  }
  if (target.type === "MemberExpression") {
    const base = lowerExpression(target.base, ctx);
    const name = target.identifier ? target.identifier.name : null;
    return { kind: "member", base, name };
  }
  if (target.type === "IndexExpression") {
    const base = lowerExpression(target.base, ctx);
    const index = lowerExpression(target.index, ctx);
    return { kind: "index", base, index };
  }
  return { kind: "unknown" };
}

function emitAssignment(target, value, ctx, node) {
  if (!target) {
    return;
  }
  if (target.kind === "var") {
    emit(ctx, "move", { dest: makeVar(target.id, target.name), src: value }, node);
    return;
  }
  if (target.kind === "upvalue") {
    emit(ctx, "mem_write", { target: makeUpvalue(target.id, target.name), value }, node);
    return;
  }
  if (target.kind === "global") {
    emit(ctx, "move", { dest: makeGlobal(target.name), src: value }, node);
    return;
  }
  if (target.kind === "member") {
    emit(ctx, "set_member", { base: target.base, name: target.name, value }, node);
    return;
  }
  if (target.kind === "index") {
    emit(ctx, "set_index", { base: target.base, index: target.index, value }, node);
  }
}

function lowerStatement(stmt, ctx) {
  if (!isNode(stmt)) {
    return;
  }
  switch (stmt.type) {
    case "LocalStatement":
      lowerLocalStatement(stmt, ctx);
      return;
    case "AssignmentStatement":
      lowerAssignmentStatement(stmt, ctx);
      return;
    case "CompoundAssignmentStatement":
      lowerCompoundAssignment(stmt, ctx);
      return;
    case "CallStatement":
      lowerCallStatement(stmt, ctx);
      return;
    case "ReturnStatement":
      lowerReturnStatement(stmt, ctx);
      return;
    case "IfStatement":
      lowerIfStatement(stmt, ctx);
      return;
    case "WhileStatement":
      lowerWhileStatement(stmt, ctx);
      return;
    case "RepeatStatement":
      lowerRepeatStatement(stmt, ctx);
      return;
    case "ForNumericStatement":
      lowerForNumericStatement(stmt, ctx);
      return;
    case "ForGenericStatement":
      lowerForGenericStatement(stmt, ctx);
      return;
    case "DoStatement":
      lowerDoStatement(stmt, ctx);
      return;
    case "BreakStatement":
      lowerBreakStatement(stmt, ctx);
      return;
    case "ContinueStatement":
      lowerContinueStatement(stmt, ctx);
      return;
    case "LabelStatement":
    case "GotoStatement":
      lowerLabelOrGoto(stmt, ctx);
      return;
    case "FunctionDeclaration":
      lowerFunctionDeclaration(stmt, ctx);
      return;
    case "TypeAliasStatement":
    case "ExportTypeStatement":
    case "TypeFunctionStatement":
    case "ExportTypeFunctionStatement":
    case "DeclareFunctionStatement":
    case "DeclareVariableStatement":
      return;
    default:
      throw makeDiagnosticErrorFromNode(`Unsupported statement ${stmt.type}`, stmt);
  }
}

function lowerLocalStatement(stmt, ctx) {
  const variables = stmt.variables || [];
  const init = stmt.init || [];
  const values = init.map((expr) => lowerExpression(expr, ctx));
  const nil = makeConst(null);
  variables.forEach((variable, idx) => {
    const target = lowerAssignmentTarget(variable, ctx);
    const value = values[idx] || nil;
    emitAssignment(target, value, ctx, stmt);
  });
}

function lowerAssignmentStatement(stmt, ctx) {
  const variables = stmt.variables || [];
  const init = stmt.init || [];
  const values = init.map((expr) => lowerExpression(expr, ctx));
  const nil = makeConst(null);
  variables.forEach((variable, idx) => {
    const target = lowerAssignmentTarget(variable, ctx);
    const value = values[idx] || nil;
    emitAssignment(target, value, ctx, stmt);
  });
}

function lowerCompoundAssignment(stmt, ctx) {
  const target = lowerAssignmentTarget(stmt.variable, ctx);
  const rhs = lowerExpression(stmt.value, ctx);
  if (target.kind === "var") {
    const left = makeVar(target.id, target.name);
    const dest = makeTemp(ctx);
    emit(ctx, "binary", { operator: stmt.operator, left, right: rhs, dest }, stmt);
    emitAssignment(target, dest, ctx, stmt);
    return;
  }
  if (target.kind === "upvalue" || target.kind === "global") {
    const left = target.kind === "upvalue"
      ? makeUpvalue(target.id, target.name)
      : makeGlobal(target.name);
    const dest = makeTemp(ctx);
    emit(ctx, "binary", { operator: stmt.operator, left, right: rhs, dest }, stmt);
    emitAssignment(target, dest, ctx, stmt);
    return;
  }
  if (target.kind === "member") {
    const left = makeTemp(ctx);
    emit(ctx, "get_member", { base: target.base, name: target.name, dest: left }, stmt);
    const dest = makeTemp(ctx);
    emit(ctx, "binary", { operator: stmt.operator, left, right: rhs, dest }, stmt);
    emitAssignment(target, dest, ctx, stmt);
    return;
  }
  if (target.kind === "index") {
    const left = makeTemp(ctx);
    emit(ctx, "get_index", { base: target.base, index: target.index, dest: left }, stmt);
    const dest = makeTemp(ctx);
    emit(ctx, "binary", { operator: stmt.operator, left, right: rhs, dest }, stmt);
    emitAssignment(target, dest, ctx, stmt);
  }
}

function lowerCallStatement(stmt, ctx) {
  if (!stmt.expression) {
    return;
  }
  if (stmt.expression.type === "CallExpression" || stmt.expression.type === "MethodCallExpression") {
    lowerCallExpression(stmt.expression, ctx, false);
    return;
  }
  lowerExpression(stmt.expression, ctx);
}

function lowerReturnStatement(stmt, ctx) {
  const args = stmt.arguments || [];
  const values = args.map((expr) => lowerExpression(expr, ctx));
  emit(ctx, "return", { values }, stmt);
  connect(ctx.current, ctx.exitBlock);
  ctx.current = null;
}

function normalizeIfClauses(stmt) {
  const clauses = stmt.clauses || [];
  if (!clauses.length) {
    return [];
  }
  if (clauses[0] && typeof clauses[0].type === "string") {
    return clauses.map((clause) => ({
      condition: clause.type === "ElseClause" ? null : clause.condition,
      body: clause.body,
    }));
  }
  const normalized = clauses.map((clause) => ({
    condition: clause.condition,
    body: clause.body,
  }));
  if (stmt.elseBody) {
    normalized.push({ condition: null, body: stmt.elseBody });
  }
  return normalized;
}

function lowerIfStatement(stmt, ctx) {
  const clauses = normalizeIfClauses(stmt);
  if (!clauses.length) {
    return;
  }
  const afterBlock = createBlock(ctx.fn, "join");
  let fallthroughBlock = ctx.current || ensureBlock(ctx, "if");
  for (let i = 0; i < clauses.length; i += 1) {
    const clause = clauses[i];
    const hasCondition = Boolean(clause.condition);
    const thenBlock = createBlock(ctx.fn, "if-then");
    const nextBlock = createBlock(ctx.fn, "if-next");
    if (hasCondition) {
      const cond = lowerExpression(clause.condition, ctx);
      emitBranch(ctx, cond, thenBlock, nextBlock, clause.condition);
    } else {
      emitJump(ctx, thenBlock, stmt);
    }
    ctx.current = thenBlock;
    const body = getBlockStatements(clause.body);
    const result = buildSequence(body, ctx, thenBlock);
    result.exits.forEach((exitBlock) => terminateWithJump(ctx, exitBlock, afterBlock, stmt));
    ctx.current = nextBlock;
    fallthroughBlock = nextBlock;
  }
  if (fallthroughBlock && fallthroughBlock.instructions.length) {
    terminateWithJump(ctx, fallthroughBlock, afterBlock, stmt);
  }
  ctx.current = afterBlock;
}

function lowerWhileStatement(stmt, ctx) {
  const loopHead = createBlock(ctx.fn, "while-head");
  const loopBody = createBlock(ctx.fn, "while-body");
  const afterBlock = createBlock(ctx.fn, "while-exit");
  const start = ctx.current || ensureBlock(ctx, "block");
  connect(start, loopHead);
  ctx.current = loopHead;
  const cond = lowerExpression(stmt.condition, ctx);
  emitBranch(ctx, cond, loopBody, afterBlock, stmt.condition);
  ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
  const body = getBlockStatements(stmt.body);
  const result = buildSequence(body, ctx, loopBody);
  result.exits.forEach((exitBlock) => connect(exitBlock, loopHead));
  ctx.loopStack.pop();
  ctx.current = afterBlock;
}

function lowerRepeatStatement(stmt, ctx) {
  const bodyBlock = createBlock(ctx.fn, "repeat-body");
  const condBlock = createBlock(ctx.fn, "repeat-cond");
  const afterBlock = createBlock(ctx.fn, "repeat-exit");
  const start = ctx.current || ensureBlock(ctx, "block");
  connect(start, bodyBlock);
  ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: condBlock });
  const body = getBlockStatements(stmt.body);
  const result = buildSequence(body, ctx, bodyBlock);
  result.exits.forEach((exitBlock) => connect(exitBlock, condBlock));
  ctx.loopStack.pop();
  ctx.current = condBlock;
  const cond = lowerExpression(stmt.condition, ctx);
  emitBranch(ctx, cond, afterBlock, bodyBlock, stmt.condition);
  ctx.current = afterBlock;
}

function lowerForNumericStatement(stmt, ctx) {
  const preheader = ctx.current || ensureBlock(ctx, "block");
  const loopHead = createBlock(ctx.fn, "for-num-head");
  const loopBody = createBlock(ctx.fn, "for-num-body");
  const afterBlock = createBlock(ctx.fn, "for-num-exit");
  const start = lowerExpression(stmt.start, ctx);
  const limit = lowerExpression(stmt.end, ctx);
  const step = stmt.step ? lowerExpression(stmt.step, ctx) : makeConst(1);
  const limitTemp = makeTemp(ctx);
  const stepTemp = makeTemp(ctx);
  emit(ctx, "move", { dest: limitTemp, src: limit }, stmt.end);
  emit(ctx, "move", { dest: stepTemp, src: step }, stmt.step);
  let variableOp = null;
  if (stmt.variable && stmt.variable.type === "Identifier") {
    const bindingId = getBindingId(ctx, stmt.variable);
    if (bindingId != null) {
      variableOp = makeVar(bindingId, getBindingName(ctx, bindingId) || stmt.variable.name);
      emit(ctx, "move", { dest: variableOp, src: start }, stmt.variable);
    } else {
      variableOp = makeGlobal(stmt.variable.name);
      emit(ctx, "move", { dest: variableOp, src: start }, stmt.variable);
    }
  }
  connect(preheader, loopHead);
  ctx.current = loopHead;
  const condTemp = makeTemp(ctx);
  emit(ctx, "for_numeric_check", { variable: variableOp, limit: limitTemp, step: stepTemp, dest: condTemp }, stmt);
  emitBranch(ctx, condTemp, loopBody, afterBlock, stmt);
  ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
  const body = getBlockStatements(stmt.body);
  const result = buildSequence(body, ctx, loopBody);
  result.exits.forEach((exitBlock) => {
    ctx.current = exitBlock;
    const incTemp = makeTemp(ctx);
    const currentVar = variableOp || makeGlobal("_");
    emit(ctx, "binary", { operator: "+", left: currentVar, right: stepTemp, dest: incTemp }, stmt);
    emit(ctx, "move", { dest: currentVar, src: incTemp }, stmt);
    emitJump(ctx, loopHead, stmt);
  });
  ctx.loopStack.pop();
  ctx.current = afterBlock;
}

function lowerForGenericStatement(stmt, ctx) {
  const preheader = ctx.current || ensureBlock(ctx, "block");
  const loopHead = createBlock(ctx.fn, "for-gen-head");
  const loopBody = createBlock(ctx.fn, "for-gen-body");
  const afterBlock = createBlock(ctx.fn, "for-gen-exit");
  const iterators = (stmt.iterators || []).map((expr) => lowerExpression(expr, ctx));
  emit(ctx, "for_generic_init", { iterators }, stmt);
  connect(preheader, loopHead);
  ctx.current = loopHead;
  const variables = (stmt.variables || []).map((v) => {
    if (!v || v.type !== "Identifier") {
      return null;
    }
    const bindingId = getBindingId(ctx, v);
    if (bindingId != null) {
      return makeVar(bindingId, getBindingName(ctx, bindingId) || v.name);
    }
    return makeGlobal(v.name);
  });
  emit(ctx, "for_generic_next", { variables, iterators }, stmt);
  const condTemp = makeTemp(ctx);
  emit(ctx, "for_generic_check", { dest: condTemp }, stmt);
  emitBranch(ctx, condTemp, loopBody, afterBlock, stmt);
  ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
  const body = getBlockStatements(stmt.body);
  const result = buildSequence(body, ctx, loopBody);
  result.exits.forEach((exitBlock) => {
    ctx.current = exitBlock;
    emitJump(ctx, loopHead, stmt);
  });
  ctx.loopStack.pop();
  ctx.current = afterBlock;
}

function lowerDoStatement(stmt, ctx) {
  const body = getBlockStatements(stmt.body);
  buildSequence(body, ctx, ctx.current || ensureBlock(ctx, "do"));
}

function lowerBreakStatement(stmt, ctx) {
  const loop = ctx.loopStack[ctx.loopStack.length - 1];
  if (!loop) {
    throw makeDiagnosticErrorFromNode("break outside loop", stmt);
  }
  emitJump(ctx, loop.breakTarget, stmt);
}

function lowerContinueStatement(stmt, ctx) {
  const loop = ctx.loopStack[ctx.loopStack.length - 1];
  if (!loop) {
    throw makeDiagnosticErrorFromNode("continue outside loop", stmt);
  }
  emitJump(ctx, loop.continueTarget, stmt);
}

function lowerLabelOrGoto(stmt, ctx) {
  if (stmt.type === "LabelStatement") {
    const name = stmt.name ? stmt.name.name : null;
    if (ctx.current && ctx.current.instructions.length) {
      const next = createBlock(ctx.fn, "label");
      connect(ctx.current, next);
      ctx.current = next;
    }
    ctx.current = ctx.current || createBlock(ctx.fn, "label");
    ctx.current.kind = "label";
    ctx.current.label = name;
    if (name) {
      ctx.labels.set(name, ctx.current);
      const pending = ctx.pendingGotos.get(name);
      if (pending) {
        pending.forEach((block) => connect(block, ctx.current));
        ctx.pendingGotos.delete(name);
      }
    }
    return;
  }
  if (stmt.type === "GotoStatement") {
    const name = stmt.name ? stmt.name.name : null;
    const target = name ? ctx.labels.get(name) : null;
    if (target) {
      emitJump(ctx, target, stmt);
      return;
    }
    if (name) {
      if (!ctx.pendingGotos.has(name)) {
        ctx.pendingGotos.set(name, []);
      }
      ctx.pendingGotos.get(name).push(ctx.current);
      emit(ctx, "jump", { target: name }, stmt);
      ctx.current = null;
    }
  }
}

function lowerFunctionDeclaration(stmt, ctx) {
  const fn = buildFunctionIR(stmt, ctx.root, "function", ctx.upvalueInfo);
  const isLocal = Boolean(stmt.isLocal);
  if (isLocal && stmt.name && stmt.name.base && stmt.name.base.type === "Identifier") {
    const bindingId = getBindingId(ctx, stmt.name.base);
    if (bindingId != null) {
      emit(ctx, "move", { dest: makeVar(bindingId, getBindingName(ctx, bindingId) || stmt.name.base.name), src: makeOperand("function", fn.id) }, stmt);
    } else {
      emit(ctx, "move", { dest: makeGlobal(stmt.name.base.name), src: makeOperand("function", fn.id) }, stmt);
    }
  } else if (stmt.name && stmt.name.type === "FunctionName") {
    const base = stmt.name.base ? lowerExpression(stmt.name.base, ctx) : null;
    const members = stmt.name.members || [];
    if (members.length) {
      const target = members[members.length - 1];
      emit(ctx, "set_member", { base, name: target.name, value: makeOperand("function", fn.id) }, stmt);
    } else if (base && (base.kind === "var" || base.kind === "global")) {
      emit(ctx, "move", { dest: base, src: makeOperand("function", fn.id) }, stmt);
    } else if (base && base.kind === "upvalue") {
      emit(ctx, "mem_write", { target: base, value: makeOperand("function", fn.id) }, stmt);
    }
  } else if (stmt.identifier && stmt.identifier.type === "Identifier") {
    const bindingId = getBindingId(ctx, stmt.identifier);
    if (bindingId != null) {
      emit(ctx, "move", { dest: makeVar(bindingId, getBindingName(ctx, bindingId) || stmt.identifier.name), src: makeOperand("function", fn.id) }, stmt);
    } else {
      emit(ctx, "move", { dest: makeGlobal(stmt.identifier.name), src: makeOperand("function", fn.id) }, stmt);
    }
  }
}

function getBlockStatements(body) {
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

function buildSequence(statements, ctx, startBlock) {
  let current = startBlock || createBlock(ctx.fn, "block");
  const entry = current;
  const exits = [];
  for (const stmt of statements) {
    if (!current) {
      current = createBlock(ctx.fn, "block");
    }
    ctx.current = current;
    if (stmt && stmt.type === "LabelStatement") {
      lowerLabelOrGoto(stmt, ctx);
      current = ctx.current;
      continue;
    }
    lowerStatement(stmt, ctx);
    current = ctx.current;
  }
  if (current) {
    exits.push(current);
  }
  return { entry, exits };
}

function buildFunctionIR(node, root, kind, upvalueInfo) {
  const fn = {
    id: root.functions.length,
    kind,
    nodeRange: node && node.range ? node.range : null,
    nodeType: node ? node.type : null,
    blocks: [],
    entryId: null,
    exitId: null,
    tempCount: 0,
  };
  root.functions.push(fn);
  const entry = createBlock(fn, "entry");
  const exit = createBlock(fn, "exit");
  fn.entryId = entry.id;
  fn.exitId = exit.id;

  const info = upvalueInfo && upvalueInfo.upvaluesByFunction && upvalueInfo.upvaluesByFunction.get(node)
    ? upvalueInfo.upvaluesByFunction.get(node)
    : null;
  const upvalueWrites = upvalueInfo && upvalueInfo.upvalueWritesByFunction
    ? upvalueInfo.upvalueWritesByFunction.get(node)
    : null;
  const ctx = {
    fn,
    root,
    current: entry,
    exitBlock: exit,
    labels: new Map(),
    pendingGotos: new Map(),
    loopStack: [],
    upvalues: info || null,
    upvalueInfo,
    scopeInfo: upvalueInfo,
  };

  if (info) {
    fn.upvalues = Array.from(info).map((id) => ({
      id,
      name: upvalueInfo.bindingNames.get(id) || null,
    }));
    fn.upvalueWrites = Array.from(upvalueWrites || []).map((id) => ({
      id,
      name: upvalueInfo.bindingNames.get(id) || null,
    }));
  } else {
    fn.upvalues = [];
    fn.upvalueWrites = [];
  }

  if (Array.isArray(node.parameters)) {
    node.parameters.forEach((param, index) => {
      if (param && param.type === "Identifier") {
        const bindingId = getBindingId(ctx, param);
        if (bindingId != null) {
          emit(ctx, "param", { dest: makeVar(bindingId, getBindingName(ctx, bindingId) || param.name), index }, param);
        } else {
          emit(ctx, "param", { dest: makeGlobal(param.name), index }, param);
        }
      }
    });
  }

  const bodyStatements = node.type === "Chunk" ? node.body : getBlockStatements(node.body);
  const result = buildSequence(bodyStatements, ctx, entry);
  result.exits.forEach((exitBlock) => terminateWithJump(ctx, exitBlock, exit, node));
  for (const pending of ctx.pendingGotos.values()) {
    pending.forEach((block) => connect(block, exit));
  }
  finalizeBlocks(fn);
  if (!blockHasTerminator(exit)) {
    ctx.current = exit;
    emit(ctx, "return", { values: [makeConst(null)] }, node);
    ctx.current = null;
  }
  return fn;
}

function isVariableOperand(operand) {
  return operand && (operand.kind === "var" || operand.kind === "temp");
}

function operandKey(operand) {
  if (!operand) {
    return null;
  }
  if (operand.kind === "var") {
    return operand.value != null ? `var:${operand.value}` : null;
  }
  if (operand.kind === "temp") {
    return operand.value != null ? `temp:${operand.value}` : null;
  }
  return null;
}

function operandDisplay(operand) {
  if (!operand) {
    return null;
  }
  if (operand.kind === "var") {
    return operand.name || String(operand.value);
  }
  if (operand.kind === "temp") {
    return operand.name || `t${operand.value}`;
  }
  return null;
}

function buildIRSSA(input, options = null) {
  const root = normalizeIR(input);
  root.functions.forEach((fn) => {
    simplifyCFG(fn);
    computeDominators(fn);
    insertPhiNodes(fn);
    renameSSA(fn);
    compactIR(fn, options);
    optimizeIR(fn);
  });
  return root;
}

function normalizeIR(input) {
  if (!input) {
    return buildIR(null);
  }
  if (input.functions && Array.isArray(input.functions)) {
    return input;
  }
  if (input.blocks && Array.isArray(input.blocks)) {
    return { functions: [input] };
  }
  return buildIR(input);
}

function collectUpvalueInfo(ast) {
  const rootScope = buildScope(ast, { includeTypes: false });
  let nextId = 1;
  const bindingIds = new Map();
  const bindingNames = new Map();
  const bindingByNode = new Map();
  const referenceByNode = new Map();
  const upvaluesByFunction = new Map();
  const upvalueWritesByFunction = new Map();

  const getId = (binding) => {
    if (!binding) {
      return null;
    }
    if (bindingIds.has(binding)) {
      return bindingIds.get(binding);
    }
    const id = nextId;
    nextId += 1;
    bindingIds.set(binding, id);
    bindingNames.set(id, binding.name);
    return id;
  };

  const visit = (scope) => {
    if (!scope) {
      return;
    }
    for (const list of scope.bindings.values()) {
      list.forEach((binding) => {
        const id = getId(binding);
        if (binding && binding.node) {
          bindingByNode.set(binding.node, id);
        }
      });
    }
    scope.references.forEach((ref) => {
      const id = getId(ref.binding);
      if (ref && ref.node && id != null) {
        referenceByNode.set(ref.node, id);
      }
    });

    const node = scope.node;
    if (node && (node.type === "FunctionExpression" || node.type === "FunctionDeclaration" || node.type === "Chunk")) {
      const upvalues = new Set();
      const upvalueWrites = new Set();
      scope.references.forEach((ref) => {
        if (!ref || !ref.binding || !ref.binding.scope) {
          return;
        }
        if (ref.binding.scope === scope) {
          return;
        }
        const id = getId(ref.binding);
        if (id == null) {
          return;
        }
        upvalues.add(id);
        if (ref.kind === "write" || ref.kind === "readwrite") {
          upvalueWrites.add(id);
        }
      });
      upvaluesByFunction.set(node, upvalues);
      upvalueWritesByFunction.set(node, upvalueWrites);
    }
    scope.children.forEach((child) => visit(child));
  };
  visit(rootScope);
  return {
    bindingByNode,
    referenceByNode,
    bindingNames,
    upvaluesByFunction,
    upvalueWritesByFunction,
  };
}

function insertPhiNodes(fn) {
  const defBlocks = new Map();
  const defsByBlock = new Map();
  const baseInfo = new Map();

  const addDef = (blockId, operand) => {
    if (!isVariableOperand(operand)) {
      return;
    }
    const key = operandKey(operand);
    if (!key) {
      return;
    }
    baseInfo.set(key, operandDisplay(operand));
    if (!defsByBlock.has(blockId)) {
      defsByBlock.set(blockId, new Set());
    }
    defsByBlock.get(blockId).add(key);
    if (!defBlocks.has(key)) {
      defBlocks.set(key, new Set());
    }
    defBlocks.get(key).add(blockId);
  };

  fn.blocks.forEach((block) => {
    const defs = new Set();
    defsByBlock.set(block.id, defs);
    block.instructions.forEach((inst) => {
      getInstructionDefs(inst).forEach((operand) => {
        addDef(block.id, operand);
      });
    });
  });

  const phiByBlock = new Map();
  defBlocks.forEach((blocks, key) => {
    const work = Array.from(blocks);
    const hasPhi = new Set();
    while (work.length) {
      const blockId = work.pop();
      const frontier = fn.dominanceFrontier && fn.dominanceFrontier[blockId]
        ? fn.dominanceFrontier[blockId]
        : [];
      for (const frontierId of frontier) {
        const tag = `${frontierId}:${key}`;
        if (hasPhi.has(tag)) {
          continue;
        }
        hasPhi.add(tag);
        if (!phiByBlock.has(frontierId)) {
          phiByBlock.set(frontierId, new Map());
        }
        const map = phiByBlock.get(frontierId);
        if (!map.has(key)) {
          map.set(key, {
            op: "phi",
            base: key,
            name: baseInfo.get(key) || key,
            dest: null,
            args: {},
          });
        }
        const defsAtFrontier = defsByBlock.get(frontierId);
        if (!defsAtFrontier || !defsAtFrontier.has(key)) {
          work.push(frontierId);
        }
      }
    }
  });

  fn.blocks.forEach((block) => {
    const map = phiByBlock.get(block.id);
    block.phi = map ? Array.from(map.values()) : [];
  });
}

function renameSSA(fn) {
  const stacks = new Map();
  const versions = new Map();
  const state = {
    stacks,
    versions,
    valueCount: 0,
  };
  const visited = new Set();

  const resetState = () => {
    stacks.clear();
    versions.clear();
  };

  const currentVersion = (key, display) => {
    if (!stacks.has(key)) {
      stacks.set(key, []);
    }
    const stack = stacks.get(key);
    if (!stack.length) {
      const init = makeSSAValue(state, key, display, 0, true);
      stack.push(init);
    }
    return stack[stack.length - 1];
  };

  const newVersion = (key, display) => {
    const next = (versions.get(key) || 0) + 1;
    versions.set(key, next);
    const value = makeSSAValue(state, key, display, next, false);
    if (!stacks.has(key)) {
      stacks.set(key, []);
    }
    stacks.get(key).push(value);
    return value;
  };

  const renameBlock = (blockId) => {
    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);
    const block = fn.blocks[blockId];
    const pushed = [];
    const renameOperandUse = (operand) => {
      if (!isVariableOperand(operand)) {
        return operand;
      }
      const key = operandKey(operand);
      if (!key) {
        return operand;
      }
      return currentVersion(key, operandDisplay(operand));
    };
    const renameOperandDef = (operand) => {
      if (!isVariableOperand(operand)) {
        return operand;
      }
      const key = operandKey(operand);
      if (!key) {
        return operand;
      }
      const value = newVersion(key, operandDisplay(operand));
      pushed.push(key);
      return value;
    };
    (block.phi || []).forEach((phi) => {
      const key = phi.base;
      const value = newVersion(key, phi.name);
      phi.dest = value;
      pushed.push(key);
    });

    block.instructions.forEach((inst) => {
      renameInstruction(inst, renameOperandUse, renameOperandDef);
    });

    block.successors.forEach((succId) => {
      const succ = fn.blocks[succId];
      (succ.phi || []).forEach((phi) => {
        const key = phi.base;
        const current = currentVersion(key, phi.name);
        phi.args[blockId] = current;
      });
    });

    const children = fn.dominatorTree ? fn.dominatorTree[blockId] || [] : [];
    children.forEach((childId) => renameBlock(childId));

    pushed.reverse().forEach((key) => {
  const stack = stacks.get(key);
  if (stack && stack.length) {
    stack.pop();
  }
    });
  };

  resetState();
  renameBlock(fn.entryId);
  fn.blocks.forEach((block) => {
    if (!visited.has(block.id)) {
      resetState();
      renameBlock(block.id);
    }
  });

  fn.blocks.forEach((block) => {
    if (block.phi && block.phi.length) {
      block.instructions = [...block.phi, ...block.instructions];
    }
  });
}

function makeSSAValue(state, key, name, version, initial) {
  state.valueCount += 1;
  return {
    kind: "ssa",
    id: `v${state.valueCount}`,
    name,
    base: key,
    version,
    initial: Boolean(initial),
  };
}

function getInstructionDefs(inst) {
  if (!inst) {
    return [];
  }
  switch (inst.op) {
    case "param":
    case "move":
    case "binary":
    case "unary":
    case "call":
    case "method_call":
    case "get_index":
    case "get_member":
    case "table_new":
    case "for_numeric_check":
    case "for_generic_check":
    case "interpolate":
      return inst.dest ? [inst.dest] : [];
    case "for_generic_next":
      return inst.variables ? inst.variables.filter(Boolean) : [];
    default:
      return [];
  }
}

function renameInstruction(inst, renameUse, renameDef) {
  if (!inst) {
    return;
  }
  switch (inst.op) {
    case "param":
      inst.dest = renameDef(inst.dest);
      return;
    case "move":
      inst.src = renameUse(inst.src);
      inst.dest = renameDef(inst.dest);
      return;
    case "binary":
      inst.left = renameUse(inst.left);
      inst.right = renameUse(inst.right);
      inst.dest = renameDef(inst.dest);
      return;
    case "unary":
      inst.argument = renameUse(inst.argument);
      inst.dest = renameDef(inst.dest);
      return;
    case "call":
      inst.base = renameUse(inst.base);
      inst.args = (inst.args || []).map((arg) => renameUse(arg));
      if (inst.dest) {
        inst.dest = renameDef(inst.dest);
      }
      return;
    case "method_call":
      inst.base = renameUse(inst.base);
      inst.args = (inst.args || []).map((arg) => renameUse(arg));
      if (inst.dest) {
        inst.dest = renameDef(inst.dest);
      }
      return;
    case "get_index":
      inst.base = renameUse(inst.base);
      inst.index = renameUse(inst.index);
      inst.dest = renameDef(inst.dest);
      return;
    case "get_member":
      inst.base = renameUse(inst.base);
      inst.dest = renameDef(inst.dest);
      return;
    case "set_index":
      inst.base = renameUse(inst.base);
      inst.index = renameUse(inst.index);
      inst.value = renameUse(inst.value);
      return;
    case "set_member":
      inst.base = renameUse(inst.base);
      inst.value = renameUse(inst.value);
      return;
    case "table_new":
      inst.dest = renameDef(inst.dest);
      return;
    case "table_set":
      inst.base = renameUse(inst.base);
      inst.key = renameUse(inst.key);
      inst.value = renameUse(inst.value);
      return;
    case "mem_write":
      inst.target = renameUse(inst.target);
      inst.value = renameUse(inst.value);
      return;
    case "return":
      inst.values = (inst.values || []).map((value) => renameUse(value));
      return;
    case "branch":
      inst.test = renameUse(inst.test);
      return;
    case "for_numeric_check":
      inst.variable = renameUse(inst.variable);
      inst.limit = renameUse(inst.limit);
      inst.step = renameUse(inst.step);
      inst.dest = renameDef(inst.dest);
      return;
    case "for_generic_init":
      inst.iterators = (inst.iterators || []).map((value) => renameUse(value));
      return;
    case "for_generic_next":
      inst.iterators = (inst.iterators || []).map((value) => renameUse(value));
      inst.variables = (inst.variables || []).map((value) => renameDef(value));
      return;
    case "for_generic_check":
      inst.dest = renameDef(inst.dest);
      return;
    case "interpolate":
      inst.parts = (inst.parts || []).map((value) => renameUse(value));
      inst.dest = renameDef(inst.dest);
      return;
    default:
      return;
  }
}

function compactIR(fn, options = null) {
  const anonymize = Boolean(options && options.anonymizeNames);
  const values = {};
  let nextValueId = 1;
  const legacyValues = new Map();
  const consts = [];
  const constMap = new Map();

  const reserveValueId = (id) => {
    if (!id || typeof id !== "string" || !id.startsWith("v")) {
      return;
    }
    const num = Number(id.slice(1));
    if (Number.isFinite(num) && num >= nextValueId) {
      nextValueId = num + 1;
    }
  };

  const allocLegacyValue = (operand) => {
    const key = operandKey(operand);
    if (!key) {
      return null;
    }
    if (legacyValues.has(key)) {
      return legacyValues.get(key);
    }
    const id = `vL${nextValueId}`;
    nextValueId += 1;
    legacyValues.set(key, id);
    values[id] = {
      name: anonymize ? null : operand.name || null,
      base: key,
      version: 0,
      kind: "ssa",
    };
    return id;
  };

  const constKey = (value) => `${typeof value}:${String(value)}`;
  const registerConst = (value) => {
    const key = constKey(value);
    if (constMap.has(key)) {
      return constMap.get(key);
    }
    const id = `k${consts.length}`;
    consts.push(value);
    constMap.set(key, id);
    return id;
  };

  const registerValue = (operand) => {
    if (!operand || typeof operand !== "object") {
      return operand;
    }
    switch (operand.kind) {
      case "ssa": {
        const id = operand.id;
        reserveValueId(id);
        if (id && !values[id]) {
          values[id] = {
            name: anonymize ? null : operand.name || null,
            base: operand.base || null,
            version: operand.version ?? null,
            kind: "ssa",
          };
        }
        return id;
      }
      case "const":
        return registerConst(operand.value);
      case "global":
        return operand.name ? `g:${operand.name}` : `g:${operand.value}`;
      case "upvalue":
        return operand.name ? `u:${operand.name}` : `u:${operand.value}`;
      case "function":
        return `fn#${operand.value}`;
      case "vararg":
        return "...";
      case "var":
        return allocLegacyValue(operand);
      case "temp":
        return allocLegacyValue(operand);
      default:
        return operand;
    }
  };

  const mapOperand = (operand) => {
    if (!operand || typeof operand !== "object") {
      return operand;
    }
    return registerValue(operand);
  };

  const mapArgsObject = (args) => {
    if (!args) {
      return args;
    }
    const out = {};
    Object.keys(args).forEach((key) => {
      out[key] = mapOperand(args[key]);
    });
    return out;
  };

  const mapInstruction = (inst) => {
    if (!inst) {
      return;
    }
    switch (inst.op) {
      case "phi":
        inst.dest = mapOperand(inst.dest);
        inst.args = mapArgsObject(inst.args);
        return;
      case "param":
        inst.dest = mapOperand(inst.dest);
        return;
      case "move":
        inst.dest = mapOperand(inst.dest);
        inst.src = mapOperand(inst.src);
        return;
      case "binary":
        inst.left = mapOperand(inst.left);
        inst.right = mapOperand(inst.right);
        inst.dest = mapOperand(inst.dest);
        return;
      case "unary":
        inst.argument = mapOperand(inst.argument);
        inst.dest = mapOperand(inst.dest);
        return;
      case "call":
        inst.base = mapOperand(inst.base);
        inst.args = (inst.args || []).map(mapOperand);
        if (inst.dest) {
          inst.dest = mapOperand(inst.dest);
        }
        return;
      case "method_call":
        inst.base = mapOperand(inst.base);
        inst.args = (inst.args || []).map(mapOperand);
        if (inst.dest) {
          inst.dest = mapOperand(inst.dest);
        }
        return;
      case "get_index":
        inst.base = mapOperand(inst.base);
        inst.index = mapOperand(inst.index);
        inst.dest = mapOperand(inst.dest);
        return;
      case "set_index":
        inst.base = mapOperand(inst.base);
        inst.index = mapOperand(inst.index);
        inst.value = mapOperand(inst.value);
        return;
      case "get_member":
        inst.base = mapOperand(inst.base);
        inst.dest = mapOperand(inst.dest);
        return;
      case "set_member":
        inst.base = mapOperand(inst.base);
        inst.value = mapOperand(inst.value);
        return;
      case "table_new":
        inst.dest = mapOperand(inst.dest);
        return;
      case "table_set":
        inst.base = mapOperand(inst.base);
        inst.key = mapOperand(inst.key);
        inst.value = mapOperand(inst.value);
        return;
      case "interpolate":
        inst.parts = (inst.parts || []).map(mapOperand);
        inst.dest = mapOperand(inst.dest);
        return;
      case "branch":
        inst.test = mapOperand(inst.test);
        return;
      case "return":
        inst.values = (inst.values || []).map(mapOperand);
        return;
      case "for_numeric_check":
        inst.variable = mapOperand(inst.variable);
        inst.limit = mapOperand(inst.limit);
        inst.step = mapOperand(inst.step);
        inst.dest = mapOperand(inst.dest);
        return;
      case "for_generic_init":
        inst.iterators = (inst.iterators || []).map(mapOperand);
        return;
      case "for_generic_next":
        inst.iterators = (inst.iterators || []).map(mapOperand);
        inst.variables = (inst.variables || []).map(mapOperand);
        return;
      case "for_generic_check":
        inst.dest = mapOperand(inst.dest);
        return;
      case "mem_write":
        inst.target = mapOperand(inst.target);
        inst.value = mapOperand(inst.value);
        return;
      default:
        return;
    }
  };

  fn.blocks.forEach((block) => {
    block.instructions.forEach((inst) => mapInstruction(inst));
  });

  Object.keys(values).forEach((id) => {
    const info = values[id];
    if (!info || info.display) {
      return;
    }
    let baseName = anonymize ? null : info.name || null;
    if (!baseName && info.base) {
      if (String(info.base).startsWith("temp:")) {
        const tempId = String(info.base).slice("temp:".length);
        baseName = `t${tempId}`;
      } else if (String(info.base).startsWith("var:")) {
        const varId = String(info.base).slice("var:".length);
        baseName = `v${varId}`;
      }
    }
    if (baseName && info.version != null) {
      info.display = `${baseName}$${info.version}`;
      if (!anonymize && !info.origName && info.name) {
        info.origName = info.name;
      }
    }
  });

  fn.values = values;
  if (consts.length) {
    fn.consts = consts;
  }
}

function optimizeIR(fn) {
  removeEmptyPhis(fn);
  foldTrivialPhis(fn);
  mergeTrivialJumpBlocks(fn);
}

function simplifyCFG(fn) {
  foldConstantBranches(fn);
  mergeJumpOnlyBlocks(fn);
  removeUnreachableBlocks(fn);
}

function foldConstantBranches(fn) {
  fn.blocks.forEach((block) => {
    if (!block || block.removed) {
      return;
    }
    const insts = block.instructions || [];
    if (!insts.length) {
      return;
    }
    const term = insts[insts.length - 1];
    if (!term || term.op !== "branch") {
      return;
    }
    const testValue = resolveConstValue(term.test, fn);
    if (testValue === null) {
      return;
    }
    const truthy = !(testValue === false || testValue === null);
    const target = truthy ? term.consequent : term.alternate;
    if (typeof target !== "number") {
      return;
    }
    const oldSucc = Array.isArray(block.successors) ? block.successors.slice() : [];
    insts[insts.length - 1] = { op: "jump", target };
    block.successors = [target];
    oldSucc.forEach((succId) => {
      if (succId === target) {
        return;
      }
      const succ = fn.blocks[succId];
      if (!succ || succ.removed) {
        return;
      }
      succ.predecessors = (succ.predecessors || []).filter((id) => id !== block.id);
    });
    const succ = fn.blocks[target];
    if (succ && !succ.removed) {
      if (!succ.predecessors.includes(block.id)) {
        succ.predecessors.push(block.id);
      }
    }
  });
}

function resolveConstValue(operand, fn) {
  if (!operand) {
    return null;
  }
  if (typeof operand === "object") {
    if (operand.kind === "const") {
      return operand.value;
    }
    return null;
  }
  if (typeof operand === "string" && operand.startsWith("k")) {
    const idx = Number(operand.slice(1));
    if (Number.isFinite(idx) && fn.consts && idx >= 0 && idx < fn.consts.length) {
      return fn.consts[idx];
    }
  }
  return null;
}

function mergeJumpOnlyBlocks(fn) {
  let changed = true;
  while (changed) {
    changed = false;
    fn.blocks.forEach((block) => {
      if (!block || block.removed || block.kind === "entry") {
        return;
      }
      const insts = block.instructions || [];
      if (insts.length !== 1) {
        return;
      }
      const term = insts[0];
      if (!term || term.op !== "jump" || typeof term.target !== "number") {
        return;
      }
      if (term.target === block.id) {
        return;
      }
      const preds = Array.isArray(block.predecessors) ? block.predecessors.slice() : [];
      if (!preds.length) {
        return;
      }
      const target = fn.blocks[term.target];
      if (!target || target.removed) {
        return;
      }
      preds.forEach((predId) => {
        const pred = fn.blocks[predId];
        if (!pred || pred.removed) {
          return;
        }
        redirectTerminator(pred, block.id, target.id);
        pred.successors = (pred.successors || []).filter((id) => id !== block.id);
        if (!pred.successors.includes(target.id)) {
          pred.successors.push(target.id);
        }
        if (!target.predecessors.includes(pred.id)) {
          target.predecessors.push(pred.id);
        }
      });
      target.predecessors = (target.predecessors || []).filter((id) => id !== block.id);
      block.instructions = [];
      block.successors = [];
      block.predecessors = [];
      block.removed = true;
      changed = true;
    });
  }
}

function removeUnreachableBlocks(fn) {
  const reachable = new Set();
  const stack = [fn.entryId];
  while (stack.length) {
    const id = stack.pop();
    if (reachable.has(id)) {
      continue;
    }
    const block = fn.blocks[id];
    if (!block || block.removed) {
      continue;
    }
    reachable.add(id);
    (block.successors || []).forEach((succId) => {
      if (!reachable.has(succId)) {
        stack.push(succId);
      }
    });
  }
  fn.blocks.forEach((block) => {
    if (!block) {
      return;
    }
    if (!reachable.has(block.id)) {
      block.removed = true;
      block.instructions = [];
      block.successors = [];
      block.predecessors = [];
    }
  });
  fn.blocks.forEach((block) => {
    if (!block || block.removed) {
      return;
    }
    block.successors = (block.successors || []).filter((id) => reachable.has(id) && !fn.blocks[id].removed);
    block.predecessors = (block.predecessors || []).filter((id) => reachable.has(id) && !fn.blocks[id].removed);
  });
}

function removeEmptyPhis(fn) {
  fn.blocks.forEach((block) => {
    if (!block || block.removed) {
      return;
    }
    const next = [];
    (block.instructions || []).forEach((inst) => {
      if (inst.op !== "phi") {
        next.push(inst);
        return;
      }
      if (!inst.dest) {
        return;
      }
      const args = inst.args ? Object.keys(inst.args) : [];
      if (!args.length) {
        return;
      }
      next.push(inst);
    });
    block.instructions = next;
  });
}

function foldTrivialPhis(fn) {
  let changed = true;
  while (changed) {
    changed = false;
    fn.blocks.forEach((block) => {
      if (!block || block.removed) {
        return;
      }
      const next = [];
      (block.instructions || []).forEach((inst) => {
        if (inst.op !== "phi") {
          next.push(inst);
          return;
        }
        if (!inst.dest || !inst.args) {
          changed = true;
          return;
        }
        const values = Object.values(inst.args).filter((value) => value != null);
        if (!values.length) {
          changed = true;
          return;
        }
        const unique = new Set(values);
        if (unique.size === 1) {
          const only = values[0];
          if (only !== inst.dest) {
            replaceOperandUses(fn, inst.dest, only);
          }
          changed = true;
          return;
        }
        next.push(inst);
      });
      block.instructions = next;
    });
  }
}

function replaceOperandUses(fn, from, to) {
  if (!from || from === to) {
    return;
  }
  fn.blocks.forEach((block) => {
    if (!block || block.removed) {
      return;
    }
    (block.instructions || []).forEach((inst) => {
      if (!inst) {
        return;
      }
      const replaceValue = (value) => (value === from ? to : value);
      const replaceArray = (values) => values.map((value) => replaceValue(value));
      switch (inst.op) {
        case "phi":
          if (inst.args) {
            Object.keys(inst.args).forEach((key) => {
              inst.args[key] = replaceValue(inst.args[key]);
            });
          }
          return;
        case "move":
          inst.src = replaceValue(inst.src);
          return;
        case "binary":
          inst.left = replaceValue(inst.left);
          inst.right = replaceValue(inst.right);
          return;
        case "unary":
          inst.argument = replaceValue(inst.argument);
          return;
        case "call":
          inst.base = replaceValue(inst.base);
          inst.args = replaceArray(inst.args || []);
          return;
        case "method_call":
          inst.base = replaceValue(inst.base);
          inst.args = replaceArray(inst.args || []);
          return;
        case "get_index":
          inst.base = replaceValue(inst.base);
          inst.index = replaceValue(inst.index);
          return;
        case "set_index":
          inst.base = replaceValue(inst.base);
          inst.index = replaceValue(inst.index);
          inst.value = replaceValue(inst.value);
          return;
        case "get_member":
          inst.base = replaceValue(inst.base);
          return;
        case "set_member":
          inst.base = replaceValue(inst.base);
          inst.value = replaceValue(inst.value);
          return;
        case "table_set":
          inst.base = replaceValue(inst.base);
          inst.key = replaceValue(inst.key);
          inst.value = replaceValue(inst.value);
          return;
        case "interpolate":
          inst.parts = replaceArray(inst.parts || []);
          return;
        case "branch":
          inst.test = replaceValue(inst.test);
          return;
        case "return":
          inst.values = replaceArray(inst.values || []);
          return;
        case "for_numeric_check":
          inst.variable = replaceValue(inst.variable);
          inst.limit = replaceValue(inst.limit);
          inst.step = replaceValue(inst.step);
          return;
        case "for_generic_init":
          inst.iterators = replaceArray(inst.iterators || []);
          return;
        case "for_generic_next":
          inst.iterators = replaceArray(inst.iterators || []);
          return;
        case "mem_write":
          inst.target = replaceValue(inst.target);
          inst.value = replaceValue(inst.value);
          return;
        default:
          return;
      }
    });
  });
}

function mergeTrivialJumpBlocks(fn) {
  let changed = true;
  while (changed) {
    changed = false;
    fn.blocks.forEach((block) => {
      if (!block || block.removed || block.kind === "entry") {
        return;
      }
      const insts = block.instructions || [];
      if (!insts.length) {
        return;
      }
      const terminator = insts[insts.length - 1];
      if (!terminator || terminator.op !== "jump" || typeof terminator.target !== "number") {
        return;
      }
      const target = fn.blocks[terminator.target];
      if (!target || target.removed || target.id === block.id) {
        return;
      }
      const moveOnly = insts.slice(0, -1).every((inst) => inst.op === "move");
      const jumpOnly = insts.length === 1;
      if (!jumpOnly && !moveOnly) {
        return;
      }
      if (moveOnly) {
        if (!Array.isArray(target.predecessors) || target.predecessors.length !== 1 || target.predecessors[0] !== block.id) {
          return;
        }
      }
      if (!canBypassBlock(block, target)) {
        return;
      }
      const moves = moveOnly ? insts.slice(0, -1) : [];
      bypassBlock(fn, block, target);
      if (moves.length) {
        const insertAt = target.instructions.findIndex((inst) => inst.op !== "phi");
        const index = insertAt === -1 ? target.instructions.length : insertAt;
        target.instructions.splice(index, 0, ...moves);
      }
      changed = true;
    });
  }
}

function canBypassBlock(block, target) {
  const preds = Array.isArray(block.predecessors) ? block.predecessors : [];
  const phiNodes = (target.instructions || []).filter((inst) => inst.op === "phi");
  if (!phiNodes.length) {
    return true;
  }
  for (const phi of phiNodes) {
    const args = phi.args || {};
    const hasBlockArg = Object.prototype.hasOwnProperty.call(args, block.id);
    const valueForBlock = hasBlockArg ? args[block.id] : undefined;
    for (const pred of preds) {
      const hasPredArg = Object.prototype.hasOwnProperty.call(args, pred);
      if (!hasBlockArg) {
        if (!hasPredArg) {
          return false;
        }
        continue;
      }
      if (hasPredArg && args[pred] !== valueForBlock) {
        return false;
      }
      if (!hasPredArg && valueForBlock === undefined) {
        return false;
      }
    }
  }
  return true;
}

function bypassBlock(fn, block, target) {
  const preds = Array.isArray(block.predecessors) ? block.predecessors : [];
  const phiNodes = (target.instructions || []).filter((inst) => inst.op === "phi");
  phiNodes.forEach((phi) => {
    if (!phi.args) {
      return;
    }
    const hasBlockArg = Object.prototype.hasOwnProperty.call(phi.args, block.id);
    const valueForBlock = hasBlockArg ? phi.args[block.id] : undefined;
    if (hasBlockArg) {
      preds.forEach((pred) => {
        if (!Object.prototype.hasOwnProperty.call(phi.args, pred)) {
          phi.args[pred] = valueForBlock;
        }
      });
      delete phi.args[block.id];
    }
  });

  preds.forEach((predId) => {
    const pred = fn.blocks[predId];
    if (!pred || pred.removed) {
      return;
    }
    redirectTerminator(pred, block.id, target.id);
    pred.successors = (pred.successors || []).filter((id) => id !== block.id);
    if (!pred.successors.includes(target.id)) {
      pred.successors.push(target.id);
    }
    if (!target.predecessors.includes(pred.id)) {
      target.predecessors.push(pred.id);
    }
  });

  target.predecessors = (target.predecessors || []).filter((id) => id !== block.id);
  block.instructions = [];
  block.successors = [];
  block.predecessors = [];
  block.removed = true;
}

function redirectTerminator(block, fromId, toId) {
  const insts = block.instructions || [];
  if (!insts.length) {
    return;
  }
  const term = insts[insts.length - 1];
  if (!term) {
    return;
  }
  if (term.op === "jump") {
    if (term.target === fromId) {
      term.target = toId;
    }
    return;
  }
  if (term.op === "branch") {
    if (term.consequent === fromId) {
      term.consequent = toId;
    }
    if (term.alternate === fromId) {
      term.alternate = toId;
    }
  }
}

function buildIR(ast) {
  const upvalueInfo = collectUpvalueInfo(ast);
  const root = { functions: [] };
  buildFunctionIR(ast, root, "chunk", upvalueInfo);
  return root;
}

module.exports = {
  buildIR,
  buildIRSSA,
};
