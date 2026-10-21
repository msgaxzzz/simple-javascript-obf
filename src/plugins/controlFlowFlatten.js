function getBodyStatements(path) {
  if (!path || !path.node) {
    return null;
  }
  if (path.node.type === "Program" || path.node.type === "StaticBlock") {
    return path.node.body;
  }
  const body = path.node.body;
  if (body && body.type === "BlockStatement") {
    return body.body;
  }
  return null;
}

function setBodyStatements(path, statements) {
  if (!path || !path.node) {
    return;
  }
  if (path.node.type === "Program" || path.node.type === "StaticBlock") {
    path.node.body = statements;
    return;
  }
  const body = path.node.body;
  if (body && body.type === "BlockStatement") {
    body.body = statements;
  }
}

function downlevelTopLevelLetConst(path) {
  const statements = getBodyStatements(path);
  if (!statements) {
    return;
  }
  for (const stmt of statements) {
    if (
      stmt.type === "VariableDeclaration" &&
      (stmt.kind === "let" || stmt.kind === "const")
    ) {
      stmt.kind = "var";
    }
  }
}

function reserveScopeNames(scope, nameGen) {
  let current = scope;
  while (current) {
    for (const name of Object.keys(current.bindings || {})) {
      nameGen.reserve(name);
    }
    current = current.parent;
  }
  const program = scope && scope.getProgramParent ? scope.getProgramParent() : scope;
  if (program && program.globals) {
    for (const name of Object.keys(program.globals)) {
      nameGen.reserve(name);
    }
  }
}

function isDirectiveStatement(stmt) {
  return (
    stmt &&
    stmt.type === "ExpressionStatement" &&
    Boolean(stmt.directive)
  );
}

function isBarrierStatement(stmt) {
  if (!stmt) {
    return true;
  }
  if (stmt.__obfGenerated) {
    return true;
  }
  if (stmt.type === "LabeledStatement") {
    return isBarrierStatement(stmt.body);
  }
  switch (stmt.type) {
    case "ClassDeclaration":
    case "FunctionDeclaration":
    case "ImportDeclaration":
    case "ExportNamedDeclaration":
    case "ExportDefaultDeclaration":
    case "ExportAllDeclaration":
    case "TSInterfaceDeclaration":
    case "TSTypeAliasDeclaration":
    case "TSEnumDeclaration":
    case "TSModuleDeclaration":
    case "TSDeclareFunction":
    case "TSImportEqualsDeclaration":
    case "TSExportAssignment":
    case "TSNamespaceExportDeclaration":
      return true;
    case "VariableDeclaration":
      return stmt.kind !== "var";
    default:
      return false;
  }
}

function uniqueRandom32(rng, used) {
  let value;
  do {
    value = rng.int(0, 0xffffffff) >>> 0;
  } while (used.has(value));
  used.add(value);
  return value;
}

function buildStateHandles(count, rng) {
  const used = new Set();
  const handles = new Array(count);
  for (let i = 0; i < count; i += 1) {
    handles[i] = uniqueRandom32(rng, used);
  }
  return handles;
}

function buildSeedExpression(t) {
  const now = t.callExpression(
    t.memberExpression(t.identifier("Date"), t.identifier("now")),
    []
  );
  const random = t.binaryExpression(
    "*",
    t.callExpression(
      t.memberExpression(t.identifier("Math"), t.identifier("random")),
      []
    ),
    t.numericLiteral(0x100000000)
  );
  return t.binaryExpression(
    ">>>",
    t.binaryExpression(
      "^",
      now,
      t.binaryExpression("|", random, t.numericLiteral(0))
    ),
    t.numericLiteral(0)
  );
}

