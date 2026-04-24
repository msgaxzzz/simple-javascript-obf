function hasUnsupported(fnPath) {
  let unsupported = false;
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    MetaProperty(path) {
      const { meta, property } = path.node;
      if (
        !meta ||
        !property ||
        meta.type !== "Identifier" ||
        property.type !== "Identifier" ||
        meta.name !== "new" ||
        property.name !== "target"
      ) {
        unsupported = true;
        path.stop();
      }
    },
    Super(path) {
      if (
        !path.findParent(
          (parent) =>
            parent.isClassDeclaration() ||
            parent.isClassExpression() ||
            parent.isObjectMethod()
        )
      ) {
        unsupported = true;
        path.stop();
      }
    },
    Import(path) {
      unsupported = true;
      path.stop();
    },
    ExportNamedDeclaration(path) {
      unsupported = true;
      path.stop();
    },
    ExportDefaultDeclaration(path) {
      unsupported = true;
      path.stop();
    },
  });
  return unsupported;
}

function expandPattern(pattern, valueExpr, ctx, declarators) {
  const { t } = ctx;
  if (pattern.type === "Identifier") {
    declarators.push(t.variableDeclarator(pattern, valueExpr));
    return true;
  }
  if (pattern.type === "AssignmentPattern") {
    const temp = t.identifier(ctx.nameGen.next());
    declarators.push(t.variableDeclarator(temp, valueExpr));
    const resolved = t.conditionalExpression(
      t.binaryExpression("===", temp, t.identifier("undefined")),
      pattern.right,
      temp
    );
    return expandPattern(pattern.left, resolved, ctx, declarators);
  }
  if (pattern.type === "ArrayPattern") {
    const temp = t.identifier(ctx.nameGen.next());
    declarators.push(t.variableDeclarator(temp, valueExpr));
    for (let i = 0; i < pattern.elements.length; i += 1) {
      const elem = pattern.elements[i];
      if (!elem) {
        continue;
      }
      if (elem.type === "RestElement") {
        if (elem.argument.type !== "Identifier") {
          return false;
        }
        const sliceCall = t.callExpression(
          t.memberExpression(
            t.memberExpression(
              t.memberExpression(t.identifier("Array"), t.identifier("prototype")),
              t.identifier("slice")
            ),
            t.identifier("call")
          ),
          [temp, t.numericLiteral(i)]
        );
        declarators.push(t.variableDeclarator(elem.argument, sliceCall));
        continue;
      }
      const access = t.memberExpression(temp, t.numericLiteral(i), true);
      if (!expandPattern(elem, access, ctx, declarators)) {
        return false;
      }
    }
    return true;
  }
  if (pattern.type === "ObjectPattern") {
    const temp = t.identifier(ctx.nameGen.next());
    declarators.push(t.variableDeclarator(temp, valueExpr));
    const excludedKeys = [];
    let restElement = null;
    for (const prop of pattern.properties) {
      if (prop.type === "RestElement") {
        if (restElement) {
          return false;
        }
        restElement = prop;
        continue;
      }
      if (prop.computed) {
        return false;
      }
      const key = prop.key;
      let access = null;
      if (key.type === "Identifier") {
        access = t.memberExpression(temp, t.identifier(key.name));
        excludedKeys.push(key.name);
      } else if (key.type === "StringLiteral" || key.type === "NumericLiteral") {
        access = t.memberExpression(temp, t.stringLiteral(String(key.value)), true);
        excludedKeys.push(String(key.value));
      } else {
        return false;
      }
      if (!expandPattern(prop.value, access, ctx, declarators)) {
        return false;
      }
    }
    if (restElement) {
      if (restElement.argument.type !== "Identifier") {
        return false;
      }
      const restExpr = buildObjectRestExpression(ctx, temp, excludedKeys);
      declarators.push(
        t.variableDeclarator(restElement.argument, restExpr)
      );
    }
    return true;
  }
  return false;
}

