"use strict";

const { collectIdentifierNames, makeNameFactory } = require("./names");
const { getCachedSSAUsedNamesFromRoot } = require("./ssa-utils").default;
const { traverse } = require("./ast");

function cloneNode(node) {
  if (!node || typeof node !== "object") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => cloneNode(item));
  }
  const out = {};
  for (const key of Object.keys(node)) {
    out[key] = cloneNode(node[key]);
  }
  return out;
}

function identifier(name) {
  return { type: "Identifier", name };
}

function numericLiteral(value) {
  return { type: "NumericLiteral", value, raw: String(value) };
}

function stringLiteral(value) {
  return { type: "StringLiteral", value, raw: JSON.stringify(value) };
}

function booleanLiteral(value) {
  return { type: "BooleanLiteral", value };
}

function groupExpression(expression) {
  return { type: "GroupExpression", expression };
}

function binaryExpression(operator, left, right) {
  return { type: "BinaryExpression", operator, left, right };
}

function makeLocalStatement(variables, init = []) {
  return { type: "LocalStatement", variables, init };
}

function makeAssignmentStatement(variables, init = []) {
  return { type: "AssignmentStatement", variables, init };
}

function buildIfStatement(condition, trueBody, falseBody, isCustom) {
  if (!isCustom) {
    return {
      type: "IfStatement",
      clauses: [
        { type: "IfClause", condition, body: trueBody },
        { type: "ElseClause", body: falseBody },
      ],
    };
  }
  return {
    type: "IfStatement",
    clauses: [
      {
        condition,
        body: { type: "Block", body: trueBody },
      },
    ],
    elseBody: { type: "Block", body: falseBody },
  };
}

function buildOpaqueTruePredicate(seedVarNode, rng) {
  const template = rng.int(0, 5);
  if (template === 0) {
    // (x * (x + 1)) % 2 == 0 (consecutive integer product is always even)
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        groupExpression(
          binaryExpression(
            "*",
            cloneNode(seedVarNode),
            groupExpression(binaryExpression("+", cloneNode(seedVarNode), numericLiteral(1)))
          )
        ),
        numericLiteral(2)
      ),
      numericLiteral(0)
    );
  }
  if (template === 1) {
    // (x^3 - x) % 6 == 0
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        groupExpression(
          binaryExpression(
            "-",
            binaryExpression(
              "*",
              binaryExpression("*", cloneNode(seedVarNode), cloneNode(seedVarNode)),
              cloneNode(seedVarNode)
            ),
            cloneNode(seedVarNode)
          )
        ),
        numericLiteral(6)
      ),
      numericLiteral(0)
    );
  }
  if (template === 2) {
    // (x^2) % 4 ~= 2 (no integer square mod 4 equals 2)
    return binaryExpression(
      "~=",
      binaryExpression(
        "%",
        groupExpression(binaryExpression("*", cloneNode(seedVarNode), cloneNode(seedVarNode))),
        numericLiteral(4)
      ),
      numericLiteral(2)
    );
  }
  if (template === 3) {
    // (x^2) % 4 ~= 3 (no integer square mod 4 equals 3)
    return binaryExpression(
      "~=",
      binaryExpression(
        "%",
        groupExpression(binaryExpression("*", cloneNode(seedVarNode), cloneNode(seedVarNode))),
        numericLiteral(4)
      ),
      numericLiteral(3)
    );
  }
  if (template === 4) {
    // (x * 2 + 1) % 2 == 1 (any odd number mod 2 is 1)
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        groupExpression(
          binaryExpression(
            "+",
            binaryExpression("*", cloneNode(seedVarNode), numericLiteral(2)),
            numericLiteral(1)
          )
        ),
        numericLiteral(2)
      ),
      numericLiteral(1)
    );
  }
  // (x^2 + x + 2) % 2 == 0
  return binaryExpression(
    "==",
    binaryExpression(
      "%",
      groupExpression(
        binaryExpression(
          "+",
          binaryExpression(
            "+",
            binaryExpression("*", cloneNode(seedVarNode), cloneNode(seedVarNode)),
            cloneNode(seedVarNode)
          ),
          numericLiteral(2)
        )
      ),
      numericLiteral(2)
    ),
    numericLiteral(0)
  );
}

