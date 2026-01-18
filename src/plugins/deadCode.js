function buildRuntimeValue(t, ctx) {
  const sources = [
    () =>
      t.callExpression(
        t.memberExpression(t.identifier("Date"), t.identifier("now")),
        []
      ),
    () =>
      t.callExpression(
        t.memberExpression(t.identifier("Math"), t.identifier("random")),
        []
      ),
  ];
  const base = ctx.rng.pick(sources)();
  // Force numeric coercion to reduce weird cases; keep it runtime-dependent.
  return ctx.rng.bool(0.6)
    ? t.binaryExpression("|", base, t.numericLiteral(0))
    : base;
}

function buildOpaquePredicate(t, ctx) {
  const tempA = t.identifier(ctx.nameGen.next());
  const tempB = t.identifier(ctx.nameGen.next());
  const decls = [
    t.variableDeclaration("var", [
      t.variableDeclarator(tempA, buildRuntimeValue(t, ctx)),
    ]),
  ];

  const patterns = [
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "===",
          t.binaryExpression("^", a, t.numericLiteral(1)),
          a
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "===",
          t.binaryExpression("+", a, t.numericLiteral(1)),
          a
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.logicalExpression(
          "&&",
          t.binaryExpression("<", a, t.numericLiteral(0)),
          t.binaryExpression(">", a, t.numericLiteral(0))
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "===",
          t.binaryExpression("|", a, t.numericLiteral(1)),
          t.numericLiteral(0)
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "===",
          t.binaryExpression("^", a, t.binaryExpression("+", a, t.numericLiteral(1))),
          t.numericLiteral(0)
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "<",
          t.binaryExpression(">>>", a, t.numericLiteral(0)),
          t.numericLiteral(0)
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.binaryExpression(
          "===",
          t.binaryExpression("&", a, t.numericLiteral(3)),
          t.numericLiteral(4)
        ),
    },
    {
      needsB: false,
      build: (a) =>
        t.logicalExpression(
          "&&",
          t.binaryExpression("===", a, a),
          t.binaryExpression("!==", a, a)
        ),
    },
    {
      needsB: true,
      build: (a, b) =>
        t.logicalExpression(
          "&&",
          t.binaryExpression("<", a, b),
          t.binaryExpression(">", a, b)
        ),
    },
    {
      needsB: true,
      build: (a, b) =>
        t.logicalExpression(
          "&&",
          t.binaryExpression("===", a, b),
          t.binaryExpression("!==", a, b)
        ),
    },
  ];

  const shuffled = patterns.slice();
  ctx.rng.shuffle(shuffled);
  const count = ctx.rng.int(2, Math.min(4, shuffled.length));
  const selected = shuffled.slice(0, count);

  if (selected.some((item) => item.needsB)) {
    decls.push(
      t.variableDeclaration("var", [
        t.variableDeclarator(tempB, buildRuntimeValue(t, ctx)),
      ])
    );
  }

  let test = selected[0].build(tempA, tempB);
  for (let i = 1; i < selected.length; i += 1) {
    const op = ctx.rng.bool() ? "&&" : "||";
    test = t.logicalExpression(op, test, selected[i].build(tempA, tempB));
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
