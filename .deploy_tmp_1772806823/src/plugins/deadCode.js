function buildRuntimeValue(t, ctx) {
  const nowExpr = t.callExpression(
    t.memberExpression(t.identifier("Date"), t.identifier("now")),
    []
  );
  const randomExpr = t.binaryExpression(
    "|",
    t.binaryExpression(
      "*",
      t.callExpression(
        t.memberExpression(t.identifier("Math"), t.identifier("random")),
        []
      ),
      t.numericLiteral(0x100000000)
    ),
    t.numericLiteral(0)
  );
  const candidates = [
    () => nowExpr,
    () => randomExpr,
    () => t.binaryExpression("^", nowExpr, randomExpr),
    () => t.binaryExpression("+", nowExpr, randomExpr),
  ];
  return t.binaryExpression(">>>", ctx.rng.pick(candidates)(), t.numericLiteral(0));
}

function buildOpaquePredicate(t, ctx) {
  const tempA = t.identifier(ctx.nameGen.next());
  const tempB = t.identifier(ctx.nameGen.next());
  const decls = [
    t.variableDeclaration("var", [
      t.variableDeclarator(tempA, buildRuntimeValue(t, ctx)),
    ]),
    t.variableDeclaration("var", [
      t.variableDeclarator(tempB, buildRuntimeValue(t, ctx)),
    ]),
  ];
  const mulA = ctx.rng.int(3, 0x7ffffffe) | 1;
  const addA = ctx.rng.int(0, 0x7fffffff);
  const targetA = ctx.rng.int(0, 0xffffffff);
  const mulB = ctx.rng.int(3, 0x7ffffffe) | 1;
  const addB = ctx.rng.int(0, 0x7fffffff);
  const targetB = ctx.rng.int(0, 0xffffffff);

  const checkA = t.binaryExpression(
    "===",
    t.binaryExpression(
      ">>>",
      t.binaryExpression(
        "+",
        t.callExpression(
          t.memberExpression(t.identifier("Math"), t.identifier("imul")),
          [tempA, t.numericLiteral(mulA)]
        ),
        t.numericLiteral(addA)
      ),
      t.numericLiteral(0)
    ),
    t.numericLiteral(targetA)
  );
  const checkB = t.binaryExpression(
    "===",
    t.binaryExpression(
      ">>>",
      t.binaryExpression(
        "+",
        t.callExpression(
          t.memberExpression(t.identifier("Math"), t.identifier("imul")),
          [tempB, t.numericLiteral(mulB)]
        ),
        t.numericLiteral(addB)
      ),
      t.numericLiteral(0)
    ),
    t.numericLiteral(targetB)
  );
  let test = t.logicalExpression("&&", checkA, checkB);

  if (ctx.rng.bool(0.5)) {
    const mixTarget = ctx.rng.int(0, 0xffffffff);
    const mixAdd = ctx.rng.int(1, 0x7fffffff);
    const mixCheck = t.binaryExpression(
      "===",
      t.binaryExpression(
        ">>>",
        t.binaryExpression(
          "+",
          t.binaryExpression("^", tempA, tempB),
          t.numericLiteral(mixAdd)
        ),
        t.numericLiteral(0)
      ),
      t.numericLiteral(mixTarget)
    );
    test = t.logicalExpression("&&", test, mixCheck);
  }

  return {
    prelude: decls,
    test,
  };
}

function makeNoiseStatement(t) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier("Date"), t.identifier("now")),
      []
    )
  );
}

function makeJunkStatement(t, name, rng) {
  const id = t.identifier(name);
  const seed = rng.int(1, 255);
  return t.blockStatement([
    t.variableDeclaration("let", [
      t.variableDeclarator(id, t.numericLiteral(seed)),
    ]),
    makeNoiseStatement(t),
    t.expressionStatement(
      t.assignmentExpression(
        "^=",
        id,
        t.numericLiteral(rng.int(1, 255))
      )
    ),
  ]);
}

function insertIntoBody(body, nodeOrNodes, index) {
  if (Array.isArray(nodeOrNodes)) {
    body.splice(index, 0, ...nodeOrNodes);
    return;
  }
  body.splice(index, 0, nodeOrNodes);
}

function deadCode(ast, ctx) {
  const { traverse, t, rng, options } = ctx;
  const probability = options.deadCodeOptions.probability;

  traverse(ast, {
    BlockStatement(path) {
      const body = path.node.body;
      if (!body || body.length === 0) {
        return;
      }
      if (path.parentPath && path.parentPath.isSwitchCase()) {
        return;
      }
      let directiveCount = 0;
      while (
        directiveCount < body.length &&
        body[directiveCount].type === "ExpressionStatement" &&
        body[directiveCount].directive
      ) {
        directiveCount += 1;
      }
      if (directiveCount > body.length) {
        return;
      }

      const slots = [];
      for (let i = directiveCount; i <= body.length; i += 1) {
        if (rng.bool(probability)) {
          slots.push(i);
        }
      }

      if (slots.length === 0) {
        if (!rng.bool(probability)) {
          return;
        }
        slots.push(rng.int(directiveCount, body.length));
      }

      ctx.rng.shuffle(slots);
      const maxInsertions = Math.min(3, slots.length);
      const insertions = rng.int(1, maxInsertions);
      const targets = slots.slice(0, insertions).sort((a, b) => a - b);
      let offset = 0;

      for (const target of targets) {
        const idx = target + offset;
        const junkName = ctx.nameGen.next();
        const predicate = buildOpaquePredicate(t, ctx);
        const junk = t.ifStatement(
          predicate.test,
          makeJunkStatement(t, junkName, rng)
        );
        const payload = [...predicate.prelude, junk];
        insertIntoBody(body, payload, idx);
        offset += payload.length;
        if (rng.bool(probability * 0.5)) {
          insertIntoBody(body, makeNoiseStatement(t), idx + payload.length);
          offset += 1;
        }
      }
    },
  });
}

module.exports = deadCode;
