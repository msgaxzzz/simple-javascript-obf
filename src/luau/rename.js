const { walk } = require("./ast");
const { collectSSAReadNamesFromRoot } = require("./ssa-utils");

const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "continue",
  "do",
  "else",
  "elseif",
  "end",
  "export",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "type",
  "typeof",
  "until",
  "while",
  "self",
]);
const LUA_RESERVED_GLOBALS = new Set(["_ENV", "_G"]);
const LUA_METAMETHOD_PREFIX = "__";
const EXTERNAL_SCHEMA_PARAM_NAME = /^(payload|input|params|options|config)$/i;
const EXTERNAL_SCHEMA_LOCAL_NAME = /^(payload|input|summary|report)$/i;
const BUILTIN_LIBS = new Set([
  "bit32",
  "coroutine",
  "debug",
  "io",
  "math",
  "os",
  "package",
  "string",
  "table",
  "utf8",
]);

const FIRST_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const REST_CHARS = `${FIRST_CHARS}0123456789`;

function shuffleChars(chars, rng) {
  const list = chars.split("");
  if (rng) {
    rng.shuffle(list);
  }
  return list.join("");
}

function hash32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

function encodeBase(value, alphabet, minLen) {
  const base = alphabet.length;
  let v = value >>> 0;
  let out = "";
  do {
    out = alphabet[v % base] + out;
    v = Math.floor(v / base);
  } while (v > 0);
  if (minLen && out.length < minLen) {
    let pad = value >>> 0;
    while (out.length < minLen) {
      pad = Math.imul(pad ^ 0x5bd1e995, 0x27d4eb2d) >>> 0;
      out = alphabet[pad % base] + out;
    }
  }
  return out;
}

class LuaNameGenerator {
  constructor({ rng, reserved = [], alphabets = null } = {}) {
    this.rng = rng;
    this.reserved = new Set(reserved);
    this.used = new Set();
    this.index = 0;
    if (alphabets && alphabets.first && alphabets.rest) {
      this.firstAlphabet = alphabets.first;
      this.restAlphabet = alphabets.rest;
    } else {
      this.firstAlphabet = shuffleChars(FIRST_CHARS, rng);
      this.restAlphabet = shuffleChars(REST_CHARS, rng);
    }
    this.salt = rng ? rng.int(0, 0x7fffffff) : 0x9e3779b9;
  }

  next() {
    while (true) {
      const currentIndex = this.index;
      this.index += 1;
      const mixed = hash32(currentIndex + this.salt);
      const first = this.firstAlphabet[mixed % this.firstAlphabet.length];
      const minLen = 2 + (mixed % 3);
      const body = encodeBase(hash32(mixed ^ 0x9e3779b9), this.restAlphabet, minLen);
      const name = `${first}${body}`;
      if (!this.reserved.has(name) && !this.used.has(name)) {
        this.used.add(name);
        return name;
      }
    }
  }

  reserve(name) {
    this.reserved.add(name);
  }
}

function collectIdentifiers(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (node && node.type === "Identifier" && typeof node.name === "string") {
      names.add(node.name);
    }
  });
  return names;
}

function collectGlobalBindings(ast) {
  const globals = new Set();
  if (!ast || !Array.isArray(ast.body)) {
    return globals;
  }
  for (const stmt of ast.body) {
    if (!stmt || typeof stmt !== "object") {
      continue;
    }
    if (stmt.type === "AssignmentStatement") {
      const variables = stmt.variables || [];
      variables.forEach((variable) => {
        if (variable && variable.type === "Identifier" && typeof variable.name === "string") {
          globals.add(variable.name);
        }
      });
      continue;
    }
    if (stmt.type === "FunctionDeclaration") {
      if (stmt.isLocal) {
        continue;
      }
      if (stmt.name && stmt.name.type === "FunctionName") {
        if (!stmt.name.members.length && !stmt.name.method && stmt.name.base) {
          globals.add(stmt.name.base.name);
        }
        continue;
      }
      if (stmt.identifier && stmt.identifier.type === "Identifier") {
        globals.add(stmt.identifier.name);
      }
    }
  }
  return globals;
}

function createScope(parent = null) {
  return { parent, bindings: new Map(), memberSafe: new Map() };
}

function resolveName(scope, name) {
  let current = scope;
  while (current) {
    if (current.bindings.has(name)) {
      return current.bindings.get(name);
    }
    current = current.parent;
  }
  return null;
}

function resolveBindingScope(scope, name) {
  let current = scope;
  while (current) {
    if (current.bindings.has(name)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function resolveMemberSafety(scope, name) {
  let current = scope;
  while (current) {
    if (current.memberSafe.has(name)) {
      return current.memberSafe.get(name);
    }
    current = current.parent;
  }
  return false;
}

function isEnvAliasIdentifier(node, scope, ctx) {
  if (!node || node.type !== "Identifier") {
    return false;
  }
  if (ctx && ctx.envAliasName && node.name === ctx.envAliasName) {
    return true;
  }
  if (node.name === "_ENV" || node.name === "_G") {
    return !resolveName(scope, node.name);
  }
  return false;
}

function isEnvAliasLookup(expr, scope, ctx) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if (expr.type === "IndexExpression") {
    if (isEnvAliasIdentifier(expr.base, scope, ctx)) {
      return true;
    }
    return isEnvAliasLookup(expr.base, scope, ctx);
  }
  if (expr.type === "MemberExpression") {
    return isEnvAliasLookup(expr.base, scope, ctx);
  }
  return false;
}

function isBuiltinLibBase(expr, scope, ctx) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if (expr.type === "Identifier") {
    return BUILTIN_LIBS.has(expr.name) && !resolveName(scope, expr.name);
  }
  if (isEnvAliasLookup(expr, scope, ctx)) {
    return true;
  }
  return false;
}

function isDynamicKeyMapAccess(expr, scope, ctx) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  const exprPath = getMemberPath(expr);
  if (exprPath && ctx.dynamicIndexBaseNames && ctx.dynamicIndexBaseNames.has(exprPath)) {
    return true;
  }
  if (expr.type === "IndexExpression") {
    if (
      expr.index &&
      expr.index.type !== "StringLiteral" &&
      expr.index.type !== "NumericLiteral" &&
      expr.index.type !== "BooleanLiteral"
    ) {
      return isDefinitelyLocalTable(expr.base, scope, ctx);
    }
    return isDynamicKeyMapAccess(expr.base, scope, ctx);
  }
  if (expr.type === "MemberExpression") {
    if (
      expr.identifier &&
      expr.identifier.type === "Identifier" &&
      ctx.dynamicIndexMemberNames &&
      ctx.dynamicIndexMemberNames.has(expr.identifier.name) &&
      isDefinitelyLocalTable(expr.base, scope, ctx)
    ) {
      return true;
    }
    if (
      expr.identifier &&
      expr.identifier.type === "Identifier" &&
      ctx.dynamicIndexRecordBaseMemberNames &&
      ctx.dynamicIndexRecordBaseMemberNames.has(expr.identifier.name) &&
      isDefinitelyLocalTable(expr.base, scope, ctx)
    ) {
      return true;
    }
    return isDynamicKeyMapAccess(expr.base, scope, ctx);
  }
  return false;
}

function defineName(scope, name, ctx) {
  if (ctx.reserved.has(name)) {
    scope.bindings.set(name, name);
    return name;
  }
  let next = ctx.generator.next();
  while (ctx.used.has(next) || ctx.reserved.has(next)) {
    next = ctx.generator.next();
  }
  ctx.used.add(next);
  scope.bindings.set(name, next);
  return next;
}

function defineGlobal(name, ctx) {
  if (ctx.reserved.has(name)) {
    ctx.globals.set(name, name);
    return name;
  }
  let next = ctx.generator.next();
  while (ctx.used.has(next) || ctx.reserved.has(next)) {
    next = ctx.generator.next();
  }
  ctx.used.add(next);
  ctx.globals.set(name, next);
  return next;
}

