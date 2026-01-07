const { OPCODES } = require("./constants");
const { buildOpcodeMapping } = require("./mapping");
const {
  encodeBytecode,
  encodeConstPool,
  encodeOpcodeTable,
} = require("./encoding");
const { buildVmRuntime } = require("./runtime");
const { VmCompiler } = require("./compiler");
const { makeLiteral } = require("./ast-utils");
const {
  canVirtualize,
  collectLocals,
  normalizeFunction,
  rewriteClosureRefs,
} = require("./normalize");
const { compileStatement } = require("./emit");

function createMiniVmInfo(rng) {
  const pool = Array.from({ length: 256 }, (_, i) => i);
  rng.shuffle(pool);
  const mask = rng.int(1, 255);
  const ops = pool.slice(0, 4).map((value) => value ^ mask);
  return { mask, ops };
}

function buildMiniVmProgram(ops, blocks) {
  const [opPush, opRebuild, opToStr, opStore] = ops;
  const program = [];
  for (const block of blocks) {
    for (const idx of block.pool) {
      program.push(opPush, idx);
    }
    program.push(opRebuild);
    if (block.toString === true) {
      program.push(opToStr);
    }
    program.push(opStore, block.store);
  }
  return program;
}

function shouldVirtualize(fnPath, options) {
  if (options.all) {
    return true;
  }
  const name = fnPath.node.id ? fnPath.node.id.name : null;
  if (name && options.include && options.include.includes(name)) {
    return true;
  }
  const comments = fnPath.node.leadingComments || [];
  return comments.some((c) => c.value.includes("@vm"));
}