function buildObjectRestExpression(ctx, sourceId, excludedKeys) {
  const { t } = ctx;
  const srcId = t.identifier("source");
  const excludedId = t.identifier("excluded");
  const targetId = t.identifier("target");
  const keysId = t.identifier("keys");
  const iId = t.identifier("i");
  const keyId = t.identifier("key");

  const targetDecl = t.variableDeclaration("var", [
    t.variableDeclarator(targetId, t.objectExpression([])),
  ]);
  const keysDecl = t.variableDeclaration("var", [
    t.variableDeclarator(
      keysId,
      t.callExpression(
        t.memberExpression(t.identifier("Object"), t.identifier("keys")),
        [srcId]
      )
    ),
  ]);
  const init = t.variableDeclaration("var", [
    t.variableDeclarator(iId, t.numericLiteral(0)),
  ]);
  const test = t.binaryExpression(
    "<",
    iId,
    t.memberExpression(keysId, t.identifier("length"))
  );
  const update = t.updateExpression("++", iId);
  const keyDecl = t.variableDeclaration("var", [
    t.variableDeclarator(keyId, t.memberExpression(keysId, iId, true)),
  ]);
  const skipIfExcluded = t.ifStatement(
    t.binaryExpression(
      ">=",
      t.callExpression(
        t.memberExpression(excludedId, t.identifier("indexOf")),
        [keyId]
      ),
      t.numericLiteral(0)
    ),
    t.continueStatement()
  );
  const assign = t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.memberExpression(targetId, keyId, true),
      t.memberExpression(srcId, keyId, true)
    )
  );
  const loop = t.forStatement(
    init,
    test,
    update,
    t.blockStatement([keyDecl, skipIfExcluded, assign])
  );
  const funcExpr = t.functionExpression(
    null,
    [srcId, excludedId],
    t.blockStatement([targetDecl, keysDecl, loop, t.returnStatement(targetId)])
  );
  const excludedExpr = t.arrayExpression(
    excludedKeys.map((key) => t.stringLiteral(key))
  );
  return t.callExpression(funcExpr, [sourceId, excludedExpr]);
}

function rewriteParams(fnPath, ctx) {
  const { t } = ctx;
  const prologue = [];
  const newParams = [];
  const params = fnPath.node.params;

  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];
    if (param.type === "Identifier") {
      newParams.push(param);
      continue;
    }
    if (param.type === "AssignmentPattern") {
      if (param.left.type === "Identifier") {
        newParams.push(param.left);
        prologue.push(
          t.ifStatement(
            t.binaryExpression(
              "===",
              param.left,
              t.identifier("undefined")
            ),
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression("=", param.left, param.right)
              ),
            ])
          )
        );
      } else {
        const temp = t.identifier(ctx.nameGen.next());
        newParams.push(temp);
        prologue.push(
          t.ifStatement(
            t.binaryExpression("===", temp, t.identifier("undefined")),
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression("=", temp, param.right)
              ),
            ])
          )
        );
        const decls = [];
        if (!expandPattern(param.left, temp, ctx, decls)) {
          return null;
        }
        if (decls.length) {
          prologue.push(t.variableDeclaration("var", decls));
        }
      }
      continue;
    }
    if (param.type === "RestElement") {
      if (param.argument.type !== "Identifier") {
        return null;
      }
      const restId = param.argument;
      const sliceCall = t.callExpression(
        t.memberExpression(
          t.memberExpression(
            t.memberExpression(t.identifier("Array"), t.identifier("prototype")),
            t.identifier("slice")
          ),
          t.identifier("call")
        ),
        [t.identifier("arguments"), t.numericLiteral(i)]
      );
      prologue.push(
        t.variableDeclaration("var", [
          t.variableDeclarator(restId, sliceCall),
        ])
      );
      break;
    }
    if (param.type === "ObjectPattern" || param.type === "ArrayPattern") {
      const temp = t.identifier(ctx.nameGen.next());
      newParams.push(temp);
      const decls = [];
      if (!expandPattern(param, temp, ctx, decls)) {
        return null;
      }
      if (decls.length) {
        prologue.push(t.variableDeclaration("var", decls));
      }
      continue;
    }
    return null;
  }

  fnPath.node.params = newParams;
  return prologue;
}

function createTempIdentifier(path, ctx, used) {
  const { nameGen, t } = ctx;
  let name = nameGen.next();
  while (path.scope.hasBinding(name) || (used && used.has(name))) {
    name = nameGen.next();
  }
  if (used) {
    used.add(name);
  }
  return t.identifier(name);
}

