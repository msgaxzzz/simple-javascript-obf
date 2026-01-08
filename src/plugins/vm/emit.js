const generate = require("@babel/generator").default;

const { BIN_OPS, UNARY_OPS, OPCODES } = require("./constants");
const { createLabel } = require("./compiler");
const { containsSuper, isSimpleLiteral, literalValue } = require("./ast-utils");

function hasWithStack(state) {
  return Array.isArray(state.withStack) && state.withStack.length > 0;
}

function emitWithGet(name, compiler, state) {
  if (!hasWithStack(state)) {
    return false;
  }
  const nameIdx = compiler.addConst(name);
  const inIndex = BIN_OPS.indexOf("in");
  const end = createLabel();
  for (let i = state.withStack.length - 1; i >= 0; i -= 1) {
    const withName = state.withStack[i];
    const withIdx = compiler.addConst(withName);
    const next = createLabel();
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.BIN_OP, inIndex);
    compiler.emitJump(OPCODES.JMP_IF_FALSE, next);
    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_PROP);
    compiler.emitJump(OPCODES.JMP, end);
    compiler.mark(next);
  }
  compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
  compiler.mark(end);
  return true;
}

function emitMemberAssignment(expr, compiler, state) {
  const left = expr.left;
  if (left.type !== "MemberExpression") {
    return false;
  }
  const objTemp = compiler.createTempName();
  const propTemp = compiler.createTempName();
  const objIdx = compiler.addConst(objTemp);
  const propIdx = compiler.addConst(propTemp);

  if (!compileExpression(left.object, compiler, state)) return false;
  compiler.emit(OPCODES.SET_VAR, objIdx);
  compiler.emit(OPCODES.POP);

  if (left.computed) {
    if (!compileExpression(left.property, compiler, state)) return false;
  } else {
    compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(left.property.name));
  }
  compiler.emit(OPCODES.SET_VAR, propIdx);
  compiler.emit(OPCODES.POP);

  if (expr.operator === "=") {
    compiler.emit(OPCODES.GET_VAR, objIdx);
    compiler.emit(OPCODES.GET_VAR, propIdx);
    if (!compileExpression(expr.right, compiler, state)) return false;
    compiler.emit(OPCODES.SET_PROP);
    return true;
  }

  const op = expr.operator.slice(0, -1);
  const opIndex = BIN_OPS.indexOf(op);
  if (opIndex === -1) return false;

  compiler.emit(OPCODES.GET_VAR, objIdx);
  compiler.emit(OPCODES.GET_VAR, propIdx);
  compiler.emit(OPCODES.GET_PROP);
  if (!compileExpression(expr.right, compiler, state)) return false;
  compiler.emit(OPCODES.BIN_OP, opIndex);

  const valueTemp = compiler.createTempName();
  const valueIdx = compiler.addConst(valueTemp);
  compiler.emit(OPCODES.SET_VAR, valueIdx);
  compiler.emit(OPCODES.POP);

  compiler.emit(OPCODES.GET_VAR, objIdx);
  compiler.emit(OPCODES.GET_VAR, propIdx);
  compiler.emit(OPCODES.GET_VAR, valueIdx);
  compiler.emit(OPCODES.SET_PROP);
  return true;
}

function emitMemberUpdate(expr, compiler, state) {
  const arg = expr.argument;
  if (arg.type !== "MemberExpression") {
    return false;
  }
  const isPrefix = expr.prefix;
  const delta = expr.operator === "++" ? 1 : -1;
  const objTemp = compiler.createTempName();
  const propTemp = compiler.createTempName();
  const objIdx = compiler.addConst(objTemp);
  const propIdx = compiler.addConst(propTemp);

  if (!compileExpression(arg.object, compiler, state)) return false;
  compiler.emit(OPCODES.SET_VAR, objIdx);
  compiler.emit(OPCODES.POP);

  if (arg.computed) {
    if (!compileExpression(arg.property, compiler, state)) return false;
  } else {
    compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(arg.property.name));
  }
  compiler.emit(OPCODES.SET_VAR, propIdx);
  compiler.emit(OPCODES.POP);

  compiler.emit(OPCODES.GET_VAR, objIdx);
  compiler.emit(OPCODES.GET_VAR, propIdx);
  compiler.emit(OPCODES.GET_PROP);

  const oldTemp = compiler.createTempName();
  const oldIdx = compiler.addConst(oldTemp);
  compiler.emit(OPCODES.SET_VAR, oldIdx);
  compiler.emit(OPCODES.POP);

  compiler.emit(OPCODES.GET_VAR, oldIdx);
  compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
  compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));

  const newTemp = compiler.createTempName();
  const newIdx = compiler.addConst(newTemp);
  compiler.emit(OPCODES.SET_VAR, newIdx);
  compiler.emit(OPCODES.POP);

  compiler.emit(OPCODES.GET_VAR, objIdx);
  compiler.emit(OPCODES.GET_VAR, propIdx);
  compiler.emit(OPCODES.GET_VAR, newIdx);
  compiler.emit(OPCODES.SET_PROP);

  if (!isPrefix) {
    compiler.emit(OPCODES.POP);
    compiler.emit(OPCODES.GET_VAR, oldIdx);
  } else {
    compiler.emit(OPCODES.GET_VAR, newIdx);
  }

  return true;
}