function buildOpaquePredicate(t, ctx, guardId) {
  const guard = t.identifier(guardId.name);
  if (ctx.rng.bool(0.5)) {
    const k1 = ctx.rng.int(1, 0x7fffffff);
    let k2 = ctx.rng.int(1, 0x7fffffff);
    while (k2 === k1) {
      k2 = ctx.rng.int(1, 0x7fffffff);
    }
    return t.binaryExpression(
      "!==",
      t.binaryExpression(
        ">>>",
        t.binaryExpression("^", guard, t.numericLiteral(k1)),
        t.numericLiteral(0)
      ),
      t.binaryExpression(
        ">>>",
        t.binaryExpression("^", guard, t.numericLiteral(k2)),
        t.numericLiteral(0)
      )
    );
  }
  const a = ctx.rng.int(1, 0x3fffffff);
  let b = ctx.rng.int(1, 0x3fffffff);
  while (b === a) {
    b = ctx.rng.int(1, 0x3fffffff);
  }
  return t.binaryExpression(
    "!==",
    t.binaryExpression(
      ">>>",
      t.binaryExpression("+", guard, t.numericLiteral(a)),
      t.numericLiteral(0)
    ),
    t.binaryExpression(
      ">>>",
      t.binaryExpression("+", guard, t.numericLiteral(b)),
      t.numericLiteral(0)
    )
  );
}

function buildFakeBody(t, ctx, guardId) {
  const fakeId = t.identifier(ctx.nameGen.next());
  const value = guardId
    ? t.binaryExpression(
        ">>>",
        t.binaryExpression(
          "^",
          t.identifier(guardId.name),
          t.numericLiteral(ctx.rng.int(1, 0xffffffff))
        ),
        t.numericLiteral(0)
      )
    : t.numericLiteral(ctx.rng.int(0, 0xffffffff));
  const declaration = t.variableDeclaration("var", [
    t.variableDeclarator(fakeId, value),
  ]);
  const update = t.expressionStatement(
    t.assignmentExpression(
      "^=",
      t.identifier(fakeId.name),
      t.numericLiteral(ctx.rng.int(1, 0xffffffff))
    )
  );
  declaration.__obfGenerated = true;
  update.__obfGenerated = true;
  return [declaration, update];
}