function buildDecoyExpression(realExpr, rng) {
  if (!realExpr) {
    return numericLiteral(rng.int(100, 9999));
  }
  if (realExpr.type === "NumericLiteral") {
    const origVal = typeof realExpr.value === "number" ? realExpr.value : 42;
    const decoyVal = Math.floor(origVal ^ rng.int(1, 255)) + rng.int(1, 19);
    return numericLiteral(decoyVal);
  }
  if (realExpr.type === "StringLiteral") {
    const val = typeof realExpr.value === "string" ? realExpr.value : "data";
    return stringLiteral(`${val}_decoy_${rng.int(10, 99)}`);
  }
  if (realExpr.type === "BooleanLiteral") {
    return booleanLiteral(!realExpr.value);
  }
  if (realExpr.type === "TableConstructorExpression") {
    return { type: "TableConstructorExpression", fields: [] };
  }
  return numericLiteral(rng.int(1000, 99999));
}

function shouldTransformStatement(stmt, rng, probability) {
  if (!stmt) {
    return false;
  }
  if (stmt.type === "LocalStatement") {
    if (!stmt.variables || !stmt.variables.length) {
      return false;
    }
    if (!stmt.init || !stmt.init.length) {
      return false;
    }
    for (const initExpr of stmt.init) {
      if (initExpr && (initExpr.type === "FunctionExpression" || initExpr.type === "FunctionDeclaration")) {
        return false;
      }
    }
    return (rng.int(0, 10000) / 10000) <= probability;
  }
  if (stmt.type === "AssignmentStatement") {
    if (!stmt.variables || !stmt.variables.length) {
      return false;
    }
    if (!stmt.init || !stmt.init.length) {
      return false;
    }
    for (const initExpr of stmt.init) {
      if (initExpr && (initExpr.type === "FunctionExpression" || initExpr.type === "FunctionDeclaration")) {
        return false;
      }
    }
    return (rng.int(0, 10000) / 10000) <= probability;
  }
  return false;
}

function transformToPhiFork(stmt, opqName, state) {
  const { rng, isCustom } = state;
  const condition = buildOpaqueTruePredicate(identifier(opqName), rng);

  if (stmt.type === "LocalStatement") {
    const declStmt = makeLocalStatement(
      stmt.variables.map((v) => cloneNode(v)),
      []
    );
    const trueAssignment = makeAssignmentStatement(
      stmt.variables.map((v) => cloneNode(v)),
      stmt.init
    );
    const falseAssignment = makeAssignmentStatement(
      stmt.variables.map((v) => cloneNode(v)),
      stmt.variables.map((_, idx) => buildDecoyExpression(stmt.init[idx], rng))
    );
    const ifStmt = buildIfStatement(condition, [trueAssignment], [falseAssignment], isCustom);
    return [declStmt, ifStmt];
  }

  if (stmt.type === "AssignmentStatement") {
    const trueAssignment = stmt;
    const falseAssignment = makeAssignmentStatement(
      stmt.variables.map((v) => cloneNode(v)),
      stmt.variables.map((_, idx) => buildDecoyExpression(stmt.init[idx], rng))
    );
    const ifStmt = buildIfStatement(condition, [trueAssignment], [falseAssignment], isCustom);
    return [ifStmt];
  }

  return null;
}

function applyMbaToStatement(stmt, state) {
  const { rng } = state;
  traverse(stmt, {
    enter(node, parent, key, index, context) {
      if (!node || node.type !== "BinaryExpression" || node._mbaDone) {
        return;
      }
      if (node.operator === "+" && (rng.int(0, 100) / 100) <= 0.4) {
        const k = rng.int(3, 89);
        const blinded = binaryExpression(
          "+",
          groupExpression(binaryExpression("+", cloneNode(node.left), numericLiteral(k))),
          groupExpression(binaryExpression("-", cloneNode(node.right), numericLiteral(k)))
        );
        blinded._mbaDone = true;
        if (context && typeof context.replace === "function") {
          context.replace(blinded);
          context.skip();
        }
      } else if (node.operator === "-" && (rng.int(0, 100) / 100) <= 0.4) {
        const k = rng.int(3, 89);
        const blinded = binaryExpression(
          "-",
          groupExpression(binaryExpression("+", cloneNode(node.left), numericLiteral(k))),
          groupExpression(binaryExpression("+", cloneNode(node.right), numericLiteral(k)))
        );
        blinded._mbaDone = true;
        if (context && typeof context.replace === "function") {
          context.replace(blinded);
          context.skip();
        }
      }
    },
  });
}