function traceRename(ctx, event) {
  if (ctx && typeof ctx.debugTrace === "function") {
    ctx.debugTrace(event);
  }
}

function defineMember(name, ctx) {
  if (ctx.reserved.has(name)) {
    ctx.memberMap.set(name, name);
    return name;
  }
  let next = ctx.generator.next();
  while (ctx.used.has(next) || ctx.reserved.has(next)) {
    next = ctx.generator.next();
  }
  ctx.used.add(next);
  ctx.memberMap.set(name, next);
  return next;
}

function getIdentifierName(node) {
  return node && node.type === "Identifier" && typeof node.name === "string" ? node.name : null;
}

function getMemberPath(expr) {
  if (!expr || typeof expr !== "object") {
    return null;
  }
  if (expr.type === "Identifier") {
    return expr.name;
  }
  if (expr.type === "MemberExpression" && expr.identifier && expr.identifier.type === "Identifier") {
    const base = getMemberPath(expr.base);
    if (!base) {
      return null;
    }
    return `${base}.${expr.identifier.name}`;
  }
  return null;
}

function registerConstructorMember(ctx, ownerNames, memberNames) {
  if (!ctx || !ctx.constructorMembers) {
    return;
  }
  ownerNames.forEach((ownerName) => {
    if (typeof ownerName !== "string" || !ownerName) {
      return;
    }
    let members = ctx.constructorMembers.get(ownerName);
    if (!members) {
      members = new Set();
      ctx.constructorMembers.set(ownerName, members);
    }
    memberNames.forEach((memberName) => {
      if (typeof memberName === "string" && memberName) {
        members.add(memberName);
      }
    });
  });
}

function isKnownConstructorMember(ownerName, memberName, ctx) {
  if (!ctx || !ctx.constructorMembers || typeof ownerName !== "string" || typeof memberName !== "string") {
    return false;
  }
  const members = ctx.constructorMembers.get(ownerName);
  return Boolean(members && members.has(memberName));
}

function isLocalTableLikeExpression(expr, localTableVars, ownerName) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  switch (expr.type) {
    case "TableConstructorExpression":
      return true;
    case "GroupExpression":
      return isLocalTableLikeExpression(expr.expression, localTableVars, ownerName);
    case "Identifier":
      return localTableVars.has(expr.name);
    case "IfExpression":
      if (!Array.isArray(expr.clauses) || !expr.clauses.length) {
        return false;
      }
      if (!isLocalTableLikeExpression(expr.elseValue, localTableVars, ownerName)) {
        return false;
      }
      return expr.clauses.every((clause) => isLocalTableLikeExpression(clause.value, localTableVars, ownerName));
    case "CallExpression": {
      const calleeName = getIdentifierName(expr.base);
      if (calleeName !== "setmetatable") {
        return false;
      }
      const args = Array.isArray(expr.arguments) ? expr.arguments : [];
      if (args.length < 2) {
        return false;
      }
      return isLocalTableLikeExpression(args[0], localTableVars, ownerName) && getIdentifierName(args[1]) === ownerName;
    }
    default:
      return false;
  }
}

function functionReturnsLocalTableLike(stmt, ownerName) {
  if (!stmt || !stmt.body) {
    return false;
  }
  const body = Array.isArray(stmt.body) ? stmt.body : stmt.body.body;
  if (!Array.isArray(body)) {
    return false;
  }

  const localTableVars = new Set();
  for (const entry of body) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    if (entry.type === "LocalStatement") {
      const variables = Array.isArray(entry.variables) ? entry.variables : [];
      const init = Array.isArray(entry.init) ? entry.init : [];
      variables.forEach((variable, index) => {
        const varName = getIdentifierName(variable);
        if (!varName) {
          return;
        }
        if (isLocalTableLikeExpression(init[index], localTableVars, ownerName)) {
          localTableVars.add(varName);
        }
      });
      continue;
    }
    if (entry.type === "ReturnStatement") {
      const values = Array.isArray(entry.arguments) ? entry.arguments : [];
      return values.some((value) => isLocalTableLikeExpression(value, localTableVars, ownerName));
    }
  }
  return false;
}

function collectConstructorMemberHints(ast) {
  const constructorMembers = new Map();
  const body = ast && Array.isArray(ast.body) ? ast.body : [];
  for (const stmt of body) {
    if (!stmt || stmt.type !== "FunctionDeclaration" || !stmt.name || stmt.name.type !== "FunctionName") {
      continue;
    }
    const ownerName = getIdentifierName(stmt.name.base);
    const memberNode = stmt.name.method || (Array.isArray(stmt.name.members) ? stmt.name.members[stmt.name.members.length - 1] : null);
    const memberName = getIdentifierName(memberNode);
    if (!ownerName || !memberName) {
      continue;
    }
    if (!functionReturnsLocalTableLike(stmt, ownerName)) {
      continue;
    }
    let members = constructorMembers.get(ownerName);
    if (!members) {
      members = new Set();
      constructorMembers.set(ownerName, members);
    }
    members.add(memberName);
  }
  return constructorMembers;
}

function collectDynamicIndexBaseNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "IndexExpression" || !node.base || !node.index) {
      return;
    }
    if (
      node.index.type === "StringLiteral" ||
      node.index.type === "NumericLiteral" ||
      node.index.type === "BooleanLiteral"
    ) {
      return;
    }
    const basePath = getMemberPath(node.base);
    if (basePath) {
      names.add(basePath);
    }
  });
  return names;
}

function collectDynamicIndexRecordBaseNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "AssignmentStatement") {
      return;
    }
    const variables = Array.isArray(node.variables) ? node.variables : [];
    const init = Array.isArray(node.init) ? node.init : [];
    variables.forEach((variable, index) => {
      if (!variable || variable.type !== "IndexExpression" || !variable.base || !variable.index) {
        return;
      }
      if (
        variable.index.type === "StringLiteral" ||
        variable.index.type === "NumericLiteral" ||
        variable.index.type === "BooleanLiteral"
      ) {
        return;
      }
      const basePath = getMemberPath(variable.base);
      const value = init[index];
      if (basePath && value && value.type === "TableConstructorExpression") {
        names.add(basePath);
      }
    });
  });
  return names;
}

function collectDynamicIndexRecordBaseMemberNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "AssignmentStatement") {
      return;
    }
    const variables = Array.isArray(node.variables) ? node.variables : [];
    const init = Array.isArray(node.init) ? node.init : [];
    variables.forEach((variable, index) => {
      const value = init[index];
      if (
        !variable ||
        variable.type !== "IndexExpression" ||
        !variable.base ||
        variable.base.type !== "MemberExpression" ||
        !variable.base.identifier ||
        !variable.index
      ) {
        return;
      }
      if (
        variable.index.type === "StringLiteral" ||
        variable.index.type === "NumericLiteral" ||
        variable.index.type === "BooleanLiteral"
      ) {
        return;
      }
      if (value && value.type === "TableConstructorExpression") {
        const memberName = getIdentifierName(variable.base.identifier);
        if (memberName) {
          names.add(memberName);
        }
      }
    });
  });
  return names;
}

function collectDynamicIndexRecordMemberNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "AssignmentStatement") {
      return;
    }
    const variables = Array.isArray(node.variables) ? node.variables : [];
    const init = Array.isArray(node.init) ? node.init : [];
    variables.forEach((variable, index) => {
      const value = init[index];
      if (
        !variable ||
        variable.type !== "IndexExpression" ||
        !variable.base ||
        !variable.index
      ) {
        return;
      }
      if (
        variable.index &&
        (
          variable.index.type === "StringLiteral" ||
          variable.index.type === "NumericLiteral" ||
          variable.index.type === "BooleanLiteral"
        )
      ) {
        return;
      }
      if (value && value.type === "TableConstructorExpression") {
        value.fields.forEach((field) => {
          if (!field || typeof field !== "object") {
            return;
          }
          if (field.kind === "name" && field.name && field.name.type === "Identifier") {
            names.add(field.name.name);
            return;
          }
          if (field.type === "TableKeyString" && field.key && field.key.type === "Identifier") {
            names.add(field.key.name);
          }
        });
      }
    });
  });
  return names;
}

function collectDynamicIndexMemberNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "IndexExpression" || !node.base || !node.index) {
      return;
    }
    if (
      node.index.type === "StringLiteral" ||
      node.index.type === "NumericLiteral" ||
      node.index.type === "BooleanLiteral"
    ) {
      return;
    }
    if (node.base && node.base.type === "MemberExpression" && node.base.identifier) {
      const memberName = getIdentifierName(node.base.identifier);
      if (memberName) {
        names.add(memberName);
      }
    }
  });
  return names;
}

function functionReturnsDynamicKeyMap(stmt) {
  if (!stmt || !stmt.body) {
    return false;
  }
  const body = Array.isArray(stmt.body) ? stmt.body : stmt.body.body;
  if (!Array.isArray(body)) {
    return false;
  }

  const localMapVars = new Set();
  for (const entry of body) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    if (entry.type === "LocalStatement") {
      const variables = Array.isArray(entry.variables) ? entry.variables : [];
      const init = Array.isArray(entry.init) ? entry.init : [];
      variables.forEach((variable, index) => {
        const varName = getIdentifierName(variable);
        const initExpr = init[index];
        if (varName && initExpr && initExpr.type === "TableConstructorExpression") {
          localMapVars.add(varName);
        }
      });
      continue;
    }
    if (entry.type === "AssignmentStatement") {
      const variables = Array.isArray(entry.variables) ? entry.variables : [];
      if (variables.some((variable) => (
        variable &&
        variable.type === "IndexExpression" &&
        variable.base &&
        variable.base.type === "Identifier" &&
        localMapVars.has(variable.base.name) &&
        variable.index &&
        variable.index.type !== "StringLiteral" &&
        variable.index.type !== "NumericLiteral" &&
        variable.index.type !== "BooleanLiteral"
      ))) {
        return true;
      }
      continue;
    }
    if (entry.type === "ForGenericStatement" || entry.type === "ForNumericStatement" || entry.type === "WhileStatement" || entry.type === "RepeatStatement" || entry.type === "IfStatement" || entry.type === "DoStatement") {
      const nestedBody = entry.body && entry.body.body ? entry.body.body : entry.body;
      if (functionReturnsDynamicKeyMap({ body: nestedBody })) {
        return true;
      }
    }
  }
  return false;
}

function collectExternalSchemaLocalNames(ast) {
  const names = new Set();
  const localTableVars = new Set();
  const functionParams = new Map();

  function visitDeep(value, visitor) {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => visitDeep(entry, visitor));
      return;
    }
    visitor(value);
    Object.keys(value).forEach((key) => {
      visitDeep(value[key], visitor);
    });
  }

  function getFunctionMeta(stmt) {
    if (!stmt || stmt.type !== "FunctionDeclaration") {
      return null;
    }
    if (stmt.name && stmt.name.type === "FunctionName") {
      const memberNode =
        stmt.name.method || (Array.isArray(stmt.name.members) ? stmt.name.members[stmt.name.members.length - 1] : null);
      return {
        fnName: getIdentifierName(memberNode) || getIdentifierName(stmt.name.base),
      };
    }
    if (stmt.isLocal) {
      return {
        fnName: getIdentifierName(stmt.name && stmt.name.base),
      };
    }
    return {
      fnName: getIdentifierName(stmt.identifier),
    };
  }

  visitDeep(ast, (node) => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "FunctionDeclaration") {
      const meta = getFunctionMeta(node);
      const fnName = meta && meta.fnName;
      if (!fnName) {
        return;
      }
      const params = (Array.isArray(node.parameters) ? node.parameters : [])
        .map((param) => getIdentifierName(param))
        .filter(Boolean);
      functionParams.set(fnName, params);
      return;
    }
    if (node.type !== "LocalStatement") {
      return;
    }
    const variables = Array.isArray(node.variables) ? node.variables : [];
    const init = Array.isArray(node.init) ? node.init : [];
    variables.forEach((variable, index) => {
      const varName = getIdentifierName(variable);
      const initExpr = init[index];
      if (varName && initExpr && initExpr.type === "TableConstructorExpression") {
        localTableVars.add(varName);
        if (EXTERNAL_SCHEMA_LOCAL_NAME.test(varName)) {
          names.add(varName);
        }
      }
    });
  });

  visitDeep(ast, (node) => {
    if (!node || !Array.isArray(node.arguments)) {
      return;
    }
    let fnName = null;
    if (node.type === "CallExpression" && node.base && node.base.type === "Identifier") {
      fnName = node.base.name;
    } else if (node.type === "MethodCallExpression" && node.method && node.method.type === "Identifier") {
      fnName = node.method.name;
    } else {
      return;
    }
    const params = functionParams.get(fnName);
    if (!params || !params.length) {
      return;
    }
    node.arguments.forEach((arg, index) => {
      if (
        index >= params.length ||
        !arg ||
        arg.type !== "Identifier" ||
        !localTableVars.has(arg.name) ||
        !EXTERNAL_SCHEMA_PARAM_NAME.test(params[index] || "")
      ) {
        return;
      }
      names.add(arg.name);
    });
  });

  return names;
}