function buildFlattenedBody(t, ctx, statements) {
  const options = ctx.options.cffOptions || {};
  const count = statements.length;
  const fakeCount = ctx.rng.int(2, 6);
  const totalStates = count + fakeCount + 1;
  const endIndex = count + fakeCount;
  const handles = buildStateHandles(totalStates, ctx.rng);
  const dynamicDispatch = options.dynamicDispatch !== false && count >= 4;
  const dualState = options.dualState !== false;
  const needSeed = dynamicDispatch || options.opaque !== false;
  const seedId = needSeed ? t.identifier(ctx.nameGen.next()) : null;
  const keyId = dynamicDispatch ? seedId : null;
  const guardId = options.opaque !== false ? seedId : null;
  const useTable = dynamicDispatch;
  const requestedDispatcher = options.dispatcher;
  const dispatcher =
    requestedDispatcher === "switch" || requestedDispatcher === "ifchain"
      ? requestedDispatcher
      : ctx.rng.bool(0.5)
        ? "switch"
        : "ifchain";

  const stateId = dualState ? null : t.identifier(ctx.nameGen.next());
  const stateAId = dualState ? t.identifier(ctx.nameGen.next()) : null;
  const stateBId = dualState ? t.identifier(ctx.nameGen.next()) : null;
  const handlesId = useTable ? t.identifier(ctx.nameGen.next()) : null;
  const tableId = useTable ? t.identifier(ctx.nameGen.next()) : null;
  const indexId = useTable && dispatcher === "ifchain"
    ? t.identifier(ctx.nameGen.next())
    : null;
  const loopIndexId = useTable ? t.identifier(ctx.nameGen.next()) : null;
  const partsA = dualState
    ? handles.map(() => ctx.rng.int(0, 0xffffffff) >>> 0)
    : null;
  const partsB = dualState
    ? handles.map((handle, i) => (partsA[i] ^ handle) >>> 0)
    : null;

  function keyedHandle(index) {
    const value = handles[index];
    if (!keyId) {
      return t.numericLiteral(value);
    }
    return t.binaryExpression(
      ">>>",
      t.binaryExpression("^", t.numericLiteral(value), t.identifier(keyId.name)),
      t.numericLiteral(0)
    );
  }

  function keyedPartB(index) {
    const value = partsB[index];
    if (!keyId) {
      return t.numericLiteral(value);
    }
    return t.binaryExpression(
      ">>>",
      t.binaryExpression("^", t.numericLiteral(value), t.identifier(keyId.name)),
      t.numericLiteral(0)
    );
  }

  function stateRead() {
    if (dualState) {
      return t.binaryExpression(
        ">>>",
        t.binaryExpression(
          "^",
          t.identifier(stateAId.name),
          t.identifier(stateBId.name)
        ),
        t.numericLiteral(0)
      );
    }
    return t.identifier(stateId.name);
  }

  function stateAssign(index) {
    if (dualState) {
      return [
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.identifier(stateAId.name),
            t.numericLiteral(partsA[index])
          )
        ),
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.identifier(stateBId.name),
            keyedPartB(index)
          )
        ),
      ];
    }
    return [
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.identifier(stateId.name),
          keyedHandle(index)
        )
      ),
    ];
  }

  const prologue = [];
  if (needSeed) {
    prologue.push(
      t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(seedId.name), buildSeedExpression(t)),
      ])
    );
  }
  if (useTable) {
    prologue.push(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(handlesId.name),
          t.arrayExpression(handles.map((value) => t.numericLiteral(value)))
        ),
      ])
    );
    prologue.push(
      t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(tableId.name), t.objectExpression([])),
      ])
    );
    const tableKey = keyId
      ? t.binaryExpression(
          ">>>",
          t.binaryExpression(
            "^",
            t.memberExpression(
              t.identifier(handlesId.name),
              t.identifier(loopIndexId.name),
              true
            ),
            t.identifier(keyId.name)
          ),
          t.numericLiteral(0)
        )
      : t.memberExpression(
          t.identifier(handlesId.name),
          t.identifier(loopIndexId.name),
          true
        );
    prologue.push(
      t.forStatement(
        t.variableDeclaration("let", [
          t.variableDeclarator(t.identifier(loopIndexId.name), t.numericLiteral(0)),
        ]),
        t.binaryExpression(
          "<",
          t.identifier(loopIndexId.name),
          t.memberExpression(t.identifier(handlesId.name), t.identifier("length"))
        ),
        t.updateExpression("++", t.identifier(loopIndexId.name)),
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(t.identifier(tableId.name), tableKey, true),
              t.identifier(loopIndexId.name)
            )
          ),
        ])
      )
    );
  }
  if (dualState) {
    prologue.push(
      t.variableDeclaration("let", [
        t.variableDeclarator(
          t.identifier(stateAId.name),
          t.numericLiteral(partsA[0])
        ),
      ])
    );
    prologue.push(
      t.variableDeclaration("let", [
        t.variableDeclarator(t.identifier(stateBId.name), keyedPartB(0)),
      ])
    );
  } else {
    prologue.push(
      t.variableDeclaration("let", [
        t.variableDeclarator(t.identifier(stateId.name), keyedHandle(0)),
      ])
    );
  }

  const caseBodies = [];
  const caseValues = [];
  for (let index = 0; index < count; index += 1) {
    const stmt = statements[index];
    const body = [];
    if (guardId && ctx.rng.bool(0.25)) {
      const predicate = buildOpaquePredicate(t, ctx, guardId);
      body.push(
        t.ifStatement(
          predicate,
          t.blockStatement([stmt]),
          t.blockStatement(buildFakeBody(t, ctx, guardId))
        )
      );
    } else {
      body.push(stmt);
    }
    if (stmt.type !== "ReturnStatement" && stmt.type !== "ThrowStatement") {
      const nextIndex = index + 1 < count ? index + 1 : endIndex;
      body.push(...stateAssign(nextIndex));
    }
    if (dispatcher === "switch") {
      body.push(t.breakStatement());
    }
    caseBodies.push(body);
    caseValues.push(index);
  }

  for (let fake = 0; fake < fakeCount; fake += 1) {
    const fakeIndex = count + fake;
    const body = buildFakeBody(t, ctx, guardId);
    body.push(...stateAssign(endIndex));
    if (dispatcher === "switch") {
      body.push(t.breakStatement());
    }
    caseBodies.push(body);
    caseValues.push(fakeIndex);
  }

  const endRead = keyedHandle(endIndex);
  let loopStmt;
  if (dispatcher === "switch") {
    const cases = caseBodies.map((body, i) =>
      t.switchCase(
        useTable ? t.numericLiteral(caseValues[i]) : keyedHandle(caseValues[i]),
        [t.blockStatement(body)]
      )
    );
    cases.push(
      t.switchCase(null, [
        t.blockStatement([...stateAssign(endIndex), t.breakStatement()]),
      ])
    );
    ctx.rng.shuffle(cases);
    const discriminant = useTable
      ? t.memberExpression(t.identifier(tableId.name), stateRead(), true)
      : stateRead();
    const loopBody = t.blockStatement([
      t.switchStatement(discriminant, cases),
    ]);
    const test = t.binaryExpression("!==", stateRead(), endRead);
    loopStmt = ctx.rng.bool(0.5)
      ? t.whileStatement(test, loopBody)
      : t.forStatement(null, test, null, loopBody);
  } else {
    let alternate = t.blockStatement([t.breakStatement()]);
    for (let i = caseBodies.length - 1; i >= 0; i -= 1) {
      const test = useTable
        ? t.binaryExpression(
            "===",
            t.identifier(indexId.name),
            t.numericLiteral(caseValues[i])
          )
        : t.binaryExpression(
            "===",
            stateRead(),
            keyedHandle(caseValues[i])
          );
      alternate = t.ifStatement(
        test,
        t.blockStatement([...caseBodies[i], t.continueStatement()]),
        alternate
      );
    }
    const loopBody = [];
    loopBody.push(
      t.ifStatement(
        t.binaryExpression("===", stateRead(), endRead),
        t.blockStatement([t.breakStatement()])
      )
    );
    if (useTable) {
      loopBody.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier(indexId.name),
            t.memberExpression(t.identifier(tableId.name), stateRead(), true)
          ),
        ])
      );
    }
    loopBody.push(alternate);
    loopStmt = t.forStatement(null, null, null, t.blockStatement(loopBody));
  }

  const generated = [...prologue, loopStmt];
  for (const node of generated) {
    if (node && typeof node === "object") {
      node.__obfGenerated = true;
    }
  }
  return generated;
}

