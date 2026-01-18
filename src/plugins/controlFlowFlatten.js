function hasUnsupported(node) {
  let unsupported = false;
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    if (!current || unsupported) {
      continue;
    }
    switch (current.type) {
      case "TryStatement":
      case "WithStatement":
      case "LabeledStatement":
      case "YieldExpression":
      case "AwaitExpression":
        unsupported = true;
        break;
      default:
        break;
    }
    for (const key of Object.keys(current)) {
      const value = current[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === "string") {
            stack.push(child);
          }
        }
      } else if (value && typeof value.type === "string") {
        stack.push(value);
      }
    }
  }
  return unsupported;
}

function buildStateValues(count, rng) {
  const poolSize = Math.max(count * 3, count + 5);
  const pool = Array.from({ length: poolSize }, (_, i) => i);
  rng.shuffle(pool);
  const isLinearStep = (values) => {
    if (values.length < 3) {
      return true;
    }
    const step = values[1] - values[0];
    for (let i = 2; i < values.length; i += 1) {
      if (values[i] - values[i - 1] !== step) {
        return false;
      }
    }
    return true;
  };
  let values = pool.slice(0, count);
  for (let attempt = 0; attempt < 5 && isLinearStep(values); attempt += 1) {
    rng.shuffle(pool);
    values = pool.slice(0, count);
  }
  return values;
}

// Generate fake dead code that looks realistic
function buildFakeStatement(t, ctx) {
  const fakeVarId = t.identifier(ctx.nameGen.next());
  const fakeValueOptions = [
    () => t.numericLiteral(ctx.rng.int(0, 1000)),
    () => t.stringLiteral(ctx.nameGen.next()),
    () => t.booleanLiteral(ctx.rng.bool()),
    () => t.nullLiteral(),
  ];
  const fakeValue = ctx.rng.pick(fakeValueOptions)();
  return t.variableDeclaration("var", [
    t.variableDeclarator(fakeVarId, fakeValue),
  ]);
}

// Build opaque predicate that always evaluates to true
function buildOpaquePredicate(t, ctx) {
  // Mathematical identities that are always true
  const predicates = [
    // (x | 1) !== 0 is always true
    () => {
      const x = t.numericLiteral(ctx.rng.int(1, 100));
      return t.binaryExpression(
        "!==",
        t.binaryExpression("|", x, t.numericLiteral(1)),
        t.numericLiteral(0)
      );
    },
    // x * x >= 0 is always true
    () => {
      const x = t.numericLiteral(ctx.rng.int(-50, 50));
      return t.binaryExpression(
        ">=",
        t.binaryExpression("*", x, x),
        t.numericLiteral(0)
      );
    },
    // (x & 1) === 0 || (x & 1) === 1 is always true
    () => {
      const x = t.numericLiteral(ctx.rng.int(0, 1000));
      return t.logicalExpression(
        "||",
        t.binaryExpression(
          "===",
          t.binaryExpression("&", x, t.numericLiteral(1)),
          t.numericLiteral(0)
        ),
        t.binaryExpression(
          "===",
          t.binaryExpression("&", x, t.numericLiteral(1)),
          t.numericLiteral(1)
        )
      );
    },
  ];
  return ctx.rng.pick(predicates)();
}

function downlevelLetConst(path) {
  path.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    VariableDeclaration(innerPath) {
      if (innerPath.node.kind === "let" || innerPath.node.kind === "const") {
        innerPath.node.kind = "var";
      }
    },
  });
}