function collectSafeFunctionParameterHints(ast) {
  const hints = new Map();
  const localTableVars = new Set();
  const functionParams = new Map();
  const constructorMembers = collectConstructorMemberHints(ast);
  const dynamicIndexBaseNames = collectDynamicIndexBaseNames(ast);
  const dynamicIndexRecordBaseNames = collectDynamicIndexRecordBaseNames(ast);
  const dynamicIndexRecordBaseMemberNames = collectDynamicIndexRecordBaseMemberNames(ast);
  const dynamicIndexRecordMemberNames = collectDynamicIndexRecordMemberNames(ast);
  const dynamicIndexMemberNames = collectDynamicIndexMemberNames(ast);
  const SAFE_CALLBACK_PARAM_NAME = /^(handler|callback|cb|fn|thunk|resolver)$/i;
  const SAFE_FUNCTION_EXPR_PARAM_NAME = /^(runtime|self|engine|ctx|context)$/i;

  function visitDeep(value, visitor) {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => visitDeep(entry, visitor));
      return;
    }
    visitor(value);
    Object.keys(value).forEach((key) => {
      visitDeep(value[key], visitor);
    });
  }

  function isConstructorCallExpr(expr) {
    if (!expr || typeof expr !== "object") {
      return false;
    }
    if (expr.type === "CallExpression") {
      return Boolean(
        expr.base &&
          expr.base.type === "MemberExpression" &&
          expr.base.base &&
          expr.base.base.type === "Identifier" &&
          expr.base.identifier &&
          expr.base.identifier.type === "Identifier" &&
          isKnownConstructorMember(expr.base.base.name, expr.base.identifier.name, { constructorMembers })
      );
    }
    if (expr.type === "MethodCallExpression") {
      return Boolean(
        expr.base &&
          expr.base.type === "Identifier" &&
          expr.method &&
          expr.method.type === "Identifier" &&
          isKnownConstructorMember(expr.base.name, expr.method.name, { constructorMembers })
      );
    }
    return false;
  }

  function isDynamicKeyMapAccessStatic(expr, safeVars = localTableVars) {
    if (!expr || typeof expr !== "object") {
      return false;
    }
    const exprPath = getMemberPath(expr);
    if (exprPath && dynamicIndexBaseNames.has(exprPath)) {
      return true;
    }
    if (expr.type === "IndexExpression") {
      if (
        expr.index &&
        expr.index.type !== "StringLiteral" &&
        expr.index.type !== "NumericLiteral" &&
        expr.index.type !== "BooleanLiteral"
      ) {
        return isSafeLocalTableExpr(expr.base, safeVars);
      }
      return isDynamicKeyMapAccessStatic(expr.base, safeVars);
    }
    if (expr.type === "MemberExpression") {
      if (
        expr.identifier &&
        expr.identifier.type === "Identifier" &&
        dynamicIndexMemberNames.has(expr.identifier.name) &&
        isSafeLocalTableExpr(expr.base, safeVars)
      ) {
        return true;
      }
      if (
        expr.identifier &&
        expr.identifier.type === "Identifier" &&
        dynamicIndexRecordBaseMemberNames.has(expr.identifier.name) &&
        isSafeLocalTableExpr(expr.base, safeVars)
      ) {
        return true;
      }
      return isDynamicKeyMapAccessStatic(expr.base, safeVars);
    }
    return false;
  }

  function isDynamicMapRecordAccessStatic(expr) {
    if (!expr || typeof expr !== "object") {
      return false;
    }
    if (
      expr.type === "MemberExpression" &&
      expr.identifier &&
      expr.identifier.type === "Identifier" &&
      dynamicIndexRecordMemberNames.has(expr.identifier.name) &&
      isSafeLocalTableExpr(expr.base)
    ) {
      return true;
    }
    if (expr.type === "MemberExpression" && isDynamicKeyMapAccessStatic(expr.base)) {
      const basePath = getMemberPath(expr.base);
      if (basePath && dynamicIndexRecordBaseNames.has(basePath)) {
        return true;
      }
      if (
        expr.base &&
        expr.base.type === "MemberExpression" &&
        expr.base.identifier &&
        expr.base.identifier.type === "Identifier" &&
        dynamicIndexRecordBaseMemberNames.has(expr.base.identifier.name) &&
        isSafeLocalTableExpr(expr.base.base)
      ) {
        return true;
      }
    }
    if (expr.type === "IndexExpression") {
      if (isDynamicMapRecordAccessStatic(expr.base)) {
        return true;
      }
      if (
        expr.base &&
        expr.base.type === "MemberExpression" &&
        expr.base.identifier &&
        expr.base.identifier.type === "Identifier" &&
        dynamicIndexRecordBaseMemberNames.has(expr.base.identifier.name) &&
        isSafeLocalTableExpr(expr.base.base)
      ) {
        return true;
      }
      const staticBasePath = getMemberPath(expr.base);
      if (staticBasePath && dynamicIndexRecordBaseNames.has(staticBasePath)) {
        return true;
      }
      if (
        expr.index &&
        expr.index.type !== "StringLiteral" &&
        expr.index.type !== "NumericLiteral" &&
        expr.index.type !== "BooleanLiteral"
      ) {
        const basePath = getMemberPath(expr.base);
        return Boolean(basePath && dynamicIndexRecordBaseNames.has(basePath));
      }
      return false;
    }
    if (expr.type === "MemberExpression") {
      return isDynamicMapRecordAccessStatic(expr.base);
    }
    return false;
  }

  function isSafeLocalTableExpr(expr, safeVars = localTableVars) {
    if (!expr || typeof expr !== "object") {
      return false;
    }
    if ((expr.type === "IndexExpression" || expr.type === "MemberExpression") && isDynamicMapRecordAccessStatic(expr)) {
      return true;
    }
    if (isDynamicKeyMapAccessStatic(expr, safeVars) && !isDynamicMapRecordAccessStatic(expr)) {
      return false;
    }
    switch (expr.type) {
      case "TableConstructorExpression":
        return true;
      case "Identifier":
        return safeVars.has(expr.name);
      case "MemberExpression":
      case "IndexExpression":
        return isSafeLocalTableExpr(expr.base, safeVars);
      case "CallExpression":
      case "MethodCallExpression":
        return isConstructorCallExpr(expr);
      case "GroupExpression":
        return isSafeLocalTableExpr(expr.expression, safeVars);
      default:
        return false;
    }
  }

  function isSafeArgumentExpr(expr, safeVars = localTableVars) {
    if (!expr || typeof expr !== "object") {
      return false;
    }
    if (isDynamicKeyMapAccessStatic(expr, safeVars) && !isDynamicMapRecordAccessStatic(expr)) {
      return false;
    }
    switch (expr.type) {
      case "Identifier":
        return safeVars.has(expr.name);
      case "MemberExpression":
      case "IndexExpression":
        return isSafeArgumentExpr(expr.base, safeVars) || isSafeLocalTableExpr(expr.base, safeVars);
      case "GroupExpression":
        return isSafeArgumentExpr(expr.expression, safeVars);
      default:
        return false;
    }
  }

  function getFunctionMeta(stmt) {
    if (!stmt || stmt.type !== "FunctionDeclaration") {
      return null;
    }
    if (stmt.name && stmt.name.type === "FunctionName") {
      const memberNode =
        stmt.name.method || (Array.isArray(stmt.name.members) ? stmt.name.members[stmt.name.members.length - 1] : null);
      return {
        fnName: getIdentifierName(memberNode) || getIdentifierName(stmt.name.base),
        ownerName: getIdentifierName(stmt.name.base),
        isMethod: Boolean(stmt.name.method || memberNode),
      };
    }
    if (stmt.isLocal) {
      return {
        fnName: getIdentifierName(stmt.name && stmt.name.base),
        ownerName: null,
        isMethod: false,
      };
    }
    return {
      fnName: getIdentifierName(stmt.identifier),
      ownerName: null,
      isMethod: false,
    };
  }

  visitDeep(ast, (node) => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "FunctionDeclaration") {
      const meta = getFunctionMeta(node);
      const fnName = meta && meta.fnName;
      if (!fnName) {
        return;
      }
      const params = (Array.isArray(node.parameters) ? node.parameters : [])
        .map((param) => getIdentifierName(param))
        .filter(Boolean);
      functionParams.set(fnName, params);
      return;
    }
    if (node.type !== "LocalStatement") {
      return;
    }
    const variables = Array.isArray(node.variables) ? node.variables : [];
    const init = Array.isArray(node.init) ? node.init : [];
    variables.forEach((variable, index) => {
      const varName = getIdentifierName(variable);
      if (
        varName &&
        isSafeLocalTableExpr(init[index]) &&
        (!isDynamicKeyMapAccessStatic(init[index]) || isDynamicMapRecordAccessStatic(init[index]))
      ) {
        localTableVars.add(varName);
      }
    });
  });

  visitDeep(ast, (node) => {
      if (!node || !Array.isArray(node.arguments)) {
        return;
      }
      let fnName = null;
      if (node.type === "CallExpression" && node.base && node.base.type === "Identifier") {
        fnName = node.base.name;
      } else if (node.type === "MethodCallExpression" && node.method && node.method.type === "Identifier") {
        fnName = node.method.name;
      } else {
        return;
      }
      const params = functionParams.get(fnName);
      if (!params || !params.length) {
        return;
      }
      const args = node.arguments;
      args.forEach((arg, index) => {
        if (index >= params.length) {
          return;
        }
        const paramName = params[index];
        const safeArg = isSafeArgumentExpr(arg);
        if (safeArg) {
          let safeIndexes = hints.get(fnName);
          if (!safeIndexes) {
            safeIndexes = new Set();
            hints.set(fnName, safeIndexes);
          }
          safeIndexes.add(index);
        }
        if (
          arg &&
          (arg.type === "FunctionExpression" || arg.type === "FunctionDeclaration") &&
          typeof arg === "object" &&
          (
            safeArg ||
            (typeof paramName === "string" && SAFE_CALLBACK_PARAM_NAME.test(paramName))
          )
        ) {
          if (!arg.__obf_safe_param_indexes) {
            arg.__obf_safe_param_indexes = new Set();
          }
          if (safeArg && Array.isArray(arg.parameters)) {
            for (let paramIndex = 0; paramIndex < arg.parameters.length; paramIndex += 1) {
              arg.__obf_safe_param_indexes.add(paramIndex);
            }
          } else if (Array.isArray(arg.parameters)) {
            arg.parameters.forEach((param, paramIndex) => {
              const nestedName = getIdentifierName(param);
              if (nestedName && SAFE_FUNCTION_EXPR_PARAM_NAME.test(nestedName)) {
                arg.__obf_safe_param_indexes.add(paramIndex);
              }
            });
          }
        }
      });
    });

  const topLevelBody = ast && Array.isArray(ast.body) ? ast.body : [];
  for (const stmt of topLevelBody) {
    const meta = getFunctionMeta(stmt);
    if (!meta || !meta.fnName || !meta.isMethod || !meta.ownerName || !constructorMembers.has(meta.ownerName)) {
      continue;
    }
    const safeVars = new Set(localTableVars);
    safeVars.add("self");
    visitDeep(stmt, (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node === stmt) {
        return;
      }
      if (node.type === "LocalStatement") {
        const variables = Array.isArray(node.variables) ? node.variables : [];
        const init = Array.isArray(node.init) ? node.init : [];
        variables.forEach((variable, index) => {
          const varName = getIdentifierName(variable);
          if (
            varName &&
            isSafeLocalTableExpr(init[index], safeVars) &&
            (!isDynamicKeyMapAccessStatic(init[index], safeVars) || isDynamicMapRecordAccessStatic(init[index]))
          ) {
            safeVars.add(varName);
          }
        });
        return;
      }
      if (!Array.isArray(node.arguments)) {
        return;
      }
      let fnName = null;
      if (node.type === "CallExpression" && node.base && node.base.type === "Identifier") {
        fnName = node.base.name;
      } else if (node.type === "MethodCallExpression" && node.method && node.method.type === "Identifier") {
        fnName = node.method.name;
      } else {
        return;
      }
      const params = functionParams.get(fnName);
      if (!params || !params.length) {
        return;
      }
      node.arguments.forEach((arg, index) => {
        if (index >= params.length || !isSafeArgumentExpr(arg, safeVars)) {
          return;
        }
        let safeIndexes = hints.get(fnName);
        if (!safeIndexes) {
          safeIndexes = new Set();
          hints.set(fnName, safeIndexes);
        }
        safeIndexes.add(index);
      });
    });
  }

  return hints;
}