function flattenBody(path, ctx) {
  const options = ctx.options.cffOptions || {};
  const minStatements = options.minStatements || 3;
  if (options.downlevel) {
    downlevelTopLevelLetConst(path);
  }
  const statements = getBodyStatements(path);
  if (!statements || statements.length < minStatements) {
    return;
  }

  const directives = [];
  const hoistedFunctions = [];
  const rest = [];
  for (const stmt of statements) {
    if (isDirectiveStatement(stmt)) {
      directives.push(stmt);
    } else if (stmt.type === "FunctionDeclaration") {
      // Function declarations are hoisted anyway, so keeping them outside the
      // state machine preserves semantics and lets the rest of the body flatten.
      hoistedFunctions.push(stmt);
    } else {
      rest.push(stmt);
    }
  }

  const segments = [];
  let run = [];
  for (const stmt of rest) {
    if (isBarrierStatement(stmt)) {
      if (run.length) {
        segments.push({ flatten: true, statements: run });
        run = [];
      }
      segments.push({ flatten: false, statements: [stmt] });
    } else {
      run.push(stmt);
    }
  }
  if (run.length) {
    segments.push({ flatten: true, statements: run });
  }

  const hasFlattenable = segments.some(
    (segment) =>
      segment.flatten && segment.statements.length >= minStatements
  );
  if (!hasFlattenable) {
    return;
  }

  const newBody = [...directives, ...hoistedFunctions];
  for (const segment of segments) {
    if (segment.flatten && segment.statements.length >= minStatements) {
      newBody.push(
        ...buildFlattenedBody(ctx.t, ctx, segment.statements)
      );
    } else {
      newBody.push(...segment.statements);
    }
  }
  setBodyStatements(path, newBody);
}

function controlFlowFlatten(ast, ctx) {
  const { traverse, options, nameGen } = ctx;
  const flattenProgram = !options.cffOptions || options.cffOptions.program !== false;
  traverse(ast, {
    Program(path) {
      if (!flattenProgram) {
        return;
      }
      reserveScopeNames(path.scope, nameGen);
      flattenBody(path, ctx);
    },
    Function(path) {
      if (path.node.__obfGenerated) {
        return;
      }
      reserveScopeNames(path.scope, nameGen);
      flattenBody(path, ctx);
    },
    StaticBlock(path) {
      if (path.node.__obfGenerated) {
        return;
      }
      reserveScopeNames(path.scope, nameGen);
      flattenBody(path, ctx);
    },
  });
}

module.exports = controlFlowFlatten;