function rewriteForOf(fnPath, ctx) {
  const { t } = ctx;
  let ok = true;
  const usedNames = new Set();
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    ForOfStatement(path) {
      if (!ok) return;
      if (path.node.await) {
        ok = false;
        path.stop();
        return;
      }
      const left = path.node.left;
      const right = t.cloneNode(path.node.right, true);
      const body = path.node.body;

      const iterId = createTempIdentifier(path, ctx, usedNames);
      const stepId = createTempIdentifier(path, ctx, usedNames);

      const iteratorKey = t.memberExpression(
        t.identifier("Symbol"),
        t.identifier("iterator")
      );
      const iteratorCall = t.callExpression(
        t.memberExpression(right, iteratorKey, true),
        []
      );
      const init = t.variableDeclaration("var", [
        t.variableDeclarator(iterId, iteratorCall),
        t.variableDeclarator(stepId, null),
      ]);

      const stepAssign = t.assignmentExpression(
        "=",
        stepId,
        t.callExpression(t.memberExpression(iterId, t.identifier("next")), [])
      );
      const test = t.unaryExpression(
        "!",
        t.memberExpression(stepAssign, t.identifier("done"))
      );

      const valueExpr = t.memberExpression(stepId, t.identifier("value"));
      const prologue = [];

      if (left.type === "VariableDeclaration") {
        if (left.declarations.length !== 1) {
          ok = false;
          path.stop();
          return;
        }
        const decl = left.declarations[0];
        prologue.push(
          t.variableDeclaration("var", [
            t.variableDeclarator(t.cloneNode(decl.id, true), valueExpr),
          ])
        );
      } else if (left.type === "Identifier" || left.type === "MemberExpression") {
        prologue.push(
          t.expressionStatement(
            t.assignmentExpression("=", t.cloneNode(left, true), valueExpr)
          )
        );
      } else if (
        left.type === "ObjectPattern" ||
        left.type === "ArrayPattern" ||
        left.type === "AssignmentPattern"
      ) {
        prologue.push(
          t.variableDeclaration("var", [
            t.variableDeclarator(t.cloneNode(left, true), valueExpr),
          ])
        );
      } else {
        ok = false;
        path.stop();
        return;
      }

      let loopBody;
      if (body.type === "BlockStatement") {
        loopBody = t.blockStatement([...prologue, ...body.body]);
      } else {
        loopBody = t.blockStatement([...prologue, body]);
      }

      const forStmt = t.forStatement(init, test, null, loopBody);
      path.replaceWith(forStmt);
    },
  });
  return ok;
}

function rewriteBlockScoped(fnPath, ctx) {
  const { nameGen } = ctx;
  fnPath.traverse({
    VariableDeclaration(path) {
      if (path.node.kind === "var") {
        return;
      }
      const names = [];
      for (const decl of path.node.declarations) {
        if (decl.id.type === "Identifier") {
          names.push(decl.id.name);
        }
      }
      for (const name of names) {
        const binding = path.scope.getBinding(name);
        if (!binding) {
          continue;
        }
        let newName = nameGen.next();
        while (path.scope.hasBinding(newName)) {
          newName = nameGen.next();
        }
        binding.scope.rename(name, newName);
      }
      path.node.kind = "var";
    },
    ClassDeclaration(path) {
      if (!path.node.id) {
        return;
      }
      const name = path.node.id.name;
      const binding = path.scope.getBinding(name);
      if (!binding) {
        return;
      }
      let newName = nameGen.next();
      while (path.scope.hasBinding(newName)) {
        newName = nameGen.next();
      }
      binding.scope.rename(name, newName);
    },
    ForStatement(path) {
      if (path.node.init && path.node.init.type === "VariableDeclaration") {
        path.node.init.kind = "var";
      }
    },
    CatchClause(path) {
      if (path.node.param && path.node.param.type === "Identifier") {
        const name = path.node.param.name;
        if (fnPath.scope.hasBinding(name)) {
          let newName = nameGen.next();
          while (fnPath.scope.hasBinding(newName)) {
            newName = nameGen.next();
          }
          path.scope.rename(name, newName);
        }
      }
    },
  });
}

function rewriteDestructuringDecls(fnPath, ctx) {
  const { t } = ctx;
  let ok = true;
  fnPath.traverse({
    VariableDeclaration(path) {
      if (!ok) return;
      const newDeclarators = [];
      for (const decl of path.node.declarations) {
        if (decl.id.type === "Identifier") {
          newDeclarators.push(decl);
          continue;
        }
        const init = decl.init || t.identifier("undefined");
        const decls = [];
        if (!expandPattern(decl.id, init, ctx, decls)) {
          ok = false;
          return;
        }
        newDeclarators.push(...decls);
      }
      if (!ok) return;
      path.node.declarations = newDeclarators;
      path.node.kind = "var";
    },
  });
  return ok;
}

function rewriteDestructuringAssignments(fnPath, ctx) {
  let ok = true;
  fnPath.traverse({
    ExpressionStatement(path) {
      const expr = path.node.expression;
      if (!expr || expr.type !== "AssignmentExpression") {
        return;
      }
      if (expr.left.type !== "ObjectPattern" && expr.left.type !== "ArrayPattern") {
        return;
      }
      ok = false;
    },
  });
  return ok;
}

function hoistFunctionDeclarations(fnPath, ctx) {
  const { t } = ctx;
  const body = fnPath.node.body;
  if (!body || body.type !== "BlockStatement") {
    return [];
  }
  const prologue = [];
  const rest = [];
  for (const stmt of body.body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id) {
      const funcExpr = t.functionExpression(
        stmt.id,
        stmt.params,
        stmt.body,
        stmt.generator,
        stmt.async
      );
      prologue.push(
        t.variableDeclaration("var", [
          t.variableDeclarator(stmt.id, funcExpr),
        ])
      );
    } else {
      rest.push(stmt);
    }
  }
  body.body = rest;
  return prologue;
}

