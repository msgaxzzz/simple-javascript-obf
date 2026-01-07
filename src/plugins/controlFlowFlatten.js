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

function buildFlattenedBody(t, ctx, statements) {
  const stateId = t.identifier(ctx.nameGen.next());
  const lookupId = t.identifier(ctx.nameGen.next());
  const seedId = t.identifier(ctx.nameGen.next());
  const count = statements.length;
  const order = Array.from({ length: count }, (_, i) => i);
  ctx.rng.shuffle(order);
  const seed = ctx.rng.int(0, count - 1);

  const gcd = (a, b) => {
    let x = a;
    let y = b;
    while (y !== 0) {
      const temp = x % y;
      x = y;
      y = temp;
    }
    return x;
  };
  const multiplierCandidates = [7, 5, 11, 13, 17, 19];
  let multiplier = 7;
  for (const candidate of multiplierCandidates) {
    if (gcd(count, candidate) === 1) {
      multiplier = candidate;
      break;
    }
  }
  if (gcd(count, multiplier) !== 1) {
    multiplier = 1;
  }

  const encodeState = (index) => (index * multiplier + seed) % count;
  const lookupValues = new Array(count);
  for (let i = 0; i < count; i += 1) {
    lookupValues[encodeState(i)] = i;
  }

  const buildStateExpr = (indexLiteral) =>
    t.binaryExpression(
      "%",
      t.binaryExpression(
        "+",
        t.binaryExpression("*", indexLiteral, t.numericLiteral(multiplier)),
        seedId
      ),
      t.numericLiteral(count)
    );

  const cases = order.map((index) => {
    const stmt = statements[index];
    const caseBody = [];
    caseBody.push(stmt);
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
    return t.switchCase(
      t.numericLiteral(index),
      [t.blockStatement(caseBody)]
    );
  });

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

  const whileStmt = t.whileStatement(
    t.binaryExpression("!==", stateId, t.numericLiteral(-1)),
    t.blockStatement([
      t.switchStatement(
        t.memberExpression(lookupId, stateId, true),
        cases
      ),
    ])
  );

  return [
    t.variableDeclaration("const", [
      t.variableDeclarator(seedId, t.numericLiteral(seed)),
    ]),
    t.variableDeclaration("const", [
      t.variableDeclarator(
        lookupId,
        t.arrayExpression(
          lookupValues.map((value) => t.numericLiteral(value))
        )
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