function emitWithAssignment(expr, compiler, state) {
  if (!hasWithStack(state)) {
    return false;
  }
  if (expr.left.type !== "Identifier") {
    return false;
  }
  const name = expr.left.name;
  if (state.locals.has(name)) {
    return false;
  }

  const nameIdx = compiler.addConst(name);
  const inIndex = BIN_OPS.indexOf("in");
  const end = createLabel();
  for (let i = state.withStack.length - 1; i >= 0; i -= 1) {
    const withName = state.withStack[i];
    const withIdx = compiler.addConst(withName);
    const next = createLabel();
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.BIN_OP, inIndex);
    compiler.emitJump(OPCODES.JMP_IF_FALSE, next);
    if (expr.operator === "=") {
      compiler.emit(OPCODES.GET_VAR, withIdx);
      compiler.emit(OPCODES.PUSH_CONST, nameIdx);
      if (!compileExpression(expr.right, compiler, state)) return false;
      compiler.emit(OPCODES.SET_PROP);
    } else {
      const op = expr.operator.slice(0, -1);
      const opIndex = BIN_OPS.indexOf(op);
      if (opIndex === -1) return false;
      compiler.emit(OPCODES.GET_VAR, withIdx);
      compiler.emit(OPCODES.PUSH_CONST, nameIdx);
      compiler.emit(OPCODES.GET_PROP);
      if (!compileExpression(expr.right, compiler, state)) return false;
      compiler.emit(OPCODES.BIN_OP, opIndex);

      const valueTemp = compiler.createTempName();
      const valueIdx = compiler.addConst(valueTemp);
      compiler.emit(OPCODES.SET_VAR, valueIdx);
      compiler.emit(OPCODES.POP);

      compiler.emit(OPCODES.GET_VAR, withIdx);
      compiler.emit(OPCODES.PUSH_CONST, nameIdx);
      compiler.emit(OPCODES.GET_VAR, valueIdx);
      compiler.emit(OPCODES.SET_PROP);
    }
    compiler.emitJump(OPCODES.JMP, end);
    compiler.mark(next);
  }
  if (expr.operator === "=") {
    if (!compileExpression(expr.right, compiler, state)) return false;
    compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
  } else {
    const op = expr.operator.slice(0, -1);
    const opIndex = BIN_OPS.indexOf(op);
    if (opIndex === -1) return false;
    compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
    if (!compileExpression(expr.right, compiler, state)) return false;
    compiler.emit(OPCODES.BIN_OP, opIndex);
    compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
  }
  compiler.mark(end);
  return true;
}

function emitWithUpdate(expr, compiler, state) {
  if (!hasWithStack(state)) {
    return false;
  }
  if (expr.argument.type !== "Identifier") {
    return false;
  }
  const name = expr.argument.name;
  if (state.locals.has(name)) {
    return false;
  }
  const nameIdx = compiler.addConst(name);
  const inIndex = BIN_OPS.indexOf("in");
  const end = createLabel();
  const isPrefix = expr.prefix;
  const delta = expr.operator === "++" ? 1 : -1;
  for (let i = state.withStack.length - 1; i >= 0; i -= 1) {
    const withName = state.withStack[i];
    const withIdx = compiler.addConst(withName);
    const next = createLabel();
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.BIN_OP, inIndex);
    compiler.emitJump(OPCODES.JMP_IF_FALSE, next);
    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_PROP);
    const oldTemp = compiler.createTempName();
    const oldIdx = compiler.addConst(oldTemp);
    compiler.emit(OPCODES.SET_VAR, oldIdx);
    compiler.emit(OPCODES.POP);
    compiler.emit(OPCODES.GET_VAR, oldIdx);
    compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
    compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));

    const newTemp = compiler.createTempName();
    const newIdx = compiler.addConst(newTemp);
    compiler.emit(OPCODES.SET_VAR, newIdx);
    compiler.emit(OPCODES.POP);

    compiler.emit(OPCODES.GET_VAR, withIdx);
    compiler.emit(OPCODES.PUSH_CONST, nameIdx);
    compiler.emit(OPCODES.GET_VAR, newIdx);
    compiler.emit(OPCODES.SET_PROP);

    if (!isPrefix) {
      compiler.emit(OPCODES.POP);
      compiler.emit(OPCODES.GET_VAR, oldIdx);
    }

    compiler.emitJump(OPCODES.JMP, end);
    compiler.mark(next);
  }

  if (isPrefix) {
    compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
    compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
    compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
    compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
  } else {
    compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
    compiler.emit(OPCODES.DUP);
    compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
    compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
    compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
    compiler.emit(OPCODES.POP);
  }

  compiler.mark(end);
  return true;
}

