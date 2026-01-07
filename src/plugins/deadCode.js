function makeOpaquePredicate(t) {
  const nowCall = t.callExpression(
    t.memberExpression(t.identifier("Date"), t.identifier("now")),
    []
  );
  return t.binaryExpression(
    "!==",
    t.binaryExpression("&", nowCall, t.numericLiteral(1)),
    t.numericLiteral(2)
  );
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

function insertIntoBody(body, node, index) {
  body.splice(index, 0, node);
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
      if (!rng.bool(probability)) {
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
      const idx = rng.int(directiveCount, body.length);
      const junkName = ctx.nameGen.next();
      const junk = t.ifStatement(
        makeOpaquePredicate(t),
        makeJunkStatement(t, junkName, rng)
      );
      insertIntoBody(body, junk, idx);
      if (rng.bool(probability * 0.5)) {
        insertIntoBody(body, makeNoiseStatement(t), idx);
      }
    },
  });
}

module.exports = deadCode;
