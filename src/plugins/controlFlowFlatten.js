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

// GCD helper
function gcd(a, b) {
  let x = a;
  let y = b;
  while (y !== 0) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x;
}

// Generate all coprime candidates for a given modulus
function findCoprimes(modulus, rng) {
  const coprimes = [];
  // Start from 2 to avoid trivial multiplier 1
  for (let i = 2; i < modulus * 2 && coprimes.length < 50; i++) {
    if (gcd(modulus, i) === 1) {
      coprimes.push(i);
    }
  }
  // If we found candidates, pick a random one
  if (coprimes.length > 0) {
    return rng.pick(coprimes);
  }
  // Fallback to 1 if no coprime found
  return 1;
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

function buildFlattenedBody(t, ctx, statements) {
  const stateId = t.identifier(ctx.nameGen.next());
  const state2Id = t.identifier(ctx.nameGen.next());
  const lookupId = t.identifier(ctx.nameGen.next());
  const seedId = t.identifier(ctx.nameGen.next());
  const count = statements.length;
  const order = Array.from({ length: count }, (_, i) => i);
  ctx.rng.shuffle(order);
  const seed = ctx.rng.int(0, count - 1);
  const seed2 = ctx.rng.int(0, count - 1);

  // Dynamic multiplier generation
  const multiplier = findCoprimes(count, ctx.rng);
  const multiplier2 = findCoprimes(count, ctx.rng);

  // Use two multipliers/seeds for more complex encoding
  const encodeState = (index) => {
    const s1 = (index * multiplier + seed) % count;
    return (s1 * multiplier2 + seed2) % count;
  };

  const lookupValues = new Array(count);
  for (let i = 0; i < count; i += 1) {
    lookupValues[encodeState(i)] = i;
  }

  const buildStateExpr = (indexLiteral) => {
    // (((index * m1 + seed) % count) * m2 + seed2) % count
    const s1Expr = t.binaryExpression(
      "%",
      t.binaryExpression(
        "+",
        t.binaryExpression("*", indexLiteral, t.numericLiteral(multiplier)),
        seedId
      ),
      t.numericLiteral(count)
    );
    const s2Expr = t.binaryExpression(
      "%",
      t.binaryExpression(
        "+",
        t.binaryExpression("*", s1Expr, t.numericLiteral(multiplier2)),
        state2Id
      ),
      t.numericLiteral(count)
    );
    return s2Expr;
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
      const nextValue = index + 1 < count ? index + 1 : -1;
      caseBody.push(
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            stateId,
            nextValue === -1
              ? t.numericLiteral(-1)
              : buildStateExpr(t.numericLiteral(nextValue))
          )
        )
      );
    }
    caseBody.push(t.breakStatement());
    return t.switchCase(t.numericLiteral(index), [t.blockStatement(caseBody)]);
  });

  // Add fake/dead code cases
  const fakeCaseCount = ctx.rng.int(2, 5);
  for (let i = 0; i < fakeCaseCount; i++) {
    const fakeIndex = count + i;
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
      t.switchStatement(t.memberExpression(lookupId, stateId, true), cases),
    ])
  );

  return [
    t.variableDeclaration("const", [
      t.variableDeclarator(seedId, t.numericLiteral(seed)),
    ]),
    t.variableDeclaration("const", [
      t.variableDeclarator(state2Id, t.numericLiteral(seed2)),
    ]),
    t.variableDeclaration("const", [
      t.variableDeclarator(
        lookupId,
        t.arrayExpression(lookupValues.map((value) => t.numericLiteral(value)))
      ),
    ]),
    t.variableDeclaration("let", [
      t.variableDeclarator(stateId, buildStateExpr(t.numericLiteral(0))),
    ]),
    whileStmt,
  ];
}

function flattenFunctionBody(path, ctx) {
  const bodyPath = path.get("body");
  if (!bodyPath.isBlockStatement()) {
    return;
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