function storeStackToTemp(compiler) {
  const tempName = compiler.createTempName();
  const tempIdx = compiler.addConst(tempName);
  compiler.emit(OPCODES.SET_VAR, tempIdx);
  compiler.emit(OPCODES.POP);
  return tempIdx;
}

function emitNullishCheck(tempIdx, compiler, nullishLabel) {
  compiler.emit(OPCODES.GET_VAR, tempIdx);
  compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(null));
  compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("=="));
  compiler.emitJump(OPCODES.JMP_IF_TRUE, nullishLabel);
}

function compileOptionalMember(expr, compiler, state, nullishLabel) {
  if (!compileOptionalExpression(expr.object, compiler, state, nullishLabel)) {
    return false;
  }
  if (expr.optional) {
    const objIdx = storeStackToTemp(compiler);
    emitNullishCheck(objIdx, compiler, nullishLabel);
    compiler.emit(OPCODES.GET_VAR, objIdx);
  }
  if (expr.computed) {
    if (!compileExpression(expr.property, compiler, state)) return false;
  } else {
    const idx = compiler.addConst(expr.property.name);
    compiler.emit(OPCODES.PUSH_CONST, idx);
  }
  compiler.emit(OPCODES.GET_PROP);
  return true;
}

function compileOptionalCall(expr, compiler, state, nullishLabel) {
  const callee = expr.callee;
  if (
    callee.type === "OptionalMemberExpression" ||
    callee.type === "MemberExpression"
  ) {
    const objectCompiler =
      callee.type === "OptionalMemberExpression"
        ? compileOptionalExpression
        : compileExpression;
    if (!objectCompiler(callee.object, compiler, state, nullishLabel)) {
      return false;
    }
    const objIdx = storeStackToTemp(compiler);
    if (callee.type === "OptionalMemberExpression" && callee.optional) {
      emitNullishCheck(objIdx, compiler, nullishLabel);
    }
    if (expr.optional) {
      compiler.emit(OPCODES.GET_VAR, objIdx);
      if (callee.computed) {
        if (!compileExpression(callee.property, compiler, state)) return false;
      } else {
        const idx = compiler.addConst(callee.property.name);
        compiler.emit(OPCODES.PUSH_CONST, idx);
      }
      compiler.emit(OPCODES.GET_PROP);
      const fnIdx = storeStackToTemp(compiler);
      emitNullishCheck(fnIdx, compiler, nullishLabel);
      compiler.emit(OPCODES.GET_VAR, objIdx);
      compiler.emit(OPCODES.GET_VAR, fnIdx);
      for (const arg of expr.arguments) {
        if (arg.type === "SpreadElement") return false;
        if (!compileExpression(arg, compiler, state)) return false;
      }
      compiler.emit(OPCODES.CALL_THIS, expr.arguments.length);
      return true;
    }
    compiler.emit(OPCODES.GET_VAR, objIdx);
    if (callee.computed) {
      if (!compileExpression(callee.property, compiler, state)) return false;
    } else {
      const idx = compiler.addConst(callee.property.name);
      compiler.emit(OPCODES.PUSH_CONST, idx);
    }
    for (const arg of expr.arguments) {
      if (arg.type === "SpreadElement") return false;
      if (!compileExpression(arg, compiler, state)) return false;
    }
    compiler.emit(OPCODES.CALL_METHOD, expr.arguments.length);
    return true;
  }

  if (!compileExpression(callee, compiler, state)) return false;
  const fnIdx = storeStackToTemp(compiler);
  if (expr.optional) {
    emitNullishCheck(fnIdx, compiler, nullishLabel);
  }
  compiler.emit(OPCODES.GET_VAR, fnIdx);
  for (const arg of expr.arguments) {
    if (arg.type === "SpreadElement") return false;
    if (!compileExpression(arg, compiler, state)) return false;
  }
  compiler.emit(OPCODES.CALL, expr.arguments.length);
  return true;
}