function buildFlattenedBody(t, ctx, statements) {
  const stateId = t.identifier(ctx.nameGen.next());
  const stateValuesId = t.identifier(ctx.nameGen.next());
  const nextId = t.identifier(ctx.nameGen.next());
  const indexId = t.identifier(ctx.nameGen.next());
  const count = statements.length;
  const order = Array.from({ length: count }, (_, i) => i);
  ctx.rng.shuffle(order);
  const stateValues = buildStateValues(count, ctx.rng);
  const usedStates = new Set(stateValues);
  const pickUnusedState = () => {
    let value = ctx.rng.int(count + 1, count * 6 + 30);
    while (usedStates.has(value) || value === -1) {
      value = ctx.rng.int(count + 1, count * 6 + 30);
    }
    usedStates.add(value);
    return value;
  };

  const cases = order.map((index) => {
    const stmt = statements[index];
    const caseBody = [];

    // Occasionally wrap real statement with opaque predicate
    if (ctx.rng.bool(0.15)) {
      const predicate = buildOpaquePredicate(t, ctx);
      caseBody.push(
        t.ifStatement(predicate, t.blockStatement([stmt]), null)
      );
    } else {
      caseBody.push(stmt);
    }

    if (stmt.type !== "ReturnStatement" && stmt.type !== "ThrowStatement") {
      caseBody.push(
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            stateId,
            t.memberExpression(nextId, stateId, true)
          )
        )
      );
    }
    caseBody.push(t.breakStatement());
    return t.switchCase(t.numericLiteral(stateValues[index]), [
      t.blockStatement(caseBody),
    ]);
  });

  // Add fake/dead code cases
  const fakeCaseCount = ctx.rng.int(2, 5);
  for (let i = 0; i < fakeCaseCount; i++) {
    const fakeIndex = pickUnusedState();
    const fakeBody = [
      buildFakeStatement(t, ctx),
      t.expressionStatement(
        t.assignmentExpression("=", stateId, t.numericLiteral(-1))
      ),
      t.breakStatement(),
    ];
    cases.push(t.switchCase(t.numericLiteral(fakeIndex), [t.blockStatement(fakeBody)]));
  }

  // Default case
  cases.push(
    t.switchCase(null, [
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression("=", stateId, t.numericLiteral(-1))
        ),
        t.breakStatement(),
      ]),
    ])
  );

  // Shuffle cases to further obfuscate
  ctx.rng.shuffle(cases);

  const whileStmt = t.whileStatement(
    t.binaryExpression("!==", stateId, t.numericLiteral(-1)),
    t.blockStatement([
      t.switchStatement(stateId, cases),
    ])
  );

  const maxState = Math.max(...stateValues);

  return [
    t.variableDeclaration("const", [
      t.variableDeclarator(
        stateValuesId,
        t.arrayExpression(stateValues.map((value) => t.numericLiteral(value)))
      ),
    ]),
    t.variableDeclaration("const", [
      t.variableDeclarator(
        nextId,
        t.newExpression(t.identifier("Array"), [
          t.numericLiteral(maxState + 1),
        ])
      ),
    ]),
    t.forStatement(
      t.variableDeclaration("let", [
        t.variableDeclarator(indexId, t.numericLiteral(0)),
      ]),
      t.binaryExpression(
        "<",
        indexId,
        t.memberExpression(stateValuesId, t.identifier("length"))
      ),
      t.updateExpression("++", indexId),
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.memberExpression(
              nextId,
              t.memberExpression(stateValuesId, indexId, true),
              true
            ),
            t.conditionalExpression(
              t.binaryExpression(
                "<",
                t.binaryExpression("+", indexId, t.numericLiteral(1)),
                t.memberExpression(stateValuesId, t.identifier("length"))
              ),
              t.memberExpression(
                stateValuesId,
                t.binaryExpression("+", indexId, t.numericLiteral(1)),
                true
              ),
              t.numericLiteral(-1)
            )
          )
        ),
      ])
    ),
    t.variableDeclaration("let", [
      t.variableDeclarator(
        stateId,
        t.memberExpression(stateValuesId, t.numericLiteral(0), true)
      ),
    ]),
    whileStmt,
  ];
}

function flattenFunctionBody(path, ctx) {
  const bodyPath = path.get("body");
  if (!bodyPath.isBlockStatement()) {
    return;
  }
  if (ctx.options.cffOptions && ctx.options.cffOptions.downlevel) {
    downlevelLetConst(bodyPath);
  }
  const statements = bodyPath.node.body;
  if (!statements || statements.length < ctx.options.cffOptions.minStatements) {
    return;
  }
  for (const stmt of statements) {
    if (stmt.type === "VariableDeclaration" && stmt.kind !== "var") {
      return;
    }
    if (stmt.type === "ClassDeclaration") {
      return;
    }
    if (stmt.type === "FunctionDeclaration") {
      return;
    }
  }
  if (hasUnsupported(bodyPath.node)) {
    return;
  }

  const directives = [];
  const rest = [];
  for (const stmt of statements) {
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      directives.push(stmt);
    } else {
      rest.push(stmt);
    }
  }

  if (rest.length < ctx.options.cffOptions.minStatements) {
    return;
  }

  const flattened = buildFlattenedBody(ctx.t, ctx, rest);
  bodyPath.node.body = [...directives, ...flattened];
}

function controlFlowFlatten(ast, ctx) {
  const { traverse } = ctx;
  traverse(ast, {
    Function(path) {
      if (path.node.generator) {
        return;
      }
      flattenFunctionBody(path, ctx);
    },
  });
}

module.exports = controlFlowFlatten;
