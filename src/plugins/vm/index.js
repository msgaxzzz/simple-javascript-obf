const { OPCODES } = require("./constants");
const { buildOpcodeMapping } = require("./mapping");
const {
  base85EncodeBytes,
  encodeBytecode,
  encodeConstPool,
  encodeOpcodeTable,
} = require("./encoding");
const parser = require("@babel/parser");
const { buildVmRuntimeSource } = require("./runtime");
const { VmCompiler } = require("./compiler");
const { makeLiteral } = require("./ast-utils");
const {
  canVirtualize,
  collectCapturedBindings,
  collectLocals,
  normalizeFunction,
  rewriteClosureRefs,
} = require("./normalize");
const { compileStatement } = require("./emit");
const { insertAtTop } = require("../../utils/ast");

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

function encodeRuntimeSource(source, rng) {
  const bytes = Buffer.from(source, "utf8");
  const keyLen = rng.int(6, 14);
  const key = Array.from({ length: keyLen }, () => rng.int(1, 255));
  const xored = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    xored[i] = bytes[i] ^ key[i % key.length];
  }
  const base85 = base85EncodeBytes(xored, rng);
  return {
    payload: base85.encoded,
    alphabet: base85.alphabet,
    base85Key: base85.key,
    base85Step: base85.step,
    base85Order: base85.order,
    length: base85.length,
    key,
    total: bytes.length,
  };
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

function getSuperInfo(fnPath) {
  if (fnPath.isClassMethod && fnPath.isClassMethod()) {
    return {
      mode: fnPath.node.static ? "static" : "instance",
      kind: fnPath.node.kind || "method",
    };
  }
  if (fnPath.isClassPrivateMethod && fnPath.isClassPrivateMethod()) {
    return {
      mode: fnPath.node.static ? "static" : "instance",
      kind: fnPath.node.kind || "method",
    };
  }
  if (fnPath.isObjectMethod && fnPath.isObjectMethod()) {
    return {
      mode: "object",
      kind: "method",
    };
  }
  return null;
}