function rewriteClosureRefs(fnPath, ctx, envId, envThisKey, envArgsKey) {
  const { t } = ctx;
  const rootScope = fnPath.scope;

  fnPath.traverse({
    Function(innerPath) {
      if (innerPath === fnPath) {
        return;
      }
      innerPath.traverse({
        Identifier(idPath) {
          if (!idPath.isReferencedIdentifier()) {
            return;
          }
          const name = idPath.node.name;
          if (name === "undefined") {
            return;
          }
          const binding = innerPath.scope.getBinding(name);
          if (binding && binding.scope === rootScope) {
            idPath.replaceWith(
              t.memberExpression(envId, t.identifier(name))
            );
            return;
          }
          if (innerPath.isArrowFunctionExpression() && name === "arguments") {
            if (!binding) {
              idPath.replaceWith(
                t.memberExpression(
                  envId,
                  t.stringLiteral(envArgsKey),
                  true
                )
              );
            }
            return;
          }
        },
        ThisExpression(thisPath) {
          if (innerPath.isArrowFunctionExpression()) {
            thisPath.replaceWith(
              t.memberExpression(
                envId,
                t.stringLiteral(envThisKey),
                true
              )
            );
          }
        },
      });
    },
  });
}

function normalizeFunction(fnPath, ctx) {
  if (fnPath.node.generator) {
    return null;
  }
  if (hasUnsupported(fnPath)) {
    return null;
  }
  if (!rewriteForOf(fnPath, ctx)) {
    return null;
  }
  rewriteBlockScoped(fnPath, ctx);
  const paramPrologue = rewriteParams(fnPath, ctx);
  if (!paramPrologue) {
    return null;
  }
  const funcDeclPrologue = hoistFunctionDeclarations(fnPath, ctx);
  if (!rewriteDestructuringDecls(fnPath, ctx)) {
    return null;
  }
  if (!rewriteDestructuringAssignments(fnPath, ctx)) {
    return null;
  }

  const body = fnPath.node.body;
  if (!body || body.type !== "BlockStatement") {
    return null;
  }
  const directives = [];
  const rest = [];
  for (const stmt of body.body) {
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      directives.push(stmt);
    } else {
      rest.push(stmt);
    }
  }
  body.body = [...directives, ...paramPrologue, ...funcDeclPrologue, ...rest];
  return body;
}

function hasBlockScoped(fnPath) {
  let found = false;
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    VariableDeclaration(path) {
      if (path.node.kind !== "var") {
        found = true;
        path.stop();
      }
    },
  });
  return found;
}

function canVirtualize(fnPath, ctx) {
  let ok = true;
  if (!ctx.options.vm.downlevel && hasBlockScoped(fnPath)) {
    return false;
  }
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    ForInStatement(path) {
      ok = false;
      path.stop();
    },
    LabeledStatement(path) {
      ok = false;
      path.stop();
    },
    BreakStatement(path) {
      if (path.node.label) {
        ok = false;
        path.stop();
      }
    },
    ContinueStatement(path) {
      if (path.node.label) {
        ok = false;
        path.stop();
      }
    },
    AssignmentExpression(path) {
      if (path.node.left.type === "ObjectPattern" || path.node.left.type === "ArrayPattern") {
        ok = false;
        path.stop();
      }
    },
    UpdateExpression() {
    },
    ObjectPattern(path) {
      for (const prop of path.node.properties) {
        if (prop.computed) {
          ok = false;
          path.stop();
          break;
        }
        if (prop.type === "RestElement" && prop.argument.type !== "Identifier") {
          ok = false;
          path.stop();
          break;
        }
      }
    },
    UnaryExpression(path) {
      if (path.node.operator === "delete") {
        ok = false;
        path.stop();
      }
    },
  });
  return ok;
}

function collectLocals(fnPath) {
  const locals = new Set();
  for (const param of fnPath.node.params) {
    if (param.type === "Identifier") {
      locals.add(param.name);
    }
  }
  fnPath.traverse({
    Function(path) {
      if (path !== fnPath) {
        path.skip();
      }
    },
    VariableDeclarator(path) {
      if (path.node.id.type === "Identifier") {
        locals.add(path.node.id.name);
      }
    },
    ClassDeclaration(path) {
      if (path.node.id) {
        locals.add(path.node.id.name);
      }
    },
    CatchClause(path) {
      if (path.node.param && path.node.param.type === "Identifier") {
        locals.add(path.node.param.name);
      }
    },
  });
  return locals;
}

module.exports = {
  canVirtualize,
  collectLocals,
  normalizeFunction,
  rewriteClosureRefs,
};