function hasConstructorMemberHint(ownerName, memberName, ctx) {
  if (!ctx || !ctx.constructorMemberHints || typeof ownerName !== "string" || typeof memberName !== "string") {
    return false;
  }
  const members = ctx.constructorMemberHints.get(ownerName);
  return Boolean(members && members.has(memberName));
}

function renameIdentifier(node, scope, ctx) {
  if (!node || node.type !== "Identifier") {
    return;
  }
  const mapped = resolveName(scope, node.name);
  if (mapped) {
    node.name = mapped;
    return;
  }
  if (ctx.renameGlobals && ctx.globals && ctx.globalDeclared && ctx.globalDeclared.has(node.name)) {
    node.name = defineGlobal(node.name, ctx);
  }
}

function renameMemberName(node, ctx) {
  if (!ctx.renameMembers || !node) {
    return;
  }
  const name = node.name;
  if (typeof name !== "string") {
    return;
  }
  if (name.startsWith(LUA_METAMETHOD_PREFIX)) {
    return;
  }
  let mapped = ctx.memberMap.get(name);
  if (!mapped) {
    mapped = defineMember(name, ctx);
  }
  if (ctx.dynamicIndexMemberNames && ctx.dynamicIndexMemberNames.has(name)) {
    ctx.dynamicIndexMemberNames.add(mapped);
  }
  if (ctx.dynamicIndexRecordMemberNames && ctx.dynamicIndexRecordMemberNames.has(name)) {
    ctx.dynamicIndexRecordMemberNames.add(mapped);
  }
  if (ctx.dynamicIndexRecordBaseMemberNames && ctx.dynamicIndexRecordBaseMemberNames.has(name)) {
    ctx.dynamicIndexRecordBaseMemberNames.add(mapped);
  }
  node.name = mapped;
}

function isDefinitelyLocalTable(expr, scope, ctx) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if ((expr.type === "IndexExpression" || expr.type === "MemberExpression") && isDynamicMapRecordAccess(expr, scope, ctx)) {
    return true;
  }
  switch (expr.type) {
    case "TableConstructorExpression":
      return true;
    case "GroupExpression":
      return isDefinitelyLocalTable(expr.expression, scope, ctx);
    case "Identifier":
      return resolveMemberSafety(scope, expr.name);
    case "CallExpression":
      if (
        expr.base &&
        expr.base.type === "MemberExpression" &&
        expr.base.base &&
        expr.base.base.type === "Identifier" &&
        expr.base.identifier &&
        expr.base.identifier.type === "Identifier"
      ) {
        const memberName = expr.base.identifier.name;
        if (ctx.dynamicMapFunctionNames && ctx.dynamicMapFunctionNames.has(memberName)) {
          return false;
        }
        return isKnownConstructorMember(expr.base.base.name, expr.base.identifier.name, ctx);
      }
      return false;
    case "MemberExpression":
      return isDefinitelyLocalTable(expr.base, scope, ctx);
    case "IndexExpression":
      return isDefinitelyLocalTable(expr.base, scope, ctx);
    case "IfExpression":
      if (!Array.isArray(expr.clauses) || !expr.clauses.length) {
        return false;
      }
      if (!isDefinitelyLocalTable(expr.elseValue, scope, ctx)) {
        return false;
      }
      return expr.clauses.every((clause) => isDefinitelyLocalTable(clause.value, scope, ctx));
    default:
      return false;
  }
}

function isDynamicMapRecordAccess(expr, scope, ctx) {
  if (!expr || typeof expr !== "object" || !ctx || !ctx.dynamicIndexRecordBaseNames) {
    return false;
  }
  if (
    expr.type === "MemberExpression" &&
    expr.identifier &&
    expr.identifier.type === "Identifier" &&
    ctx.dynamicIndexRecordMemberNames &&
    ctx.dynamicIndexRecordMemberNames.has(expr.identifier.name) &&
    isDefinitelyLocalTable(expr.base, scope, ctx)
  ) {
    return true;
  }
  if (expr.type === "MemberExpression" && isDynamicKeyMapAccess(expr.base, scope, ctx)) {
    const basePath = getMemberPath(expr.base);
    if (basePath && ctx.dynamicIndexRecordBaseNames.has(basePath)) {
      return true;
    }
    if (
      expr.base &&
      expr.base.type === "MemberExpression" &&
      expr.base.identifier &&
      expr.base.identifier.type === "Identifier" &&
      ctx.dynamicIndexRecordBaseMemberNames &&
      ctx.dynamicIndexRecordBaseMemberNames.has(expr.base.identifier.name) &&
      isDefinitelyLocalTable(expr.base.base, scope, ctx)
    ) {
      return true;
    }
  }
  if (expr.type === "IndexExpression") {
    if (isDynamicMapRecordAccess(expr.base, scope, ctx)) {
      return true;
    }
    if (
      expr.base &&
      expr.base.type === "MemberExpression" &&
      expr.base.identifier &&
      expr.base.identifier.type === "Identifier" &&
      ctx.dynamicIndexRecordBaseMemberNames &&
      ctx.dynamicIndexRecordBaseMemberNames.has(expr.base.identifier.name) &&
      isDefinitelyLocalTable(expr.base.base, scope, ctx)
    ) {
      return true;
    }
    const basePath = getMemberPath(expr.base);
    if (basePath && ctx.dynamicIndexRecordBaseNames.has(basePath)) {
      return true;
    }
    if (
      expr.index &&
      expr.index.type !== "StringLiteral" &&
      expr.index.type !== "NumericLiteral" &&
      expr.index.type !== "BooleanLiteral"
    ) {
      return Boolean(basePath && ctx.dynamicIndexRecordBaseNames.has(basePath));
    }
    return false;
  }
  if (expr.type === "MemberExpression") {
    return isDynamicMapRecordAccess(expr.base, scope, ctx);
  }
  return false;
}