function compileOptionalExpression(expr, compiler, state, nullishLabel) {
  if (expr.type === "OptionalMemberExpression") {
    return compileOptionalMember(expr, compiler, state, nullishLabel);
  }
  if (expr.type === "OptionalCallExpression") {
    return compileOptionalCall(expr, compiler, state, nullishLabel);
  }
  if (expr.type === "ChainExpression") {
    return compileOptionalExpression(expr.expression, compiler, state, nullishLabel);
  }
  return compileExpression(expr, compiler, state);
}

function compileOptionalChain(expr, compiler, state) {
  const end = createLabel();
  const nullish = createLabel();
  if (!compileOptionalExpression(expr, compiler, state, nullish)) return false;
  compiler.emitJump(OPCODES.JMP, end);
  compiler.mark(nullish);
  compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(undefined));
  compiler.mark(end);
  return true;
}

function compileExpression(expr, compiler, state) {
  const { ctx, locals } = state;
  const { t } = ctx;

  switch (expr.type) {
    case "NumericLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
    case "NullLiteral": {
      const idx = compiler.addConst(literalValue(expr));
      compiler.emit(OPCODES.PUSH_CONST, idx);
      return true;
    }
    case "Identifier": {
      if (expr.name === "undefined") {
        const idx = compiler.addConst(undefined);
        compiler.emit(OPCODES.PUSH_CONST, idx);
        return true;
      }
      if (locals.has(expr.name)) {
        const idx = compiler.addConst(expr.name);
        compiler.emit(OPCODES.GET_VAR, idx);
        return true;
      }
      if (emitWithGet(expr.name, compiler, state)) {
        return true;
      }
      const idx = compiler.addConst(expr.name);
      compiler.emit(OPCODES.GET_GLOBAL, idx);
      return true;
    }
    case "MetaProperty": {
      const { meta, property } = expr;
      if (
        meta &&
        property &&
        meta.type === "Identifier" &&
        property.type === "Identifier" &&
        meta.name === "new" &&
        property.name === "target" &&
        state.newTargetKey
      ) {
        const idx = compiler.addConst(state.newTargetKey);
        compiler.emit(OPCODES.GET_VAR, idx);
        return true;
      }
      return false;
    }
    case "ThisExpression":
      compiler.emit(OPCODES.PUSH_THIS);
      return true;
    case "AwaitExpression": {
      if (!state.isAsync) {
        return false;
      }
      if (!compileExpression(expr.argument, compiler, state)) return false;
      compiler.emit(OPCODES.AWAIT);
      return true;
    }
    case "UnaryExpression": {
      if (expr.operator === "delete") {
        return false;
      }
      const opIndex = UNARY_OPS.indexOf(expr.operator);
      if (opIndex === -1) {
        return false;
      }
      if (!compileExpression(expr.argument, compiler, state)) {
        return false;
      }
      compiler.emit(OPCODES.UNARY_OP, opIndex);
      return true;
    }
    case "BinaryExpression": {
      const opIndex = BIN_OPS.indexOf(expr.operator);
      if (opIndex === -1) {
        return false;
      }
      if (!compileExpression(expr.left, compiler, state)) return false;
      if (!compileExpression(expr.right, compiler, state)) return false;
      compiler.emit(OPCODES.BIN_OP, opIndex);
      return true;
    }
    case "LogicalExpression": {
      if (expr.operator === "??") {
        const end = createLabel();
        const notNullish = createLabel();
        if (!compileExpression(expr.left, compiler, state)) return false;
        compiler.emit(OPCODES.DUP);
        compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(null));
        compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("=="));
        compiler.emitJump(OPCODES.JMP_IF_FALSE, notNullish);
        compiler.emit(OPCODES.POP);
        if (!compileExpression(expr.right, compiler, state)) return false;
        compiler.emitJump(OPCODES.JMP, end);
        compiler.mark(notNullish);
        compiler.mark(end);
        return true;
      }
      const end = createLabel();
      const shortLabel = createLabel();
      if (!compileExpression(expr.left, compiler, state)) return false;
      compiler.emit(OPCODES.DUP);
      if (expr.operator === "&&") {
        compiler.emitJump(OPCODES.JMP_IF_FALSE, shortLabel);
      } else if (expr.operator === "||") {
        compiler.emitJump(OPCODES.JMP_IF_TRUE, shortLabel);
      } else {
        return false;
      }
      compiler.emit(OPCODES.POP);
      if (!compileExpression(expr.right, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP, end);
      compiler.mark(shortLabel);
      compiler.emitJump(OPCODES.JMP, end);
      compiler.mark(end);
      return true;
    }
    case "ConditionalExpression": {
      const elseLabel = createLabel();
      const endLabel = createLabel();
      if (!compileExpression(expr.test, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP_IF_FALSE, elseLabel);
      if (!compileExpression(expr.consequent, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP, endLabel);
      compiler.mark(elseLabel);
      if (!compileExpression(expr.alternate, compiler, state)) return false;
      compiler.mark(endLabel);
      return true;
    }
    case "AssignmentExpression": {
      if (expr.left.type === "Identifier") {
        const name = expr.left.name;
        const nameIdx = compiler.addConst(name);
        if (locals.has(name)) {
          if (expr.operator === "=") {
            if (!compileExpression(expr.right, compiler, state)) return false;
            compiler.emit(OPCODES.SET_VAR, nameIdx);
            return true;
          }
          const op = expr.operator.slice(0, -1);
          const opIndex = BIN_OPS.indexOf(op);
          if (opIndex === -1) return false;
          compiler.emit(OPCODES.GET_VAR, nameIdx);
          if (!compileExpression(expr.right, compiler, state)) return false;
          compiler.emit(OPCODES.BIN_OP, opIndex);
          compiler.emit(OPCODES.SET_VAR, nameIdx);
          return true;
        }
        if (emitWithAssignment(expr, compiler, state)) {
          return true;
        }
        if (expr.operator === "=") {
          if (!compileExpression(expr.right, compiler, state)) return false;
          compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
          return true;
        }
        const op = expr.operator.slice(0, -1);
        const opIndex = BIN_OPS.indexOf(op);
        if (opIndex === -1) return false;
        compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
        if (!compileExpression(expr.right, compiler, state)) return false;
        compiler.emit(OPCODES.BIN_OP, opIndex);
        compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
        return true;
      }
      if (expr.left.type === "MemberExpression") {
        return emitMemberAssignment(expr, compiler, state);
      }
      return false;
    }
    case "UpdateExpression": {
      const isPrefix = expr.prefix;
      const delta = expr.operator === "++" ? 1 : -1;
      if (expr.argument.type === "Identifier") {
        const name = expr.argument.name;
        const nameIdx = compiler.addConst(name);
        if (locals.has(name)) {
          compiler.emit(OPCODES.GET_VAR, nameIdx);
          if (!isPrefix) compiler.emit(OPCODES.DUP);
          compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
          compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
          compiler.emit(OPCODES.SET_VAR, nameIdx);
          if (!isPrefix) compiler.emit(OPCODES.POP);
          return true;
        }
        if (emitWithUpdate(expr, compiler, state)) {
          return true;
        }
        compiler.emit(OPCODES.GET_GLOBAL, nameIdx);
        if (!isPrefix) compiler.emit(OPCODES.DUP);
        compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(delta));
        compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
        compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
        if (!isPrefix) compiler.emit(OPCODES.POP);
        return true;
      }
      if (expr.argument.type === "MemberExpression") {
        return emitMemberUpdate(expr, compiler, state);
      }
      return false;
    }
    case "OptionalMemberExpression":
    case "OptionalCallExpression":
      return compileOptionalChain(expr, compiler, state);
    case "ChainExpression":
      return compileOptionalChain(expr.expression, compiler, state);
    case "MemberExpression": {
      if (!compileExpression(expr.object, compiler, state)) return false;
      if (expr.computed) {
        if (!compileExpression(expr.property, compiler, state)) return false;
      } else {
        const idx = compiler.addConst(expr.property.name);
        compiler.emit(OPCODES.PUSH_CONST, idx);
      }
      compiler.emit(OPCODES.GET_PROP);
      return true;
    }
    case "CallExpression": {
      const callee = expr.callee;
      if (callee.type === "MemberExpression") {
        if (!compileExpression(callee.object, compiler, state)) return false;
        if (callee.computed) {
          if (!compileExpression(callee.property, compiler, state)) return false;
        } else {
          compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(callee.property.name));
        }
        for (const arg of expr.arguments) {
          if (arg.type === "SpreadElement") return false;
          if (!compileExpression(arg, compiler, state)) return false;
        }
        compiler.emit(OPCODES.CALL_METHOD, expr.arguments.length);
        return true;
      }
      if (!compileExpression(expr.callee, compiler, state)) return false;
      for (const arg of expr.arguments) {
        if (arg.type === "SpreadElement") return false;
        if (!compileExpression(arg, compiler, state)) return false;
      }
      compiler.emit(OPCODES.CALL, expr.arguments.length);
      return true;
    }
    case "NewExpression": {
      if (!compileExpression(expr.callee, compiler, state)) return false;
      for (const arg of expr.arguments) {
        if (arg.type === "SpreadElement") return false;
        if (!compileExpression(arg, compiler, state)) return false;
      }
      compiler.emit(OPCODES.NEW, expr.arguments.length);
      return true;
    }
    case "ObjectExpression": {
      for (const prop of expr.properties) {
        if (prop.type === "SpreadElement") {
          return false;
        }
      }
      const hasSuperMethod = expr.properties.some(
        (prop) => prop.type === "ObjectMethod" && containsSuper(prop)
      );
      if (hasSuperMethod) {
        const src = generate(expr).code;
        const idx = compiler.addConst(src);
        compiler.emit(OPCODES.MAKE_FUNC, idx);
        return true;
      }
      compiler.emit(OPCODES.MAKE_OBJ);
      for (const prop of expr.properties) {
        if (prop.type === "ObjectProperty") {
          compiler.emit(OPCODES.DUP);
          if (prop.computed) {
            if (!compileExpression(prop.key, compiler, state)) return false;
          } else if (prop.key.type === "Identifier") {
            const idx = compiler.addConst(prop.key.name);
            compiler.emit(OPCODES.PUSH_CONST, idx);
          } else if (prop.key.type === "StringLiteral" || prop.key.type === "NumericLiteral") {
            const idx = compiler.addConst(String(prop.key.value));
            compiler.emit(OPCODES.PUSH_CONST, idx);
          } else {
            return false;
          }
          if (!compileExpression(prop.value, compiler, state)) return false;
          compiler.emit(OPCODES.SET_PROP);
          compiler.emit(OPCODES.POP);
        } else if (prop.type === "ObjectMethod") {
          compiler.emit(OPCODES.DUP);
          if (prop.computed) {
            if (!compileExpression(prop.key, compiler, state)) return false;
          } else if (prop.key.type === "Identifier") {
            const idx = compiler.addConst(prop.key.name);
            compiler.emit(OPCODES.PUSH_CONST, idx);
          } else {
            return false;
          }
          const funcExpr = t.functionExpression(
            null,
            prop.params,
            prop.body,
            prop.generator,
            prop.async
          );
          const src = generate(funcExpr).code;
          const idx = compiler.addConst(src);
          compiler.emit(OPCODES.MAKE_FUNC, idx);
          compiler.emit(OPCODES.SET_PROP);
          compiler.emit(OPCODES.POP);
        }
      }
      return true;
    }
    case "ArrayExpression": {
      compiler.emit(OPCODES.MAKE_ARR);
      for (let i = 0; i < expr.elements.length; i += 1) {
        const elem = expr.elements[i];
        if (!elem) {
          continue;
        }
        if (elem.type === "SpreadElement") return false;
        compiler.emit(OPCODES.DUP);
        compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(i));
        if (!compileExpression(elem, compiler, state)) return false;
        compiler.emit(OPCODES.SET_PROP);
        compiler.emit(OPCODES.POP);
      }
      return true;
    }
    case "TemplateLiteral": {
      if (expr.expressions.length === 0) {
        const idx = compiler.addConst(expr.quasis[0].value.cooked || "");
        compiler.emit(OPCODES.PUSH_CONST, idx);
        return true;
      }
      let first = true;
      for (let i = 0; i < expr.quasis.length; i += 1) {
        const quasi = expr.quasis[i];
        const text = quasi.value.cooked || "";
        const idx = compiler.addConst(text);
        if (first) {
          compiler.emit(OPCODES.PUSH_CONST, idx);
          first = false;
        } else {
          compiler.emit(OPCODES.PUSH_CONST, idx);
          compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
        }
        if (i < expr.expressions.length) {
          if (!compileExpression(expr.expressions[i], compiler, state)) return false;
          compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("+"));
        }
      }
      return true;
    }
    case "FunctionExpression":
    case "ArrowFunctionExpression": {
      const src = generate(expr).code;
      const idx = compiler.addConst(src);
      compiler.emit(OPCODES.MAKE_FUNC, idx);
      return true;
    }
    case "ClassExpression": {
      const src = generate(expr).code;
      const idx = compiler.addConst(src);
      compiler.emit(OPCODES.MAKE_FUNC, idx);
      return true;
    }
    case "SequenceExpression": {
      for (let i = 0; i < expr.expressions.length; i += 1) {
        if (!compileExpression(expr.expressions[i], compiler, state)) return false;
        if (i < expr.expressions.length - 1) {
          compiler.emit(OPCODES.POP);
        }
      }
      return true;
    }
    default:
      if (isSimpleLiteral(expr)) {
        const idx = compiler.addConst(literalValue(expr));
        compiler.emit(OPCODES.PUSH_CONST, idx);
        return true;
      }
      return false;
  }
}