function applyVmToFunction(fnPath, ctx, runtimeIds) {
  if (!canVirtualize(fnPath, ctx)) {
    return false;
  }
  if (!normalizeFunction(fnPath, ctx)) {
    return false;
  }

  const envId = ctx.t.identifier(ctx.nameGen.next());
  const envThisKey = `__vm_this_${ctx.rng.int(1, 1e9)}`;
  const envArgsKey = `__vm_args_${ctx.rng.int(1, 1e9)}`;
  const envNewTargetKey = `__vm_new_target_${ctx.rng.int(1, 1e9)}`;

  rewriteClosureRefs(fnPath, ctx, envId, envThisKey, envArgsKey);

  const locals = collectLocals(fnPath);
  const opcodeMapping = buildOpcodeMapping(ctx);
  const compiler = new VmCompiler(ctx, locals, opcodeMapping);
  const state = {
    ctx,
    locals,
    breakLabel: null,
    continueLabel: null,
    isAsync: fnPath.node.async,
    newTargetKey: envNewTargetKey,
    withStack: [],
  };

  for (const stmt of fnPath.node.body.body) {
    if (!compileStatement(stmt, compiler, state)) {
      return false;
    }
  }

  compiler.emit(OPCODES.PUSH_CONST, compiler.addConst(undefined));
  compiler.emit(OPCODES.RETURN);

  const codeId = ctx.t.identifier(ctx.nameGen.next());
  const constId = ctx.t.identifier(ctx.nameGen.next());
  const useBytecodeEncrypt = ctx.options.vm.bytecodeEncrypt !== false;
  const useConstEncrypt = ctx.options.vm.constsEncrypt !== false;
  const makeNumArray = (values) =>
    ctx.t.arrayExpression(values.map((value) => ctx.t.numericLiteral(value)));
  const makeStrArray = (values) =>
    ctx.t.arrayExpression(values.map((value) => ctx.t.stringLiteral(value)));
  const makePool = (values) =>
    ctx.t.arrayExpression(
      values.map((value) =>
        Array.isArray(value)
          ? makeNumArray(value)
          : ctx.t.numericLiteral(value)
      )
    );
  let codeInit = ctx.t.arrayExpression(
    compiler.code.map((n) => ctx.t.numericLiteral(n))
  );
  if (useBytecodeEncrypt && runtimeIds.bytecodeDecodeName) {
    const meta = encodeBytecode(compiler.code, ctx.rng);
    const partsExpr = makeStrArray(meta.parts);
    const orderExpr = makeNumArray(meta.order);
    const poolExpr = makePool([
      meta.alphabetMasked,
      meta.alphabetMask,
      meta.alphabetOrder,
      meta.alphabetOrderMask,
      meta.paramMasked,
      meta.paramMask,
      meta.paramOrder,
      meta.paramOrderMask,
      meta.keyMasked,
      meta.keyMask,
      meta.keyOrder,
      meta.keyOrderMask,
    ]);
    codeInit = ctx.t.callExpression(
      ctx.t.identifier(runtimeIds.bytecodeDecodeName),
      [partsExpr, orderExpr, poolExpr]
    );
  }
  let constInit = ctx.t.arrayExpression(
    compiler.consts.map((value) => makeLiteral(ctx.t, value))
  );
  if (useConstEncrypt && runtimeIds.constDecodeName) {
    const meta = encodeConstPool(compiler.consts, ctx.rng);
    const payloadExpr = makeStrArray(meta.parts);
    const orderExpr = makeNumArray(meta.order);
    const poolExpr = makePool([
      meta.alphabetMasked,
      meta.alphabetMask,
      meta.alphabetOrder,
      meta.alphabetOrderMask,
      meta.paramMasked,
      meta.paramMask,
      meta.paramOrder,
      meta.paramOrderMask,
      meta.keyMasked,
      meta.keyMask,
      meta.keyOrder,
      meta.keyOrderMask,
      meta.maskMasked,
      meta.maskMask,
      meta.maskOrder,
      meta.maskOrderMask,
    ]);
    constInit = ctx.t.callExpression(
      ctx.t.identifier(runtimeIds.constDecodeName),
      [payloadExpr, orderExpr, poolExpr]
    );
  }

  const envProperties = [];
  for (const name of locals) {
    const key = ctx.t.isValidIdentifier(name)
      ? ctx.t.identifier(name)
      : ctx.t.stringLiteral(name);
    const value = fnPath.node.params.some(
      (p) => p.type === "Identifier" && p.name === name
    )
      ? ctx.t.identifier(name)
      : ctx.t.identifier("undefined");
    envProperties.push(ctx.t.objectProperty(key, value));
  }
  envProperties.push(
    ctx.t.objectProperty(
      ctx.t.stringLiteral(envThisKey),
      ctx.t.thisExpression()
    )
  );
  envProperties.push(
    ctx.t.objectProperty(
      ctx.t.stringLiteral(envArgsKey),
      ctx.t.identifier("arguments")
    )
  );
  envProperties.push(
    ctx.t.objectProperty(
      ctx.t.stringLiteral(envNewTargetKey),
      ctx.t.metaProperty(ctx.t.identifier("new"), ctx.t.identifier("target"))
    )
  );

  const execId = fnPath.node.async
    ? runtimeIds.execAsyncName
    : runtimeIds.execName;

  const newBody = ctx.t.blockStatement([
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(codeId, codeInit),
    ]),
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(constId, constInit),
    ]),
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(envId, ctx.t.objectExpression(envProperties)),
    ]),
    ctx.t.returnStatement(
      ctx.t.callExpression(ctx.t.identifier(execId), [
        codeId,
        constId,
        envId,
        ctx.t.thisExpression(),
      ])
    ),
  ]);

  fnPath.get("body").replaceWith(newBody);
  return true;
}