function markLocalMemberSafety(scope, originalName, mappedName, safe) {
  if (!scope || !originalName) {
    return;
  }
  scope.memberSafe.set(originalName, Boolean(safe));
  if (mappedName) {
    scope.memberSafe.set(mappedName, Boolean(safe));
  }
}

function updateMemberSafetyFromAssignment(variable, value, scope, ctx) {
  if (!variable || variable.type !== "Identifier") {
    return;
  }
  const bindingScope = resolveBindingScope(scope, variable.name);
  if (!bindingScope) {
    return;
  }
  const mappedName = bindingScope.bindings.get(variable.name) || variable.name;
  const safe = isDefinitelyLocalTable(value, scope, ctx);
  markLocalMemberSafety(bindingScope, variable.name, mappedName, safe);
}

function shouldSkipMemberRename(base, scope, ctx) {
  if (isBuiltinLibBase(base, scope, ctx)) {
    traceRename(ctx, {
      kind: "skip-member-rename",
      reason: "builtin-lib-base",
      baseType: base && base.type ? base.type : null,
      basePath: getMemberPath(base),
    });
    return true;
  }
  if (isDynamicKeyMapAccess(base, scope, ctx) && !isDynamicMapRecordAccess(base, scope, ctx)) {
    traceRename(ctx, {
      kind: "skip-member-rename",
      reason: "dynamic-key-map-access",
      baseType: base && base.type ? base.type : null,
      basePath: getMemberPath(base),
    });
    return true;
  }
  if (!isDefinitelyLocalTable(base, scope, ctx)) {
    traceRename(ctx, {
      kind: "skip-member-rename",
      reason: "non-local-table-base",
      baseType: base && base.type ? base.type : null,
      basePath: getMemberPath(base),
    });
    return true;
  }
  return false;
}

function renameExpression(expr, scope, ctx, allowTableFieldRename = false) {
  if (!expr || typeof expr !== "object") {
    return;
  }
  switch (expr.type) {
    case "Identifier":
      renameIdentifier(expr, scope, ctx);
      return;
    case "BinaryExpression":
    case "LogicalExpression":
      renameExpression(expr.left, scope, ctx);
      renameExpression(expr.right, scope, ctx);
      return;
    case "UnaryExpression":
      renameExpression(expr.argument, scope, ctx);
      return;
    case "GroupExpression":
      renameExpression(expr.expression, scope, ctx);
      return;
    case "IndexExpression":
      renameExpression(expr.base, scope, ctx);
      renameExpression(expr.index, scope, ctx);
      return;
    case "MemberExpression":
      const skipMemberRename = shouldSkipMemberRename(expr.base, scope, ctx);
      renameExpression(expr.base, scope, ctx);
      if (!skipMemberRename) {
        renameMemberName(expr.identifier, ctx);
      }
      return;
    case "CallExpression":
      renameExpression(expr.base, scope, ctx);
      expr.arguments.forEach((arg) => renameExpression(arg, scope, ctx));
      return;
    case "MethodCallExpression":
      const skipMethodRename = shouldSkipMemberRename(expr.base, scope, ctx);
      renameExpression(expr.base, scope, ctx);
      if (!skipMethodRename) {
        renameMemberName(expr.method, ctx);
      }
      expr.arguments.forEach((arg) => renameExpression(arg, scope, ctx));
      return;
    case "TableCallExpression":
      renameExpression(expr.base, scope, ctx);
      renameExpression(expr.arguments, scope, ctx);
      return;
    case "StringCallExpression":
      renameExpression(expr.base, scope, ctx);
      renameExpression(expr.argument, scope, ctx);
      return;
    case "FunctionDeclaration":
      renameFunctionExpression(expr, scope, ctx);
      return;
    case "FunctionExpression":
      renameFunctionExpression(expr, scope, ctx);
      return;
    case "TableConstructorExpression":
      expr.fields.forEach((field) => renameTableField(field, scope, ctx, allowTableFieldRename));
      return;
    case "IfExpression":
      expr.clauses.forEach((clause) => {
        renameExpression(clause.condition, scope, ctx);
        renameExpression(clause.value, scope, ctx, allowTableFieldRename);
      });
      renameExpression(expr.elseValue, scope, ctx, allowTableFieldRename);
      return;
    case "TypeAssertion":
      renameExpression(expr.expression, scope, ctx, allowTableFieldRename);
      return;
    case "InterpolatedString":
      if (expr.parts && Array.isArray(expr.parts)) {
        expr.parts.forEach((part) => {
          if (part && part.type === "InterpolatedStringText") {
            return;
          }
          renameExpression(part, scope, ctx, allowTableFieldRename);
        });
      }
      return;
    case "TableKey":
      renameExpression(expr.key, scope, ctx);
      renameExpression(expr.value, scope, ctx, allowTableFieldRename);
      return;
    case "TableValue":
      renameExpression(expr.value, scope, ctx, allowTableFieldRename);
      return;
    case "TableKeyString":
      if (allowTableFieldRename && expr.key && expr.key.type === "Identifier") {
        renameMemberName(expr.key, ctx);
      }
      renameExpression(expr.value, scope, ctx, allowTableFieldRename);
      return;
    default:
      return;
  }
}

function renameTableField(field, scope, ctx, allowTableFieldRename = false) {
  if (!field || typeof field !== "object") {
    return;
  }
  if (field.type === "TableKey" || field.type === "TableKeyString" || field.type === "TableValue") {
    renameExpression(field, scope, ctx, allowTableFieldRename);
    return;
  }
  if (field.kind === "index") {
    renameExpression(field.key, scope, ctx);
    renameExpression(field.value, scope, ctx, allowTableFieldRename);
    return;
  }
  if (field.kind === "name") {
    if (allowTableFieldRename && field.name && field.name.type === "Identifier") {
      renameMemberName(field.name, ctx);
    }
    renameExpression(field.value, scope, ctx, allowTableFieldRename);
    return;
  }
  if (field.kind === "list") {
    renameExpression(field.value, scope, ctx, allowTableFieldRename);
  }
}

function shouldRenameTableFieldsForTarget(target, scope, ctx) {
  if (!target || typeof target !== "object") {
    return false;
  }
  if (isDynamicKeyMapAccess(target, scope, ctx)) {
    return false;
  }
  if (target.type === "Identifier") {
    if (ctx.dynamicIndexBaseNames && ctx.dynamicIndexBaseNames.has(target.name)) {
      return false;
    }
    if (ctx.externalSchemaLocalNames && ctx.externalSchemaLocalNames.has(target.name)) {
      return false;
    }
    return Boolean(resolveBindingScope(scope, target.name));
  }
  if (target.type === "MemberExpression" || target.type === "IndexExpression") {
    return isDefinitelyLocalTable(target.base, scope, ctx);
  }
  return false;
}

function shouldRenameLocalTableInitializer(variable, expr, scope, ctx) {
  if (!variable || variable.type !== "Identifier") {
    return false;
  }
  if (ctx.externalSchemaLocalNames && ctx.externalSchemaLocalNames.has(variable.name)) {
    return false;
  }
  if (ctx.dynamicIndexBaseNames && ctx.dynamicIndexBaseNames.has(variable.name)) {
    return false;
  }
  return isDefinitelyLocalTable(expr, scope, ctx);
}