function createRuntimeBundle(ctx) {
  if (ctx.state.vmRuntimeBundle) {
    return ctx.state.vmRuntimeBundle;
  }
  const execName = ctx.nameGen.next();
  const execAsyncName = ctx.nameGen.next();
  const opsName = ctx.nameGen.next();
  const opsLookupName = ctx.nameGen.next();
  const globalsName = ctx.nameGen.next();
  const makeFuncName = ctx.nameGen.next();
  const maskName = ctx.nameGen.next();
  const opcodeB64Name = ctx.nameGen.next();
  const opcodeStreamName = ctx.nameGen.next();
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

  const runtimeSource = buildVmRuntimeSource(
    {
      execName,
      execAsyncName,
      opsName,
      opsLookupName,
      globalsName,
      makeFuncName,
      maskName,
      opcodeB64Name,
      opcodeStreamName,
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

  const exportProps = {
    exec: ctx.nameGen.next(),
    execAsync: ctx.nameGen.next(),
    cache: ctx.nameGen.next(),
  };
  if (bytecodeEnabled) {
    exportProps.bytecodeDecode = ctx.nameGen.next();
  }
  if (constsEnabled) {
    exportProps.constDecode = ctx.nameGen.next();
  }

  const exports = [
    `"${exportProps.exec}": ${execName}`,
    `"${exportProps.execAsync}": ${execAsyncName}`,
    `"${exportProps.cache}": {}`,
  ];
  if (bytecodeEnabled) {
    exports.push(`"${exportProps.bytecodeDecode}": ${bytecodeDecodeName}`);
  }
  if (constsEnabled) {
    exports.push(`"${exportProps.constDecode}": ${constDecodeName}`);
  }

  const wrappedSource = `${runtimeSource}\nreturn { ${exports.join(", ")} };`;
  const cacheKey = `__vm_rt_${ctx.rng.int(1, 1e9)}`;
  const bundle = {
    runtimeSource: wrappedSource,
    cacheKey,
    props: exportProps,
  };
  ctx.state.vmRuntimeBundle = bundle;
  return bundle;
}

function buildInlineRuntime(ctx, runtimeSource, cacheKey, runtimeIdName) {
  const runtimeId = runtimeIdName || ctx.nameGen.next();
  const payloadId = ctx.nameGen.next();
  const alphabetId = ctx.nameGen.next();
  const b85KeyId = ctx.nameGen.next();
  const b85StepId = ctx.nameGen.next();
  const b85OrderId = ctx.nameGen.next();
  const mapId = ctx.nameGen.next();
  const groupsId = ctx.nameGen.next();
  const decodedId = ctx.nameGen.next();
  const groupId = ctx.nameGen.next();
  const digitsId = ctx.nameGen.next();
  const posId = ctx.nameGen.next();
  const codeId = ctx.nameGen.next();
  const digitId = ctx.nameGen.next();
  const valueId = ctx.nameGen.next();
  const keyId = ctx.nameGen.next();
  const totalId = ctx.nameGen.next();
  const bytesId = ctx.nameGen.next();
  const iId = ctx.nameGen.next();
  const offsetId = ctx.nameGen.next();
  const srcId = ctx.nameGen.next();
  const tmpId = ctx.nameGen.next();
  const kId = ctx.nameGen.next();
  const factoryId = ctx.nameGen.next();
  const globalId = ctx.nameGen.next();
  const cachedId = ctx.nameGen.next();
  const cacheKeyId = ctx.nameGen.next();
  const objId = ctx.nameGen.next();

  const encoded = encodeRuntimeSource(runtimeSource, ctx.rng);
  const code = `
const ${runtimeId} = (() => {
  const ${globalId} = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : this;
  const ${cacheKeyId} = ${JSON.stringify(cacheKey)};
  const ${cachedId} = ${globalId}[${cacheKeyId}];
  if (${cachedId}) {
    return ${cachedId};
  }
  const ${payloadId} = ${JSON.stringify(encoded.payload)};
  const ${alphabetId} = ${JSON.stringify(encoded.alphabet)};
  const ${b85KeyId} = ${encoded.base85Key};
  const ${b85StepId} = ${encoded.base85Step};
  const ${b85OrderId} = ${JSON.stringify(encoded.base85Order)};
  const ${keyId} = ${JSON.stringify(encoded.key)};
  const ${totalId} = ${encoded.total};
  const ${mapId} = new Int16Array(128);
  ${mapId}.fill(-1);
  for (let ${iId} = 0; ${iId} < ${alphabetId}.length; ${iId}++) {
    ${mapId}[${alphabetId}.charCodeAt(${iId}) & 127] = ${iId};
  }
  const ${groupsId} = Math.ceil(${payloadId}.length / 5);
  const ${decodedId} = new Uint8Array(${groupsId} * 4);
  let ${offsetId} = 0;
  for (let ${groupId} = 0; ${groupId} < ${groupsId}; ${groupId}++) {
    const ${digitsId} = [0, 0, 0, 0, 0];
    for (let ${posId} = 0; ${posId} < 5; ${posId}++) {
      const ${codeId} = ${payloadId}.charCodeAt(${groupId} * 5 + ${posId}) & 127;
      const ${digitId} = ${mapId}[${codeId}];
      ${digitsId}[${b85OrderId}[${posId}]] = ${digitId} < 0 ? 0 : ${digitId};
    }
    let ${valueId} =
      ${digitsId}[0] +
      ${digitsId}[1] * 85 +
      ${digitsId}[2] * 7225 +
      ${digitsId}[3] * 614125 +
      ${digitsId}[4] * 52200625;
    ${valueId} = (${valueId} ^ ((${b85KeyId} + Math.imul(${groupId}, ${b85StepId})) >>> 0)) >>> 0;
    ${decodedId}[${offsetId}++] = (${valueId} >>> 24) & 255;
    ${decodedId}[${offsetId}++] = (${valueId} >>> 16) & 255;
    ${decodedId}[${offsetId}++] = (${valueId} >>> 8) & 255;
    ${decodedId}[${offsetId}++] = ${valueId} & 255;
  }
  const ${bytesId} = new Uint8Array(${totalId});
  for (let ${iId} = 0; ${iId} < ${totalId}; ${iId}++) {
    ${bytesId}[${iId}] =
      ${decodedId}[${iId}] ^ ${keyId}[${iId} % ${keyId}.length];
  }
  let ${srcId} = "";
  if (typeof TextDecoder !== "undefined") {
    ${srcId} = new TextDecoder().decode(${bytesId});
  } else if (typeof Buffer !== "undefined") {
    ${srcId} = Buffer.from(${bytesId}).toString("utf8");
  } else {
    let ${tmpId} = "";
    for (let ${kId} = 0; ${kId} < ${bytesId}.length; ${kId}++) {
      ${tmpId} += String.fromCharCode(${bytesId}[${kId}]);
    }
    try {
      ${srcId} = decodeURIComponent(escape(${tmpId}));
    } catch (err) {
      ${srcId} = ${tmpId};
    }
  }
  const ${factoryId} = Function(${srcId});
  const ${objId} = ${factoryId}();
  try {
    Object.defineProperty(${globalId}, ${cacheKeyId}, {
      value: ${objId},
      configurable: true,
    });
  } catch (err) {
    ${globalId}[${cacheKeyId}] = ${objId};
  }
  return ${objId};
})();
`;
  const nodes = parser.parse(code, { sourceType: "script" }).program.body;
  for (const node of nodes) {
    node.__obfGenerated = true;
    node.__obfSkipStringEncode = true;
  }
  return {
    runtimeId: ctx.t.identifier(runtimeId),
    prelude: nodes,
  };
}

function ensureInlineRuntime(ctx, programPath) {
  if (ctx.state.vmInlineRuntime) {
    return ctx.state.vmInlineRuntime;
  }
  const bundle = createRuntimeBundle(ctx);
  let runtimeName = ctx.nameGen.next();
  while (
    programPath.scope.hasBinding(runtimeName) ||
    programPath.scope.hasGlobal(runtimeName)
  ) {
    runtimeName = ctx.nameGen.next();
  }
  const runtime = buildInlineRuntime(
    ctx,
    bundle.runtimeSource,
    bundle.cacheKey,
    runtimeName
  );
  const info = {
    runtimeId: runtime.runtimeId,
    props: bundle.props,
    prelude: runtime.prelude,
  };
  ctx.state.vmInlineRuntime = info;
  return info;
}

function applyVmToFunction(fnPath, ctx, programPath) {
  if (!canVirtualize(fnPath, ctx)) {
    return false;
  }
  const isArrow = fnPath.isArrowFunctionExpression();
  let usesRootArguments = false;
  let usesAnyArguments = false;
  let usesNewTarget = false;
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    Identifier(path) {
      if (
        path.node.name === "arguments" &&
        path.isReferencedIdentifier()
      ) {
        usesRootArguments = true;
      }
    },
    MetaProperty(path) {
      const { meta, property } = path.node;
      if (
        meta &&
        property &&
        meta.type === "Identifier" &&
        property.type === "Identifier" &&
        meta.name === "new" &&
        property.name === "target"
      ) {
        usesNewTarget = true;
      }
    },
  });
  fnPath.traverse({
    Identifier(path) {
      if (
        path.node.name === "arguments" &&
        path.isReferencedIdentifier()
      ) {
        usesAnyArguments = true;
      }
    },
  });
  if (usesRootArguments) {
    // The VM does not map a virtualized function's own `arguments` object.
    return false;
  }
  const preLocals = collectLocals(fnPath);
  const capturedBindings = collectCapturedBindings(fnPath, preLocals);
  if (!capturedBindings) {
    return false;
  }
  if (!normalizeFunction(fnPath, ctx)) {
    return false;
  }

  const envId = ctx.t.identifier(ctx.nameGen.next());
  const envThisKey = `__vm_this_${ctx.rng.int(1, 1e9)}`;
  const envArgsKey = `__vm_args_${ctx.rng.int(1, 1e9)}`;
  const envNewTargetKey = `__vm_new_target_${ctx.rng.int(1, 1e9)}`;

  rewriteClosureRefs(fnPath, ctx, envThisKey, envArgsKey);

  const locals = collectLocals(fnPath);
  for (const name of capturedBindings) {
    locals.add(name);
  }
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
    superInfo: getSuperInfo(fnPath),
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
  const runtimeInfo = ensureInlineRuntime(ctx, programPath);
  const execCallee = fnPath.node.async
    ? ctx.t.memberExpression(
        runtimeInfo.runtimeId,
        ctx.t.stringLiteral(runtimeInfo.props.execAsync),
        true
      )
    : ctx.t.memberExpression(
        runtimeInfo.runtimeId,
        ctx.t.stringLiteral(runtimeInfo.props.exec),
        true
      );
  const bytecodeDecode = runtimeInfo.props.bytecodeDecode
    ? ctx.t.memberExpression(
        runtimeInfo.runtimeId,
        ctx.t.stringLiteral(runtimeInfo.props.bytecodeDecode),
        true
      )
    : null;
  const constDecode = runtimeInfo.props.constDecode
    ? ctx.t.memberExpression(
        runtimeInfo.runtimeId,
        ctx.t.stringLiteral(runtimeInfo.props.constDecode),
        true
      )
    : null;
  let codeInit = ctx.t.arrayExpression(
    compiler.code.map((n) => ctx.t.numericLiteral(n))
  );
  if (useBytecodeEncrypt && bytecodeDecode) {
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
    codeInit = ctx.t.callExpression(bytecodeDecode, [
      partsExpr,
      orderExpr,
      poolExpr,
      ctx.t.stringLiteral(meta.base85Alphabet),
      ctx.t.numericLiteral(meta.base85Key),
      ctx.t.numericLiteral(meta.base85Step),
      makeNumArray(meta.base85Order),
      ctx.t.numericLiteral(meta.base85Length),
    ]);
  }
  let constInit = ctx.t.arrayExpression(
    compiler.consts.map((value) => makeLiteral(ctx.t, value))
  );
  if (useConstEncrypt && constDecode) {
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
    constInit = ctx.t.callExpression(constDecode, [payloadExpr, orderExpr, poolExpr]);
  }

  const envProperties = [];
  for (const name of locals) {
    const key = ctx.t.isValidIdentifier(name)
      ? ctx.t.identifier(name)
      : ctx.t.stringLiteral(name);
    const value = fnPath.node.params.some(
      (p) => p.type === "Identifier" && p.name === name
    ) || capturedBindings.has(name)
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
  if (!isArrow || usesAnyArguments) {
    envProperties.push(
      ctx.t.objectProperty(
        ctx.t.stringLiteral(envArgsKey),
        ctx.t.identifier("arguments")
      )
    );
  }
  if (!isArrow || usesNewTarget) {
    envProperties.push(
      ctx.t.objectProperty(
        ctx.t.stringLiteral(envNewTargetKey),
        ctx.t.metaProperty(ctx.t.identifier("new"), ctx.t.identifier("target"))
      )
    );
  }

  const cacheKeyBase = ctx.nameGen.next();
  const makeCacheRead = (suffix, init) => {
    const key = cacheKeyBase + suffix;
    const cacheObject = () =>
      ctx.t.memberExpression(
        ctx.t.identifier(runtimeInfo.runtimeId.name),
        ctx.t.stringLiteral(runtimeInfo.props.cache),
        true
      );
    const read = ctx.t.memberExpression(
      cacheObject(),
      ctx.t.stringLiteral(key),
      true
    );
    const writeTarget = ctx.t.memberExpression(
      cacheObject(),
      ctx.t.stringLiteral(key),
      true
    );
    return ctx.t.logicalExpression(
      "||",
      read,
      ctx.t.assignmentExpression("=", writeTarget, init)
    );
  };
  const codeInitCached = makeCacheRead("_c", codeInit);
  const constInitCached = makeCacheRead("_k", constInit);

  const newBody = ctx.t.blockStatement([
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(codeId, codeInitCached),
    ]),
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(constId, constInitCached),
    ]),
    ctx.t.variableDeclaration("const", [
      ctx.t.variableDeclarator(envId, ctx.t.objectExpression(envProperties)),
    ]),
    ctx.t.returnStatement(
      ctx.t.callExpression(execCallee, [
        codeId,
        constId,
        envId,
        ctx.t.thisExpression(),
      ])
    ),
  ]);

  newBody.__obfGenerated = true;
  fnPath.get("body").replaceWith(newBody);
  return true;
}

function vmPlugin(ast, ctx) {
  const { traverse, options } = ctx;
  let programPath = null;
  let applied = false;
  traverse(ast, {
    Program(path) {
      programPath = path;
      path.traverse({
        Function(fnPath) {
          if (!shouldVirtualize(fnPath, options.vm)) {
            return;
          }
          if (applyVmToFunction(fnPath, ctx, path)) {
            applied = true;
          }
        },
      });
      path.skip();
    },
  });
  if (applied && programPath && ctx.state.vmInlineRuntime) {
    insertAtTop(programPath, ctx.state.vmInlineRuntime.prelude);
  }
}

module.exports = vmPlugin;
