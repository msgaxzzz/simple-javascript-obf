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
  return { parent, bindings: new Map() };
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

function defineName(scope, name, ctx) {
  if (ctx && ctx.readNames && !ctx.readNames.has(name)) {
    scope.bindings.set(name, name);
    return name;
  }
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
  if (ctx && ctx.readNames && !ctx.readNames.has(name)) {
    ctx.globals.set(name, name);
    return name;
  }
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
  let mapped = ctx.memberMap.get(name);
  if (!mapped) {
    mapped = defineMember(name, ctx);
  }
  node.name = mapped;
}

function renameExpression(expr, scope, ctx) {
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
      const skipMemberRename = isBuiltinLibBase(expr.base, scope, ctx);
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
      const skipMethodRename = isBuiltinLibBase(expr.base, scope, ctx);
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
      expr.fields.forEach((field) => renameTableField(field, scope, ctx));
      return;
    case "IfExpression":
      expr.clauses.forEach((clause) => {
        renameExpression(clause.condition, scope, ctx);
        renameExpression(clause.value, scope, ctx);
      });
      renameExpression(expr.elseValue, scope, ctx);
      return;
    case "TypeAssertion":
      renameExpression(expr.expression, scope, ctx);
      return;
    case "InterpolatedString":
      if (expr.parts && Array.isArray(expr.parts)) {
        expr.parts.forEach((part) => {
          if (part && part.type === "InterpolatedStringText") {
            return;
          }
          renameExpression(part, scope, ctx);
        });
      }
      return;
    case "TableKey":
      renameExpression(expr.key, scope, ctx);
      renameExpression(expr.value, scope, ctx);
      return;
    case "TableValue":
      renameExpression(expr.value, scope, ctx);
      return;
    case "TableKeyString":
      if (expr.key && expr.key.type === "Identifier") {
        renameMemberName(expr.key, ctx);
      }
      renameExpression(expr.value, scope, ctx);
      return;
    default:
      return;
  }
}

function renameTableField(field, scope, ctx) {
  if (!field || typeof field !== "object") {
    return;
  }
  if (field.type === "TableKey" || field.type === "TableKeyString" || field.type === "TableValue") {
    renameExpression(field, scope, ctx);
    return;
  }
  if (field.kind === "index") {
    renameExpression(field.key, scope, ctx);
    renameExpression(field.value, scope, ctx);
    return;
  }
  if (field.kind === "name") {
    if (field.name && field.name.type === "Identifier") {
      renameMemberName(field.name, ctx);
    }
    renameExpression(field.value, scope, ctx);
    return;
  }
  if (field.kind === "list") {
    renameExpression(field.value, scope, ctx);
  }
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
        stmt.init.forEach((expr) => renameExpression(expr, scope, ctx));
      }
      stmt.variables.forEach((variable) => {
        if (!variable || variable.type !== "Identifier") {
          return;
        }
        const newName = defineName(scope, variable.name, ctx);
        variable.name = newName;
      });
      return;
    }
    case "AssignmentStatement":
      stmt.variables.forEach((variable) => renameExpression(variable, scope, ctx));
      stmt.init.forEach((expr) => renameExpression(expr, scope, ctx));
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
        const newName = defineName(loopScope, stmt.variable.name, ctx);
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
        const newName = defineName(loopScope, variable.name, ctx);
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
    const newName = defineName(scope, fnId.name, ctx);
    fnId.name = newName;
  } else if (!isLocal && fnId && ctx.renameGlobals && ctx.globalDeclared.has(fnId.name)) {
    fnId.name = defineGlobal(fnId.name, ctx);
  }

  if (fnMember) {
    if (fnMember.type === "FunctionName") {
      const skipMemberRename = isBuiltinLibBase(fnMember.base, scope, ctx);
      renameIdentifier(fnMember.base, scope, ctx);
      if (ctx.renameMembers && Array.isArray(fnMember.members) && !skipMemberRename) {
        fnMember.members.forEach((member) => renameMemberName(member, ctx));
      }
      if (ctx.renameMembers && fnMember.method && !skipMemberRename) {
        renameMemberName(fnMember.method, ctx);
      }
    } else if (fnMember.type === "MemberExpression") {
      const skipMemberRename = isBuiltinLibBase(fnMember.base, scope, ctx);
      renameExpression(fnMember.base, scope, ctx);
      if (!skipMemberRename) {
        renameMemberName(fnMember.identifier, ctx);
      }
    }
  }

  const fnScope = createScope(scope);
  if (stmt.parameters && stmt.parameters.length) {
    stmt.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        const newName = defineName(fnScope, param.name, ctx);
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
    expr.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        const newName = defineName(fnScope, param.name, ctx);
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
  const state = {
    generator,
    reserved,
    used: new Set(used),
    globals: new Map(),
    globalDeclared,
    renameGlobals,
    renameMembers,
    memberMap: new Map(),
    readNames,
    envAliasName,
  };
  const rootScope = createScope(null);
  if (Array.isArray(ast.body)) {
    renameStatementList(ast.body, rootScope, state);
  }
}

module.exports = {
  renameLuau,
};