function shouldRenameAssignedValueFieldsForTarget(target, value, scope, ctx) {
  if (shouldRenameTableFieldsForTarget(target, scope, ctx)) {
    return true;
  }
  if (isDynamicKeyMapAccess(target, scope, ctx) && isDefinitelyLocalTable(value, scope, ctx)) {
    return true;
  }
  return false;
}

function isDynamicMapAliasInitializer(expr, scope, ctx) {
  return isDynamicKeyMapAccess(expr, scope, ctx) && !isDynamicMapRecordAccess(expr, scope, ctx);
}

function renameStatementList(body, scope, ctx) {
  for (const stmt of body) {
    renameStatement(stmt, scope, ctx);
  }
}

function renameStatement(stmt, scope, ctx) {
  if (!stmt || typeof stmt !== "object") {
    return;
  }
  switch (stmt.type) {
    case "LocalStatement": {
      if (stmt.init && stmt.init.length) {
        stmt.init.forEach((expr, index) => {
          const variable = Array.isArray(stmt.variables) ? stmt.variables[index] : null;
          const allowTableFieldRename =
            shouldRenameLocalTableInitializer(variable, expr, scope, ctx) ||
            shouldRenameTableFieldsForTarget(variable, scope, ctx);
          renameExpression(expr, scope, ctx, allowTableFieldRename);
        });
      }
      stmt.variables.forEach((variable, index) => {
        if (!variable || variable.type !== "Identifier") {
          return;
        }
        const originalName = variable.name;
        const initExpr = Array.isArray(stmt.init) ? stmt.init[index] : null;
        const safe = !(ctx.externalSchemaLocalNames && ctx.externalSchemaLocalNames.has(originalName))
          && !isDynamicMapAliasInitializer(initExpr, scope, ctx)
          && isDefinitelyLocalTable(initExpr, scope, ctx);
        const newName = defineName(scope, originalName, ctx);
        markLocalMemberSafety(scope, originalName, newName, safe);
        variable.name = newName;
      });
      return;
    }
    case "AssignmentStatement":
      stmt.variables.forEach((variable, index) => {
        const value = Array.isArray(stmt.init) ? stmt.init[index] : null;
        updateMemberSafetyFromAssignment(variable, value, scope, ctx);
      });
      stmt.variables.forEach((variable) => renameExpression(variable, scope, ctx));
      stmt.init.forEach((expr, index) => {
        const variable = Array.isArray(stmt.variables) ? stmt.variables[index] : null;
        const allowTableFieldRename = shouldRenameAssignedValueFieldsForTarget(variable, expr, scope, ctx);
        renameExpression(expr, scope, ctx, allowTableFieldRename);
      });
      return;
    case "CompoundAssignmentStatement":
      renameExpression(stmt.variable, scope, ctx);
      renameExpression(stmt.value, scope, ctx);
      return;
    case "CallStatement":
      renameExpression(stmt.expression, scope, ctx);
      return;
    case "ReturnStatement":
      stmt.arguments.forEach((expr) => renameExpression(expr, scope, ctx));
      return;
    case "FunctionDeclaration":
      renameFunctionDeclaration(stmt, scope, ctx);
      return;
    case "BreakStatement":
    case "ContinueStatement":
      return;
    case "WhileStatement":
      renameExpression(stmt.condition, scope, ctx);
      renameScopedBody(stmt.body, scope, ctx);
      return;
    case "RepeatStatement": {
      const repeatScope = createScope(scope);
      const body = stmt.body || [];
      if (Array.isArray(body)) {
        renameStatementList(body, repeatScope, ctx);
      } else if (body && body.body) {
        renameStatementList(body.body, repeatScope, ctx);
      }
      renameExpression(stmt.condition, repeatScope, ctx);
      return;
    }
    case "ForNumericStatement": {
      renameExpression(stmt.start, scope, ctx);
      renameExpression(stmt.end, scope, ctx);
      if (stmt.step) {
        renameExpression(stmt.step, scope, ctx);
      }
      const loopScope = createScope(scope);
      if (stmt.variable && stmt.variable.type === "Identifier") {
        const originalName = stmt.variable.name;
        const newName = defineName(loopScope, originalName, ctx);
        markLocalMemberSafety(loopScope, originalName, newName, false);
        stmt.variable.name = newName;
      }
      renameScopedBody(stmt.body, loopScope, ctx);
      return;
    }
    case "ForGenericStatement": {
      stmt.iterators.forEach((expr) => renameExpression(expr, scope, ctx));
      const loopScope = createScope(scope);
      stmt.variables.forEach((variable) => {
        if (!variable || variable.type !== "Identifier") {
          return;
        }
        const originalName = variable.name;
        const newName = defineName(loopScope, originalName, ctx);
        markLocalMemberSafety(loopScope, originalName, newName, false);
        variable.name = newName;
      });
      renameScopedBody(stmt.body, loopScope, ctx);
      return;
    }
    case "DoStatement":
      renameScopedBody(stmt.body, scope, ctx);
      return;
    case "IfStatement":
      renameIfStatement(stmt, scope, ctx);
      return;
    case "LabelStatement":
    case "GotoStatement":
    case "TypeAliasStatement":
    case "ExportTypeStatement":
    case "TypeFunctionStatement":
    case "ExportTypeFunctionStatement":
      return;
    default:
      return;
  }
}

function renameScopedBody(body, parentScope, ctx) {
  const scope = createScope(parentScope);
  if (Array.isArray(body)) {
    renameStatementList(body, scope, ctx);
    return;
  }
  if (body && Array.isArray(body.body)) {
    renameStatementList(body.body, scope, ctx);
  }
}

function renameFunctionDeclaration(stmt, scope, ctx) {
  let isLocal = Boolean(stmt.isLocal);
  let fnId = null;
  let fnMember = null;
  let fnOriginalName = null;

  if (stmt.name && stmt.name.type === "FunctionName") {
    if (stmt.isLocal && stmt.name.base && stmt.name.base.type === "Identifier") {
      fnId = stmt.name.base;
    } else {
      isLocal = false;
      fnMember = stmt.name;
    }
  } else if (stmt.identifier && stmt.identifier.type === "Identifier") {
    fnId = stmt.identifier;
  } else if (stmt.identifier && stmt.identifier.type === "MemberExpression") {
    isLocal = false;
    fnMember = stmt.identifier;
  }

  if (isLocal && fnId) {
    const originalName = fnId.name;
    fnOriginalName = originalName;
    const newName = defineName(scope, originalName, ctx);
    markLocalMemberSafety(scope, originalName, newName, false);
    fnId.name = newName;
  } else if (!isLocal && fnId && ctx.renameGlobals && ctx.globalDeclared.has(fnId.name)) {
    fnId.name = defineGlobal(fnId.name, ctx);
  } else if (!isLocal && fnId) {
    fnOriginalName = fnId.name;
  }

  if (fnMember) {
    if (fnMember.type === "FunctionName") {
      const ownerOriginalName = getIdentifierName(fnMember.base);
      const constructorMemberNode = fnMember.method || (Array.isArray(fnMember.members) ? fnMember.members[fnMember.members.length - 1] : null);
      const constructorMemberOriginalName = getIdentifierName(constructorMemberNode);
      fnOriginalName = constructorMemberOriginalName;
      const returnsLocalTableLike = ownerOriginalName
        ? hasConstructorMemberHint(ownerOriginalName, constructorMemberOriginalName, ctx) || functionReturnsLocalTableLike(stmt, ownerOriginalName)
        : false;
      const skipMemberRename = shouldSkipMemberRename(fnMember.base, scope, ctx);
      renameIdentifier(fnMember.base, scope, ctx);
      if (ctx.renameMembers && Array.isArray(fnMember.members) && !skipMemberRename) {
        fnMember.members.forEach((member) => renameMemberName(member, ctx));
      }
      if (ctx.renameMembers && fnMember.method && !skipMemberRename) {
        renameMemberName(fnMember.method, ctx);
      }
      if (returnsLocalTableLike && constructorMemberOriginalName) {
        registerConstructorMember(
          ctx,
          [ownerOriginalName, getIdentifierName(fnMember.base)],
          [constructorMemberOriginalName, getIdentifierName(constructorMemberNode)]
        );
      }
    } else if (fnMember.type === "MemberExpression") {
      const skipMemberRename = shouldSkipMemberRename(fnMember.base, scope, ctx);
      renameExpression(fnMember.base, scope, ctx);
      if (!skipMemberRename) {
        renameMemberName(fnMember.identifier, ctx);
      }
    }
  }

  const fnScope = createScope(scope);
    if (fnMember && fnMember.type === "FunctionName" && fnMember.method) {
      const skipImplicitSelfMemberRename = shouldSkipMemberRename(fnMember.base, scope, ctx);
      if (!skipImplicitSelfMemberRename) {
        markLocalMemberSafety(fnScope, "self", "self", true);
      }
    }
  if (stmt.parameters && stmt.parameters.length) {
    const safeParameterIndexes =
      fnOriginalName && ctx.safeFunctionParameterHints
        ? ctx.safeFunctionParameterHints.get(fnOriginalName) || null
        : null;
    stmt.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        const originalName = param.name;
        const newName = defineName(fnScope, originalName, ctx);
        const safe = Boolean(safeParameterIndexes && safeParameterIndexes.has(Array.isArray(stmt.parameters) ? stmt.parameters.indexOf(param) : -1));
        markLocalMemberSafety(fnScope, originalName, newName, safe);
        param.name = newName;
      }
    });
  }
  if (stmt.body) {
    if (Array.isArray(stmt.body)) {
      renameStatementList(stmt.body, fnScope, ctx);
    } else if (stmt.body.body && Array.isArray(stmt.body.body)) {
      renameStatementList(stmt.body.body, fnScope, ctx);
    }
  }
}