function transformStatementArray(stmts, state) {
  const { rng, options } = state;
  const phiConfusion = options.phiConfusion !== false;
  const mba = options.mba !== false;
  const probability = options.probability ?? 0.75;
  const newStmts = [];
  let injectedOpqName = null;

  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    if (!stmt) {
      continue;
    }

    if (phiConfusion && shouldTransformStatement(stmt, rng, probability)) {
      if (!injectedOpqName) {
        injectedOpqName = state.nameGen("opq");
        const seedVal = rng.int(17, 399);
        newStmts.push(
          makeLocalStatement([identifier(injectedOpqName)], [numericLiteral(seedVal)])
        );
      }

      const transformed = transformToPhiFork(stmt, injectedOpqName, state);
      if (transformed) {
        newStmts.push(...transformed);
        continue;
      }
    }

    if (mba) {
      applyMbaToStatement(stmt, state);
    }

    newStmts.push(stmt);
  }

  stmts.length = 0;
  stmts.push(...newStmts);
}

function visitInnerBlocks(stmt, state) {
  if (!stmt) {
    return;
  }
  if (stmt.type === "DoStatement" && stmt.body) {
    transformBlock(stmt.body.body || stmt.body, state);
  } else if (stmt.type === "IfStatement") {
    if (Array.isArray(stmt.clauses)) {
      stmt.clauses.forEach((clause) => {
        if (clause && clause.body) {
          transformBlock(clause.body.body || clause.body, state);
        }
      });
    }
    if (stmt.elseBody) {
      transformBlock(stmt.elseBody.body || stmt.elseBody, state);
    }
  } else if ((stmt.type === "WhileStatement" || stmt.type === "RepeatStatement") && stmt.body) {
    transformBlock(stmt.body.body || stmt.body, state);
  } else if ((stmt.type === "ForNumericStatement" || stmt.type === "ForGenericStatement") && stmt.body) {
    transformBlock(stmt.body.body || stmt.body, state);
  } else if (stmt.type === "FunctionDeclaration" && stmt.body) {
    transformBlock(stmt.body.body || stmt.body, state);
  } else {
    // Scan for any nested FunctionExpressions inside expressions
    traverse(stmt, {
      enter(node) {
        if (node && node.type === "FunctionExpression" && node.body) {
          transformBlock(node.body.body || node.body, state);
        }
      },
    });
  }
}

function transformBlock(stmts, state) {
  if (!Array.isArray(stmts) || !stmts.length) {
    return;
  }
  // 1. First process all nested inner blocks:
  for (let i = 0; i < stmts.length; i++) {
    visitInnerBlocks(stmts[i], state);
  }
  // 2. Transform the statements in the current block:
  transformStatementArray(stmts, state);
}

function antiSSALuau(ast, ctx) {
  if (!ctx || !ctx.options || !ctx.options.antiSSA) {
    return;
  }
  if (!ast || !ast.body) {
    return;
  }

  const antiSSAOptions = ctx.options.antiSSAOptions || {};
  const used = collectIdentifierNames(ast, ctx);
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;
  if (ssaRoot) {
    getCachedSSAUsedNamesFromRoot(ssaRoot).forEach((name) => used.add(name));
  }

  const nameGen = makeNameFactory(ctx.rng, used);
  const state = {
    rng: ctx.rng,
    options: antiSSAOptions,
    isCustom: !ctx.options || ctx.options.luauParser !== "luaparse",
    nameGen,
  };

  const topStmts = Array.isArray(ast.body) ? ast.body : (ast.body.body && Array.isArray(ast.body.body) ? ast.body.body : null);
  if (topStmts) {
    transformBlock(topStmts, state);
  }
}

module.exports = {
  antiSSALuau,
  buildOpaqueTruePredicate,
  buildDecoyExpression,
  transformToPhiFork,
};
