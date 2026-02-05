const { walk } = require("./ast");
const { collectIdentifierNames, makeNameFactory } = require("./names");
const { addSSAUsedNamesFromRoot } = require("./ssa-utils");

const RESERVED = new Set([
  "_ENV",
  "_G",
]);

function identifier(name) {
  return { type: "Identifier", name };
}

let ACTIVE_FACTORY = null;

function stringLiteral(value) {
  const raw = JSON.stringify(value);
  if (ACTIVE_FACTORY && typeof ACTIVE_FACTORY.makeStringLiteral === "function") {
    return ACTIVE_FACTORY.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function indexExpression(base, key) {
  return {
    type: "IndexExpression",
    base,
    index: stringLiteral(key),
  };
}

function emptyTable() {
  return { type: "TableConstructorExpression", fields: [] };
}

function proxyDeclaration(proxyName) {
  return {
    type: "LocalStatement",
    variables: [identifier(proxyName)],
    init: [emptyTable()],
  };
}

function proxyAssignment(proxyName, names) {
  if (!names || !names.length) {
    return null;
  }
  return {
    type: "AssignmentStatement",
    variables: names.map((name) => indexExpression(identifier(proxyName), name)),
    init: names.map((name) => identifier(name)),
  };
}

function createScope(parent = null) {
  return {
    parent,
    locals: new Set(),
    proxyName: null,
  };
}

function ensureProxy(scope, nameGen) {
  if (!scope.proxyName) {
    scope.proxyName = nameGen();
  }
  return scope.proxyName;
}

function declareLocal(scope, name, nameGen) {
  if (!name || RESERVED.has(name)) {
    return;
  }
  scope.locals.add(name);
  ensureProxy(scope, nameGen);
}

function resolveLocal(scope, name) {
  let current = scope;
  while (current) {
    if (current.locals.has(name)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function isProxyName(scope, name) {
  let current = scope;
  while (current) {
    if (current.proxyName === name) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function buildProxyIndex(scope, name) {
  return indexExpression(identifier(scope.proxyName), name);
}

function transformExpression(expr, scope, ctx) {
  if (!expr || typeof expr !== "object") {
    return expr;
  }
  switch (expr.type) {
    case "Identifier": {
      if (RESERVED.has(expr.name) || isProxyName(scope, expr.name)) {
        return expr;
      }
      const resolved = resolveLocal(scope, expr.name);
      if (!resolved || !resolved.proxyName) {
        return expr;
      }
      return buildProxyIndex(resolved, expr.name);
    }
    case "BinaryExpression":
    case "LogicalExpression":
      expr.left = transformExpression(expr.left, scope, ctx);
      expr.right = transformExpression(expr.right, scope, ctx);
      return expr;
    case "UnaryExpression":
      expr.argument = transformExpression(expr.argument, scope, ctx);
      return expr;
    case "GroupExpression":
      expr.expression = transformExpression(expr.expression, scope, ctx);
      return expr;
    case "IndexExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      expr.index = transformExpression(expr.index, scope, ctx);
      return expr;
    case "MemberExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      return expr;
    case "CallExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      expr.arguments = (expr.arguments || []).map((arg) => transformExpression(arg, scope, ctx));
      return expr;
    case "MethodCallExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      expr.arguments = (expr.arguments || []).map((arg) => transformExpression(arg, scope, ctx));
      return expr;
    case "TableCallExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      expr.arguments = transformExpression(expr.arguments, scope, ctx);
      return expr;
    case "StringCallExpression":
      expr.base = transformExpression(expr.base, scope, ctx);
      expr.argument = transformExpression(expr.argument, scope, ctx);
      return expr;
    case "FunctionDeclaration":
    case "FunctionExpression":
      transformFunctionExpression(expr, scope, ctx);
      return expr;
    case "TableConstructorExpression":
      expr.fields.forEach((field) => transformTableField(field, scope, ctx));
      return expr;
    case "IfExpression":
      expr.clauses.forEach((clause) => {
        clause.condition = transformExpression(clause.condition, scope, ctx);
        clause.value = transformExpression(clause.value, scope, ctx);
      });
      expr.elseValue = transformExpression(expr.elseValue, scope, ctx);
      return expr;
    case "TypeAssertion":
      expr.expression = transformExpression(expr.expression, scope, ctx);
      return expr;
    case "InterpolatedString":
      if (expr.parts && Array.isArray(expr.parts)) {
        expr.parts = expr.parts.map((part) => {
          if (part && part.type === "InterpolatedStringText") {
            return part;
          }
          return transformExpression(part, scope, ctx);
        });
      }
      return expr;
    default:
      return expr;
  }
}

function transformTableField(field, scope, ctx) {
  if (!field || typeof field !== "object") {
    return;
  }
  if (field.type === "TableKey") {
    field.key = transformExpression(field.key, scope, ctx);
    field.value = transformExpression(field.value, scope, ctx);
    return;
  }
  if (field.type === "TableKeyString") {
    field.value = transformExpression(field.value, scope, ctx);
    return;
  }
  if (field.type === "TableValue") {
    field.value = transformExpression(field.value, scope, ctx);
    return;
  }
  if (field.kind === "index") {
    field.key = transformExpression(field.key, scope, ctx);
    field.value = transformExpression(field.value, scope, ctx);
    return;
  }
  if (field.kind === "name") {
    field.value = transformExpression(field.value, scope, ctx);
    return;
  }
  if (field.kind === "list") {
    field.value = transformExpression(field.value, scope, ctx);
  }
}

function transformAssignmentTarget(target, scope, ctx) {
  if (!target || typeof target !== "object") {
    return target;
  }
  if (target.type === "Identifier") {
    return transformExpression(target, scope, ctx);
  }
  if (target.type === "MemberExpression") {
    target.base = transformExpression(target.base, scope, ctx);
    return target;
  }
  if (target.type === "IndexExpression") {
    target.base = transformExpression(target.base, scope, ctx);
    target.index = transformExpression(target.index, scope, ctx);
    return target;
  }
  return target;
}

function transformStatementList(body, scope, ctx) {
  const output = [];
  for (const stmt of body) {
    const transformed = transformStatement(stmt, scope, ctx);
    if (!transformed) {
      continue;
    }
    if (Array.isArray(transformed)) {
      output.push(...transformed);
    } else {
      output.push(transformed);
    }
  }
  body.splice(0, body.length, ...output);
}

function transformScopedBody(body, parentScope, ctx, initNames = []) {
  const scope = createScope(parentScope);
  initNames.forEach((name) => declareLocal(scope, name, ctx.nameGen));
  if (Array.isArray(body)) {
    transformStatementList(body, scope, ctx);
  } else if (body && Array.isArray(body.body)) {
    transformStatementList(body.body, scope, ctx);
  }
  finalizeScope(scope, body, initNames);
}

function finalizeScope(scope, body, initNames) {
  if (!scope.proxyName) {
    return;
  }
  const initStatements = [proxyDeclaration(scope.proxyName)];
  const assignment = proxyAssignment(scope.proxyName, initNames);
  if (assignment) {
    initStatements.push(assignment);
  }
  if (Array.isArray(body)) {
    body.unshift(...initStatements);
  } else if (body && Array.isArray(body.body)) {
    body.body.unshift(...initStatements);
  }
}

function extractFunctionName(stmt) {
  if (stmt.identifier && stmt.identifier.type === "Identifier") {
    return stmt.identifier.name;
  }
  if (stmt.name && stmt.name.type === "FunctionName" && stmt.name.base && stmt.name.base.type === "Identifier") {
    if (!stmt.name.members.length && !stmt.name.method) {
      return stmt.name.base.name;
    }
  }
  return null;
}

function buildFunctionExpression(stmt, isCustom) {
  if (isCustom) {
    return {
      type: "FunctionExpression",
      parameters: stmt.parameters || [],
      hasVararg: Boolean(stmt.hasVararg),
      varargAnnotation: stmt.varargAnnotation || null,
      returnType: stmt.returnType || null,
      typeParameters: stmt.typeParameters || [],
      body: stmt.body,
    };
  }
  return {
    type: "FunctionDeclaration",
    identifier: null,
    parameters: stmt.parameters || [],
    isLocal: false,
    body: stmt.body || [],
  };
}

function transformFunctionExpression(fn, parentScope, ctx) {
  const scope = createScope(parentScope);
  const params = [];
  if (Array.isArray(fn.parameters)) {
    fn.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        params.push(param.name);
        declareLocal(scope, param.name, ctx.nameGen);
      }
    });
  }
  if (Array.isArray(fn.body)) {
    transformStatementList(fn.body, scope, ctx);
  } else if (fn.body && Array.isArray(fn.body.body)) {
    transformStatementList(fn.body.body, scope, ctx);
  }
  finalizeScope(scope, fn.body, params);
}

function transformStatement(stmt, scope, ctx) {
  if (!stmt || typeof stmt !== "object") {
    return stmt;
  }
  switch (stmt.type) {
    case "LocalStatement": {
      if (stmt.init && stmt.init.length) {
        stmt.init = stmt.init.map((expr) => transformExpression(expr, scope, ctx));
      }
      const names = [];
      stmt.variables.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          declareLocal(scope, variable.name, ctx.nameGen);
          names.push(variable.name);
        }
      });
      const assignment = scope.proxyName ? proxyAssignment(scope.proxyName, names) : null;
      return assignment ? [stmt, assignment] : stmt;
    }
    case "AssignmentStatement":
      stmt.variables = stmt.variables.map((variable) => transformAssignmentTarget(variable, scope, ctx));
      stmt.init = stmt.init.map((expr) => transformExpression(expr, scope, ctx));
      return stmt;
    case "CompoundAssignmentStatement":
      stmt.variable = transformAssignmentTarget(stmt.variable, scope, ctx);
      stmt.value = transformExpression(stmt.value, scope, ctx);
      return stmt;
    case "CallStatement":
      stmt.expression = transformExpression(stmt.expression, scope, ctx);
      return stmt;
    case "ReturnStatement":
      stmt.arguments = stmt.arguments.map((expr) => transformExpression(expr, scope, ctx));
      return stmt;
    case "FunctionDeclaration": {
      const isLocal = Boolean(stmt.isLocal);
      const fnName = isLocal ? extractFunctionName(stmt) : null;
      if (isLocal && fnName) {
        declareLocal(scope, fnName, ctx.nameGen);
        const fnExpr = buildFunctionExpression(stmt, ctx.isCustom);
        transformFunctionExpression(fnExpr, scope, ctx);
        const assignment = proxyAssignment(scope.proxyName, [fnName]);
        if (assignment) {
          assignment.init = [fnExpr];
          return assignment;
        }
      }
      transformFunctionExpression(stmt, scope, ctx);
      return stmt;
    }
    case "WhileStatement":
      stmt.condition = transformExpression(stmt.condition, scope, ctx);
      transformScopedBody(stmt.body, scope, ctx);
      return stmt;
    case "RepeatStatement": {
      const repeatScope = createScope(scope);
      if (Array.isArray(stmt.body)) {
        transformStatementList(stmt.body, repeatScope, ctx);
      } else if (stmt.body && Array.isArray(stmt.body.body)) {
        transformStatementList(stmt.body.body, repeatScope, ctx);
      }
      stmt.condition = transformExpression(stmt.condition, repeatScope, ctx);
      finalizeScope(repeatScope, stmt.body);
      return stmt;
    }
    case "ForNumericStatement": {
      stmt.start = transformExpression(stmt.start, scope, ctx);
      stmt.end = transformExpression(stmt.end, scope, ctx);
      if (stmt.step) {
        stmt.step = transformExpression(stmt.step, scope, ctx);
      }
      const name = stmt.variable && stmt.variable.type === "Identifier" ? stmt.variable.name : null;
      const initNames = name ? [name] : [];
      transformScopedBody(stmt.body, scope, ctx, initNames);
      return stmt;
    }
    case "ForGenericStatement": {
      stmt.iterators = stmt.iterators.map((expr) => transformExpression(expr, scope, ctx));
      const names = [];
      stmt.variables.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          names.push(variable.name);
        }
      });
      transformScopedBody(stmt.body, scope, ctx, names);
      return stmt;
    }
    case "DoStatement":
      transformScopedBody(stmt.body, scope, ctx);
      return stmt;
    case "IfStatement":
      transformIfStatement(stmt, scope, ctx);
      return stmt;
    case "BreakStatement":
    case "ContinueStatement":
    case "LabelStatement":
    case "GotoStatement":
    case "TypeAliasStatement":
    case "ExportTypeStatement":
    case "TypeFunctionStatement":
    case "ExportTypeFunctionStatement":
      return stmt;
    default:
      return stmt;
  }
}