function ensureRuntime(programPath, ctx) {
  if (ctx.state.vmRuntime) {
    return ctx.state.vmRuntime;
  }
  const execName = ctx.nameGen.next();
  const execAsyncName = ctx.nameGen.next();
  const opsName = ctx.nameGen.next();
  const opsLookupName = ctx.nameGen.next();
  const globalsName = ctx.nameGen.next();
  const makeFuncName = ctx.nameGen.next();
  const maskName = ctx.nameGen.next();
  const opcodeB64Name = ctx.nameGen.next();
  const miniVmName = ctx.nameGen.next();
  const bytecodeEnabled = ctx.options.vm.bytecodeEncrypt !== false;
  const bytecodeDecodeName = bytecodeEnabled ? ctx.nameGen.next() : null;
  const bytecodeCacheName = bytecodeEnabled ? ctx.nameGen.next() : null;
  const bytecodeB64Name = bytecodeEnabled ? ctx.nameGen.next() : null;
  const bytecodeRc4Name = bytecodeEnabled ? ctx.nameGen.next() : null;
  const constsEnabled = ctx.options.vm.constsEncrypt !== false;
  const constDecodeName = constsEnabled ? ctx.nameGen.next() : null;
  const constCacheName = constsEnabled ? ctx.nameGen.next() : null;
  const constB64Name = constsEnabled ? ctx.nameGen.next() : null;
  const constRc4Name = constsEnabled ? ctx.nameGen.next() : null;
  const constUtf8Name = constsEnabled ? ctx.nameGen.next() : null;
  const opcodeMapping = buildOpcodeMapping(ctx);
  const opcodeInfo = encodeOpcodeTable(opcodeMapping.decode, ctx.rng);
  const miniVmInfo = createMiniVmInfo(ctx.rng);
  const miniVmPrograms = {
    opcode: buildMiniVmProgram(miniVmInfo.ops, [
      { pool: [0, 1, 2, 3], toString: true, store: 0 },
      { pool: [4, 5, 6, 7], store: 1 },
      { pool: [8, 9, 10, 11], store: 2 },
      { pool: [12, 13, 14, 15], store: 3 },
      { pool: [16, 17, 18, 19], store: 4 },
    ]),
    bytecode: buildMiniVmProgram(miniVmInfo.ops, [
      { pool: [0, 1, 2, 3], toString: true, store: 0 },
      { pool: [4, 5, 6, 7], store: 1 },
      { pool: [8, 9, 10, 11], store: 2 },
    ]),
    consts: buildMiniVmProgram(miniVmInfo.ops, [
      { pool: [0, 1, 2, 3], toString: true, store: 0 },
      { pool: [4, 5, 6, 7], store: 1 },
      { pool: [8, 9, 10, 11], store: 2 },
      { pool: [12, 13, 14, 15], store: 3 },
    ]),
  };
  const runtime = buildVmRuntime(
    {
      execName,
      execAsyncName,
      opsName,
      opsLookupName,
      globalsName,
      makeFuncName,
      maskName,
      opcodeB64Name,
      miniVmName,
      bytecodeDecodeName,
      bytecodeCacheName,
      bytecodeB64Name,
      bytecodeRc4Name,
      constDecodeName,
      constCacheName,
      constB64Name,
      constRc4Name,
      constUtf8Name,
    },
    opcodeInfo,
    opcodeMapping.mask,
    miniVmInfo,
    miniVmPrograms
  );
  const body = programPath.node.body;
  let index = 0;
  while (index < body.length) {
    const stmt = body[index];
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      index += 1;
      continue;
    }
    break;
  }
  body.splice(index, 0, ...runtime);
  ctx.state.vmRuntime = {
    execName,
    execAsyncName,
    opsName,
    opsLookupName,
    globalsName,
    makeFuncName,
    maskName,
    opcodeB64Name,
    miniVmName,
    bytecodeDecodeName,
    bytecodeCacheName,
    bytecodeB64Name,
    bytecodeRc4Name,
    constDecodeName,
    constCacheName,
    constB64Name,
    constRc4Name,
    constUtf8Name,
  };
  ctx.state.vmRuntimeMeta = {
    programPath,
    index,
    size: runtime.length,
  };
  return ctx.state.vmRuntime;
}

function vmPlugin(ast, ctx) {
  const { traverse, options } = ctx;
  let applied = false;
  traverse(ast, {
    Program(path) {
      let runtimeIds = null;
      path.traverse({
        Function(fnPath) {
          if (!shouldVirtualize(fnPath, options.vm)) {
            return;
          }
          if (!runtimeIds) {
            runtimeIds = ensureRuntime(path, ctx);
          }
          const didApply = applyVmToFunction(fnPath, ctx, runtimeIds);
          if (didApply) {
            applied = true;
          }
        },
      });
      if (!applied && ctx.state.vmRuntimeMeta) {
        const { programPath, index, size } = ctx.state.vmRuntimeMeta;
        programPath.node.body.splice(index, size);
        ctx.state.vmRuntime = null;
        ctx.state.vmRuntimeMeta = null;
      }
    },
  });
}

module.exports = vmPlugin;