function compileStatement(stmt, compiler, state) {
  const { ctx } = state;
  const { t } = ctx;
  switch (stmt.type) {
    case "BlockStatement":
      for (const sub of stmt.body) {
        if (!compileStatement(sub, compiler, state)) return false;
      }
      return true;
    case "ExpressionStatement":
      if (!compileExpression(stmt.expression, compiler, state)) return false;
      compiler.emit(OPCODES.POP);
      return true;
    case "WithStatement": {
      const tempName = compiler.createTempName();
      const nameIdx = compiler.addConst(tempName);
      if (!compileExpression(stmt.object, compiler, state)) return false;
      compiler.emit(OPCODES.SET_VAR, nameIdx);
      compiler.emit(OPCODES.POP);
      const withStack = state.withStack ? [...state.withStack, tempName] : [tempName];
      const withState = {
        ...state,
        withStack,
      };
      if (!compileStatement(stmt.body, compiler, withState)) return false;
      return true;
    }
    case "VariableDeclaration":
      for (const decl of stmt.declarations) {
        if (decl.id.type !== "Identifier") return false;
        if (decl.init) {
          if (!compileExpression(decl.init, compiler, state)) return false;
        } else {
          compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(undefined));
        }
        const nameIdx = compiler.addConst(decl.id.name);
        if (state.locals.has(decl.id.name)) {
          compiler.emit(OPCODES.SET_VAR, nameIdx);
        } else {
          compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
        }
        compiler.emit(OPCODES.POP);
      }
      return true;
    case "ReturnStatement":
      if (stmt.argument) {
        if (!compileExpression(stmt.argument, compiler, state)) return false;
      } else {
        compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(undefined));
      }
      compiler.emit(OPCODES.RETURN);
      return true;
    case "IfStatement": {
      const elseLabel = createLabel();
      const endLabel = createLabel();
      if (!compileExpression(stmt.test, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP_IF_FALSE, elseLabel);
      if (!compileStatement(stmt.consequent, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP, endLabel);
      compiler.mark(elseLabel);
      if (stmt.alternate) {
        if (!compileStatement(stmt.alternate, compiler, state)) return false;
      }
      compiler.mark(endLabel);
      return true;
    }
    case "WhileStatement": {
      const start = createLabel();
      const end = createLabel();
      compiler.mark(start);
      if (!compileExpression(stmt.test, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP_IF_FALSE, end);
      const loopState = {
        ...state,
        breakLabel: end,
        continueLabel: start,
      };
      if (!compileStatement(stmt.body, compiler, loopState)) return false;
      compiler.emitJump(OPCODES.JMP, start);
      compiler.mark(end);
      return true;
    }
    case "DoWhileStatement": {
      const start = createLabel();
      const end = createLabel();
      compiler.mark(start);
      const loopState = {
        ...state,
        breakLabel: end,
        continueLabel: start,
      };
      if (!compileStatement(stmt.body, compiler, loopState)) return false;
      if (!compileExpression(stmt.test, compiler, state)) return false;
      compiler.emitJump(OPCODES.JMP_IF_TRUE, start);
      compiler.mark(end);
      return true;
    }
    case "ForStatement": {
      const start = createLabel();
      const end = createLabel();
      const updateLabel = createLabel();
      if (stmt.init) {
        if (stmt.init.type === "VariableDeclaration") {
          if (!compileStatement(stmt.init, compiler, state)) return false;
        } else if (!compileExpression(stmt.init, compiler, state)) {
          return false;
        } else {
          compiler.emit(OPCODES.POP);
        }
      }
      compiler.mark(start);
      if (stmt.test) {
        if (!compileExpression(stmt.test, compiler, state)) return false;
        compiler.emitJump(OPCODES.JMP_IF_FALSE, end);
      }
      const loopState = {
        ...state,
        breakLabel: end,
        continueLabel: updateLabel,
      };
      if (!compileStatement(stmt.body, compiler, loopState)) return false;
      compiler.mark(updateLabel);
      if (stmt.update) {
        if (!compileExpression(stmt.update, compiler, state)) return false;
        compiler.emit(OPCODES.POP);
      }
      compiler.emitJump(OPCODES.JMP, start);
      compiler.mark(end);
      return true;
    }
    case "BreakStatement":
      if (!state.breakLabel) return false;
      compiler.emitJump(OPCODES.JMP, state.breakLabel);
      return true;
    case "ContinueStatement":
      if (!state.continueLabel) return false;
      compiler.emitJump(OPCODES.JMP, state.continueLabel);
      return true;
    case "SwitchStatement": {
      const end = createLabel();
      if (!compileExpression(stmt.discriminant, compiler, state)) return false;
      const caseLabels = stmt.cases.map(() => createLabel());
      const entryLabels = stmt.cases.map(() => createLabel());
      let defaultIndex = -1;
      for (let i = 0; i < stmt.cases.length; i += 1) {
        const caseItem = stmt.cases[i];
        if (!caseItem.test) {
          defaultIndex = i;
          continue;
        }
        compiler.emit(OPCODES.DUP);
        if (!compileExpression(caseItem.test, compiler, state)) return false;
        compiler.emit(OPCODES.BIN_OP, BIN_OPS.indexOf("==="));
        compiler.emitJump(OPCODES.JMP_IF_TRUE, entryLabels[i]);
      }
      if (defaultIndex >= 0) {
        compiler.emitJump(OPCODES.JMP, entryLabels[defaultIndex]);
      } else {
        compiler.emit(OPCODES.POP);
        compiler.emitJump(OPCODES.JMP, end);
      }
      for (let i = 0; i < stmt.cases.length; i += 1) {
        compiler.mark(entryLabels[i]);
        compiler.emit(OPCODES.POP);
        compiler.emitJump(OPCODES.JMP, caseLabels[i]);
      }
      for (let i = 0; i < stmt.cases.length; i += 1) {
        compiler.mark(caseLabels[i]);
        const caseItem = stmt.cases[i];
        const loopState = {
          ...state,
          breakLabel: end,
        };
        for (const caseStmt of caseItem.consequent) {
          if (!compileStatement(caseStmt, compiler, loopState)) return false;
        }
      }
      compiler.mark(end);
      return true;
    }
    case "TryStatement": {
      const catchLabel = stmt.handler ? createLabel() : null;
      const finallyLabel = stmt.finalizer ? createLabel() : null;
      const endLabel = createLabel();
      compiler.emitTry(catchLabel, finallyLabel, endLabel);
      if (!compileStatement(stmt.block, compiler, state)) return false;
      if (catchLabel || finallyLabel) {
        compiler.emitJump(OPCODES.JMP, endLabel);
      }
      if (catchLabel) {
        compiler.mark(catchLabel);
        compiler.emit(OPCODES.ENTER_CATCH);
        if (stmt.handler.param && stmt.handler.param.type === "Identifier") {
          const nameIdx = compiler.addConst(stmt.handler.param.name);
          compiler.emit(OPCODES.SET_VAR, nameIdx);
          compiler.emit(OPCODES.POP);
        }
        if (!compileStatement(stmt.handler.body, compiler, state)) return false;
        compiler.emit(OPCODES.END_TRY);
        if (finallyLabel) {
          compiler.emitJump(OPCODES.JMP, endLabel);
        }
      }
      if (finallyLabel) {
        compiler.mark(finallyLabel);
        compiler.emit(OPCODES.ENTER_FINALLY);
        if (!compileStatement(stmt.finalizer, compiler, state)) return false;
        compiler.emit(OPCODES.END_TRY);
        compiler.emitJump(OPCODES.JMP, endLabel);
      }
      compiler.mark(endLabel);
      if (catchLabel && finallyLabel) {
        compiler.emit(OPCODES.RETHROW);
      } else if (catchLabel) {
        compiler.emit(OPCODES.RETHROW);
      } else if (finallyLabel) {
        compiler.emit(OPCODES.END_TRY);
      }
      return true;
    }
    case "ThrowStatement":
      if (!compileExpression(stmt.argument, compiler, state)) return false;
      compiler.emit(OPCODES.THROW);
      return true;
    case "EmptyStatement":
      return true;
    case "DebuggerStatement":
      return true;
    case "ClassDeclaration": {
      if (!stmt.id) return false;
      const classExpr = t.classExpression(
        stmt.id,
        stmt.superClass,
        stmt.body,
        stmt.decorators || []
      );
      const src = generate(classExpr).code;
      const idx = compiler.addConst(src);
      compiler.emit(OPCODES.MAKE_FUNC, idx);
      const nameIdx = compiler.addConst(stmt.id.name);
      if (state.locals.has(stmt.id.name)) {
        compiler.emit(OPCODES.SET_VAR, nameIdx);
      } else {
        compiler.emit(OPCODES.SET_GLOBAL, nameIdx);
      }
      compiler.emit(OPCODES.POP);
      return true;
    }
    case "FunctionDeclaration": {
      if (!stmt.id) return false;
      const funcExpr = t.functionExpression(
        stmt.id,
        stmt.params,
        stmt.body,
        stmt.generator,
        stmt.async
      );
      if (!compileExpression(funcExpr, compiler, state)) return false;
      const nameIdx = compiler.addConst(stmt.id.name);
      compiler.emit(OPCODES.SET_VAR, nameIdx);
      compiler.emit(OPCODES.POP);
      return true;
    }
    default:
      return false;
  }
}

module.exports = { compileStatement };