function transformIfStatement(stmt, scope, ctx) {
  if (!stmt.clauses || !stmt.clauses.length) {
    return;
  }
  const firstClause = stmt.clauses[0];
  if (firstClause && typeof firstClause.type === "string") {
    stmt.clauses.forEach((clause) => {
      if (clause.type !== "ElseClause") {
        clause.condition = transformExpression(clause.condition, scope, ctx);
      }
      transformScopedBody(clause.body, scope, ctx);
    });
    return;
  }
  stmt.clauses.forEach((clause) => {
    clause.condition = transformExpression(clause.condition, scope, ctx);
    transformScopedBody(clause.body, scope, ctx);
  });
  if (stmt.elseBody) {
    transformScopedBody(stmt.elseBody, scope, ctx);
  }
}

function proxifyLocals(ast, ctx) {
  ACTIVE_FACTORY = ctx && ctx.factory ? ctx.factory : null;
  try {
  if (!ctx.options.proxifyLocals) {
    return;
  }
  if (!ast || !Array.isArray(ast.body)) {
    return;
  }
  const used = collectIdentifierNames(ast, ctx);
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;
  if (ssaRoot) {
    addSSAUsedNamesFromRoot(ssaRoot, used);
  }
  const nameGen = makeNameFactory(ctx.rng, used);
  const state = {
    ...ctx,
    nameGen,
    isCustom: ctx.options.luauParser === "custom",
  };
  const rootScope = createScope(null);
  transformStatementList(ast.body, rootScope, state);
  finalizeScope(rootScope, ast.body);
  } finally {
    ACTIVE_FACTORY = null;
  }
}

module.exports = {
  proxifyLocals,
};