function renameFunctionExpression(expr, scope, ctx) {
  const fnScope = createScope(scope);
  if (expr.parameters && expr.parameters.length) {
    const safeParameterIndexes = expr.__obf_safe_param_indexes || null;
    expr.parameters.forEach((param, index) => {
      if (param && param.type === "Identifier") {
        const originalName = param.name;
        const newName = defineName(fnScope, originalName, ctx);
        const safe = Boolean(safeParameterIndexes && safeParameterIndexes.has(index));
        markLocalMemberSafety(fnScope, originalName, newName, safe);
        param.name = newName;
      }
    });
  }
  if (expr.body) {
    if (Array.isArray(expr.body)) {
      renameStatementList(expr.body, fnScope, ctx);
    } else if (expr.body.body && Array.isArray(expr.body.body)) {
      renameStatementList(expr.body.body, fnScope, ctx);
    }
  }
}

function renameIfStatement(stmt, scope, ctx) {
  if (!stmt.clauses || !stmt.clauses.length) {
    return;
  }
  const firstClause = stmt.clauses[0];
  if (firstClause && typeof firstClause.type === "string") {
    stmt.clauses.forEach((clause) => {
      if (clause.type !== "ElseClause") {
        renameExpression(clause.condition, scope, ctx);
      }
      const clauseScope = createScope(scope);
      renameStatementList(clause.body, clauseScope, ctx);
    });
    return;
  }
  stmt.clauses.forEach((clause) => {
    renameExpression(clause.condition, scope, ctx);
    const clauseScope = createScope(scope);
    if (clause.body && clause.body.body) {
      renameStatementList(clause.body.body, clauseScope, ctx);
    }
  });
  if (stmt.elseBody) {
    const elseScope = createScope(scope);
    if (stmt.elseBody.body) {
      renameStatementList(stmt.elseBody.body, elseScope, ctx);
    }
  }
}

function renameLuau(ast, ctx) {
  const userReserved = ctx.options.renameOptions?.reserved || [];
  const reserved = new Set([...LUA_KEYWORDS, ...LUA_RESERVED_GLOBALS, ...userReserved]);
  const used = collectIdentifiers(ast);
  const readNames =
    ctx && typeof ctx.getSSA === "function"
      ? collectSSAReadNamesFromRoot(ctx.getSSA())
      : null;
  const useHomoglyphs = Boolean(ctx.options.renameOptions?.homoglyphs);
  const alphabets = useHomoglyphs
    ? { first: "lI", rest: "lI1" }
    : null;
  const generator = new LuaNameGenerator({
    rng: ctx.rng,
    reserved: [...reserved, ...used],
    alphabets,
  });
  const renameGlobals = Boolean(ctx.options.renameOptions?.renameGlobals);
  const renameMembers = Boolean(ctx.options.renameOptions?.renameMembers);
  const globalDeclared = renameGlobals ? collectGlobalBindings(ast) : new Set();
  const envAliasName = ast && typeof ast.__obf_env_alias_name === "string" ? ast.__obf_env_alias_name : null;
  const dynamicIndexBaseNames = ctx.dynamicIndexBaseNames || collectDynamicIndexBaseNames(ast);
  const dynamicIndexRecordBaseNames = ctx.dynamicIndexRecordBaseNames || collectDynamicIndexRecordBaseNames(ast);
  const dynamicIndexRecordBaseMemberNames =
    ctx.dynamicIndexRecordBaseMemberNames || collectDynamicIndexRecordBaseMemberNames(ast);
  const dynamicIndexRecordMemberNames = ctx.dynamicIndexRecordMemberNames || collectDynamicIndexRecordMemberNames(ast);
  const dynamicIndexMemberNames = ctx.dynamicIndexMemberNames || collectDynamicIndexMemberNames(ast);
  const externalSchemaLocalNames = ctx.externalSchemaLocalNames || collectExternalSchemaLocalNames(ast);
  const dynamicMapFunctionNames = new Set();
  const rootBody = ast && Array.isArray(ast.body) ? ast.body : [];
  rootBody.forEach((stmt) => {
    if (!stmt || stmt.type !== "FunctionDeclaration") {
      return;
    }
    if (!functionReturnsDynamicKeyMap(stmt)) {
      return;
    }
    let fnName = null;
    if (stmt.name && stmt.name.type === "FunctionName") {
      fnName = getIdentifierName(
        stmt.name.method || (Array.isArray(stmt.name.members) ? stmt.name.members[stmt.name.members.length - 1] : stmt.name.base)
      );
    } else if (stmt.identifier && stmt.identifier.type === "Identifier") {
      fnName = stmt.identifier.name;
    }
    if (fnName) {
      dynamicMapFunctionNames.add(fnName);
    }
  });
  const safeFunctionParameterHints = ctx.safeFunctionParameterHints || collectSafeFunctionParameterHints(ast);
  const state = {
    generator,
    reserved,
    used: new Set(used),
    globals: new Map(),
    globalDeclared,
    renameGlobals,
    renameMembers,
    memberMap: new Map(),
    constructorMembers: new Map(),
    dynamicIndexBaseNames,
    dynamicIndexRecordBaseNames,
    dynamicIndexRecordBaseMemberNames,
    dynamicIndexRecordMemberNames,
    dynamicIndexMemberNames,
    externalSchemaLocalNames,
    dynamicMapFunctionNames,
    safeFunctionParameterHints,
    readNames,
    envAliasName,
    debugTrace: ctx.debugTrace,
  };
  const rootScope = createScope(null);
  if (Array.isArray(ast.body)) {
    renameStatementList(ast.body, rootScope, state);
  }
}

module.exports = {
  collectConstructorMemberHints,
  collectDynamicIndexBaseNames,
  collectDynamicIndexRecordBaseNames,
  collectDynamicIndexRecordBaseMemberNames,
  collectDynamicIndexRecordMemberNames,
  collectDynamicIndexMemberNames,
  collectExternalSchemaLocalNames,
  collectSafeFunctionParameterHints,
  renameLuau,
};
