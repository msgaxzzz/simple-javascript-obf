const { insertAtTop, walk } = require("./ast");
const { getCachedSSAUsedNamesFromRoot } = require("./ssa-utils").default;

const BASE_RESERVED = new Set(["_ENV", "_G"]);
const NAME_RESERVED = new Set(["_ENV", "_G", "type", "getfenv", "shared"]);
const KNOWN_GLOBAL_API_ROOTS = new Set([
  "game",
  "workspace",
  "script",
  "task",
  "string",
  "table",
  "math",
  "bit32",
  "utf8",
  "os",
  "coroutine",
  "debug",
  "require",
]);
const COMMON_MASKED_MEMBER_NAMES = new Set([
  // Core Output & Debug
  "print",
  "warn",
  "error",
  "assert",
  "info",
  "traceback",
  "profilebegin",
  "profileend",

  // String Methods
  "char",
  "byte",
  "find",
  "sub",
  "gsub",
  "rep",
  "format",
  "match",
  "gmatch",
  "lower",
  "upper",
  "len",
  "split",
  "reverse",

  // Table Methods
  "concat",
  "pack",
  "unpack",
  "insert",
  "remove",
  "move",
  "sort",
  "clear",
  "create",
  "freeze",
  "isfrozen",
  "clone",

  // Math Methods
  "floor",
  "ceil",
  "round",
  "clamp",
  "abs",
  "min",
  "max",
  "sqrt",
  "sin",
  "cos",
  "tan",
  "atan2",
  "rad",
  "deg",
  "exp",
  "log",
  "random",
  "randomseed",
  "huge",
  "pi",

  // Bit32 Methods
  "band",
  "bor",
  "bxor",
  "bnot",
  "lshift",
  "rshift",
  "arshift",
  "rol",
  "ror",
  "btest",
  "extract",
  "replace",

  // Task & Async (Roblox)
  "spawn",
  "defer",
  "delay",
  "wait",
  "cancel",

  // OS & UTF8
  "clock",
  "time",
  "difftime",
  "date",
  "codepoint",
  "codes",
  "offset",
  "nfdnormalize",
  "nfcnormalize",

  // Roblox Engine Common Service Methods
  "GetService",
  "FindFirstChild",
  "FindFirstChildOfClass",
  "FindFirstChildWhichIsA",
  "GetChildren",
  "GetDescendants",
  "GetAttribute",
  "SetAttribute",
  "GetPropertyChangedSignal",
  "IsA",
  "FindFirstAncestor",
  "FindFirstAncestorOfClass",
  "FindFirstAncestorWhichIsA",
  "WaitForChild",
  "FireServer",
  "FireClient",
  "FireAllClients",
  "InvokeServer",
  "InvokeClient",
  "Connect",
  "Once",
  "Wait",
  "Destroy",
  "Disconnect",

  // Common Roblox properties/events
  "PlayerAdded",
  "PlayerRemoving",
  "CharacterAdded",
  "CharacterRemoving",
  "ChildAdded",
  "ChildRemoved",
  "DescendantAdded",
  "DescendantRemoving",
  "InputBegan",
  "InputChanged",
  "InputEnded",
  "Heartbeat",
  "Stepped",
  "RenderStepped",
  "Changed",
  "OnServerEvent",
  "OnClientEvent",
  "OnServerInvoke",
  "OnClientInvoke",
  "Parent",
  "Name",
  "ClassName",
  "Value",
  "Enabled",
  "Visible",
  "Text",
  "Position",
  "Size",
  "CFrame",
  "Color",
  "Transparency",
  "CanCollide",
  "Anchored",
  "Humanoid",
  "Character",
  "UserInputType",
  "KeyCode",
  "Magnitude",
  "Unit",
  "X",
  "Y",
  "Z",
]);

function tracePass(ctx, event) {
  if (ctx && typeof ctx.debugTrace === "function") {
    ctx.debugTrace(event);
  }
}

function createScope(parent = null) {
  return { parent, bindings: new Set(), apiBindings: new Set() };
}

function defineName(scope, name) {
  scope.bindings.add(name);
}

function findBindingScope(scope, name) {
  let current = scope;
  while (current) {
    if (current.bindings.has(name)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function setApiBinding(scope, name, enabled) {
  const owner = findBindingScope(scope, name);
  if (!owner) {
    return;
  }
  if (enabled) {
    owner.apiBindings.add(name);
  } else {
    owner.apiBindings.delete(name);
  }
}

function isApiBinding(scope, name) {
  let current = scope;
  while (current) {
    if (current.bindings.has(name)) {
      return current.apiBindings.has(name);
    }
    current = current.parent;
  }
  return false;
}

function isDefined(scope, name) {
  let current = scope;
  while (current) {
    if (current.bindings.has(name)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function escapedByteStringLiteral(value, ctx) {
  const bytes = Array.from(Buffer.from(String(value), "utf8"));
  const raw = `"${bytes.map((byte) => `\\${String(byte).padStart(3, "0")}`).join("")}"`;
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function collectScopeNames(scope, out) {
  if (!scope) {
    return;
  }
  for (const name of scope.bindings.keys()) {
    out.add(name);
  }
  for (const name of scope.typeBindings.keys()) {
    out.add(name);
  }
  scope.references.forEach((ref) => {
    if (ref && ref.name) {
      out.add(ref.name);
    }
  });
  scope.typeReferences.forEach((ref) => {
    if (ref && ref.name) {
      out.add(ref.name);
    }
  });
  scope.children.forEach((child) => collectScopeNames(child, out));
}

function collectIdentifierNames(ast, ctx = null) {
  const used = new Set();
  const scope =
    ctx && typeof ctx.getScope === "function"
      ? ctx.getScope()
      : ctx && typeof ctx.buildScope === "function"
        ? ctx.buildScope(ast, { includeTypes: true })
        : null;
  if (scope) {
    collectScopeNames(scope, used);
    return used;
  }
  walk(ast, (node) => {
    if (node && node.type === "Identifier" && typeof node.name === "string") {
      used.add(node.name);
    }
  });
  return used;
}

function makeName(rng, used, reserved) {
  const firstAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const restAlphabet = `${firstAlphabet}0123456789`;
  let out = "";
  while (!out || reserved.has(out) || used.has(out) || out.toLowerCase().includes("obf")) {
    const length = rng.int(3, 8);
    let name = firstAlphabet[rng.int(0, firstAlphabet.length - 1)];
    for (let i = 1; i < length; i += 1) {
      name += restAlphabet[rng.int(0, restAlphabet.length - 1)];
    }
    out = name;
  }
  used.add(out);
  return out;
}

function envIndex(name, envAlias, ctx) {
  return {
    type: "IndexExpression",
    base: { type: "Identifier", name: envAlias },
    index: escapedByteStringLiteral(name, ctx),
  };
}

function isMaskedGlobalChain(expr, envAlias) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if (expr.type === "IndexExpression") {
    if (expr.base && expr.base.type === "Identifier" && expr.base.name === envAlias) {
      return true;
    }
    return isMaskedGlobalChain(expr.base, envAlias);
  }
  if (expr.type === "MemberExpression") {
    return isMaskedGlobalChain(expr.base, envAlias);
  }
  return false;
}

function isApiExpression(expr, scope, envAlias) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if (isMaskedGlobalChain(expr, envAlias)) {
    return true;
  }
  switch (expr.type) {
    case "Identifier":
      return isApiBinding(scope, expr.name) ||
        (KNOWN_GLOBAL_API_ROOTS.has(expr.name) && !isDefined(scope, expr.name));
    case "MemberExpression":
    case "IndexExpression":
      return isApiExpression(expr.base, scope, envAlias);
    case "CallExpression":
    case "MethodCallExpression":
    case "TableCallExpression":
    case "StringCallExpression":
      return isApiExpression(expr.base, scope, envAlias);
    case "GroupExpression":
      return isApiExpression(expr.expression, scope, envAlias);
    case "TypeAssertion":
      return isApiExpression(expr.expression, scope, envAlias);
    default:
      return false;
  }
}

// Method-call lowering evaluates the receiver twice. Restrict that lowering
// to simple chains so arbitrary call expressions keep their original order.
function isStableApiBase(expr) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  if (expr.type === "Identifier") {
    return true;
  }
  if (expr.type === "MemberExpression") {
    return isStableApiBase(expr.base);
  }
  if (expr.type === "IndexExpression") {
    return isStableApiBase(expr.base) && Boolean(
      expr.index &&
      (expr.index.type === "Identifier" ||
        expr.index.type === "StringLiteral" ||
        expr.index.type === "NumericLiteral" ||
        expr.index.type === "BooleanLiteral")
    );
  }
  return false;
}

function cloneNode(node) {
  if (node === null || node === undefined) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(cloneNode);
  }
  if (typeof node !== "object") {
    return node;
  }
  const out = {};
  Object.keys(node).forEach((key) => {
    out[key] = cloneNode(node[key]);
  });
  return out;
}

function markSkip(node) {
  if (node && typeof node === "object") {
    node.__obf_skip_mask = true;
  }
}

function buildEnvAliasNodes(style, envAlias, getfAlias, ctx) {
  const envIdentifier = { type: "Identifier", name: envAlias };
  const getfIdentifier = { type: "Identifier", name: getfAlias };
  const localEnv = {
    type: "LocalStatement",
    variables: [envIdentifier],
    init: [{ type: "NilLiteral", value: null, raw: "nil" }],
  };
  const localGetf = {
    type: "LocalStatement",
    variables: [getfIdentifier],
    init: [{ type: "Identifier", name: "getfenv" }],
  };
  const getfCondition = {
    type: "BinaryExpression",
    operator: "==",
    left: {
      type: "CallExpression",
      base: { type: "Identifier", name: "type" },
      arguments: [getfIdentifier],
    },
    right: escapedByteStringLiteral("function", ctx),
  };
  const getfAssign = {
    type: "AssignmentStatement",
    variables: [envIdentifier],
    init: [
      {
        type: "CallExpression",
        base: getfIdentifier,
        arguments: [{ type: "NumericLiteral", value: 1, raw: "1" }],
      },
    ],
  };
  const getfBody = style === "custom"
    ? { type: "Block", body: [getfAssign] }
    : [getfAssign];
  const getfClause = style === "custom"
    ? { condition: getfCondition, body: getfBody }
    : { type: "IfClause", condition: getfCondition, body: getfBody };
  const getfIf = {
    type: "IfStatement",
    clauses: [getfClause],
    elseBody: null,
  };

  const condition = {
    type: "BinaryExpression",
    operator: "~=",
    left: {
      type: "CallExpression",
      base: { type: "Identifier", name: "type" },
      arguments: [envIdentifier],
    },
    right: escapedByteStringLiteral("table", ctx),
  };
  const assignEnv = {
    type: "AssignmentStatement",
    variables: [envIdentifier],
    init: [{ type: "Identifier", name: "_G" }],
  };
  const clauseBody = style === "custom"
    ? { type: "Block", body: [assignEnv] }
    : [assignEnv];
  const ifClause = style === "custom"
    ? { condition, body: clauseBody }
    : { type: "IfClause", condition, body: clauseBody };
  const ifStmt = {
    type: "IfStatement",
    clauses: [ifClause],
    elseBody: null,
  };
  markSkip(localEnv);
  markSkip(localGetf);
  markSkip(getfIf);
  markSkip(ifStmt);
  return [localEnv, localGetf, getfIf, ifStmt];
}

function shouldMask(name, scope, reserved) {
  if (!name || reserved.has(name)) {
    return false;
  }
  return !isDefined(scope, name);
}

function maskExpression(expr, scope, envAlias, reserved, ctx) {
  if (!expr || typeof expr !== "object") {
    return expr;
  }
  switch (expr.type) {
    case "Identifier":
      if (shouldMask(expr.name, scope, reserved)) {
        tracePass(ctx, {
          kind: "mask-global",
          name: expr.name,
        });
        return envIndex(expr.name, envAlias, ctx);
      }
      return expr;
    case "BinaryExpression":
    case "LogicalExpression":
      expr.left = maskExpression(expr.left, scope, envAlias, reserved, ctx);
      expr.right = maskExpression(expr.right, scope, envAlias, reserved, ctx);
      return expr;
    case "UnaryExpression":
      expr.argument = maskExpression(expr.argument, scope, envAlias, reserved, ctx);
      return expr;
    case "GroupExpression":
      expr.expression = maskExpression(expr.expression, scope, envAlias, reserved, ctx);
      return expr;
    case "IndexExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      expr.index = maskExpression(expr.index, scope, envAlias, reserved, ctx);
      return expr;
    case "MemberExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      if (expr.identifier && typeof expr.identifier.name === "string" &&
          isApiExpression(expr.base, scope, envAlias) &&
          (COMMON_MASKED_MEMBER_NAMES.has(expr.identifier.name) ||
            isStableApiBase(expr.base))) {
        return {
          type: "IndexExpression",
          base: expr.base,
          index: escapedByteStringLiteral(expr.identifier.name, ctx),
        };
      }
      return expr;
    case "CallExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      expr.arguments = (expr.arguments || []).map((arg) => maskExpression(arg, scope, envAlias, reserved, ctx));
      return expr;
    case "MethodCallExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      expr.arguments = (expr.arguments || []).map((arg) => maskExpression(arg, scope, envAlias, reserved, ctx));
      // A global API chain such as game:GetService(...) or task.spawn(...)
      // should not retain a plaintext member name. Convert only stable
      // receivers; dynamic receivers must preserve their single evaluation.
      if (expr.method && typeof expr.method.name === "string" &&
          isApiExpression(expr.base, scope, envAlias) && isStableApiBase(expr.base)) {
        const receiver = cloneNode(expr.base);
        return {
          type: "CallExpression",
          base: {
            type: "IndexExpression",
            base: expr.base,
            index: escapedByteStringLiteral(expr.method.name, ctx),
          },
          arguments: [receiver, ...(expr.arguments || [])],
        };
      }
      return expr;
    case "TableCallExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      expr.arguments = maskExpression(expr.arguments, scope, envAlias, reserved, ctx);
      return expr;
    case "StringCallExpression":
      expr.base = maskExpression(expr.base, scope, envAlias, reserved, ctx);
      expr.argument = maskExpression(expr.argument, scope, envAlias, reserved, ctx);
      return expr;
    case "TableConstructorExpression":
      expr.fields.forEach((field) => maskTableField(field, scope, envAlias, reserved, ctx));
      return expr;
    case "IfExpression":
      expr.clauses.forEach((clause) => {
        clause.condition = maskExpression(clause.condition, scope, envAlias, reserved, ctx);
        clause.value = maskExpression(clause.value, scope, envAlias, reserved, ctx);
      });
      expr.elseValue = maskExpression(expr.elseValue, scope, envAlias, reserved, ctx);
      return expr;
    case "TypeAssertion":
      expr.expression = maskExpression(expr.expression, scope, envAlias, reserved, ctx);
      return expr;
    case "InterpolatedString":
      if (expr.parts && Array.isArray(expr.parts)) {
        expr.parts = expr.parts.map((part) => {
          if (part && part.type === "InterpolatedStringText") {
            return part;
          }
          return maskExpression(part, scope, envAlias, reserved, ctx);
        });
      }
      return expr;
    case "FunctionDeclaration":
    case "FunctionExpression":
      maskFunctionExpression(expr, scope, envAlias, reserved, ctx);
      return expr;
    default:
      return expr;
  }
}

function maskTableField(field, scope, envAlias, reserved, ctx) {
  if (!field || typeof field !== "object") {
    return;
  }
  if (field.type === "TableKey") {
    field.key = maskExpression(field.key, scope, envAlias, reserved, ctx);
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
    return;
  }
  if (field.type === "TableKeyString") {
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
    return;
  }
  if (field.type === "TableValue") {
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
    return;
  }
  if (field.kind === "index") {
    field.key = maskExpression(field.key, scope, envAlias, reserved, ctx);
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
  } else if (field.kind === "name") {
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
  } else if (field.kind === "list") {
    field.value = maskExpression(field.value, scope, envAlias, reserved, ctx);
  }
}

function maskAssignmentTarget(target, scope, envAlias, reserved, ctx) {
  if (!target || typeof target !== "object") {
    return target;
  }
  if (target.type === "Identifier") {
    if (shouldMask(target.name, scope, reserved)) {
      tracePass(ctx, {
        kind: "mask-global-target",
        name: target.name,
      });
      return envIndex(target.name, envAlias, ctx);
    }
    return target;
  }
  if (target.type === "MemberExpression") {
    target.base = maskExpression(target.base, scope, envAlias, reserved, ctx);
    if (target.identifier && typeof target.identifier.name === "string" &&
        isApiExpression(target.base, scope, envAlias)) {
      return {
        type: "IndexExpression",
        base: target.base,
        index: escapedByteStringLiteral(target.identifier.name, ctx),
      };
    }
    return target;
  }
  if (target.type === "IndexExpression") {
    target.base = maskExpression(target.base, scope, envAlias, reserved, ctx);
    target.index = maskExpression(target.index, scope, envAlias, reserved, ctx);
    return target;
  }
  return target;
}

function maskStatementList(body, scope, envAlias, reserved, ctx) {
  for (const stmt of body) {
    maskStatement(stmt, scope, envAlias, reserved, ctx);
  }
}

function maskStatement(stmt, scope, envAlias, reserved, ctx) {
  if (!stmt || typeof stmt !== "object") {
    return;
  }
  if (stmt.__obf_skip_mask) {
    return;
  }
  switch (stmt.type) {
    case "LocalStatement":
      if (stmt.init && stmt.init.length) {
        stmt.init = stmt.init.map((expr) => maskExpression(expr, scope, envAlias, reserved, ctx));
      }
      const localVariables = Array.isArray(stmt.variables) ? stmt.variables : [];
      localVariables.forEach((variable, index) => {
        if (variable && variable.type === "Identifier") {
          defineName(scope, variable.name);
          const initExpr = stmt.init && stmt.init[index];
          setApiBinding(scope, variable.name, isApiExpression(initExpr, scope, envAlias));
        }
      });
      return;
    case "AssignmentStatement":
      stmt.init = stmt.init.map((expr) => maskExpression(expr, scope, envAlias, reserved, ctx));
      const assignmentVariables = Array.isArray(stmt.variables) ? stmt.variables : [];
      const assignmentTargets = assignmentVariables.map((variable) =>
        maskAssignmentTarget(variable, scope, envAlias, reserved, ctx)
      );
      assignmentVariables.forEach((variable, index) => {
        if (variable && variable.type === "Identifier" && isDefined(scope, variable.name)) {
          setApiBinding(scope, variable.name, isApiExpression(stmt.init[index], scope, envAlias));
        }
      });
      stmt.variables = assignmentTargets;
      return;
    case "CompoundAssignmentStatement":
      stmt.value = maskExpression(stmt.value, scope, envAlias, reserved, ctx);
      stmt.variable = maskAssignmentTarget(stmt.variable, scope, envAlias, reserved, ctx);
      if (stmt.variable && stmt.variable.type === "Identifier" && isDefined(scope, stmt.variable.name)) {
        setApiBinding(scope, stmt.variable.name, false);
      }
      return;
    case "CallStatement":
      stmt.expression = maskExpression(stmt.expression, scope, envAlias, reserved, ctx);
      return;
    case "ReturnStatement":
      stmt.arguments = stmt.arguments.map((expr) => maskExpression(expr, scope, envAlias, reserved, ctx));
      return;
    case "IfStatement":
      maskIfStatement(stmt, scope, envAlias, reserved, ctx);
      return;
    case "WhileStatement":
      stmt.condition = maskExpression(stmt.condition, scope, envAlias, reserved, ctx);
      maskScopedBody(stmt.body, scope, envAlias, reserved, ctx);
      return;
    case "RepeatStatement": {
      const repeatScope = createScope(scope);
      if (Array.isArray(stmt.body)) {
        maskStatementList(stmt.body, repeatScope, envAlias, reserved, ctx);
      } else if (stmt.body && Array.isArray(stmt.body.body)) {
        maskStatementList(stmt.body.body, repeatScope, envAlias, reserved, ctx);
      }
      stmt.condition = maskExpression(stmt.condition, repeatScope, envAlias, reserved, ctx);
      return;
    }
    case "ForNumericStatement": {
      stmt.start = maskExpression(stmt.start, scope, envAlias, reserved, ctx);
      stmt.end = maskExpression(stmt.end, scope, envAlias, reserved, ctx);
      if (stmt.step) {
        stmt.step = maskExpression(stmt.step, scope, envAlias, reserved, ctx);
      }
      const loopScope = createScope(scope);
      if (stmt.variable && stmt.variable.type === "Identifier") {
        defineName(loopScope, stmt.variable.name);
      }
      maskScopedBody(stmt.body, loopScope, envAlias, reserved, ctx);
      return;
    }
    case "ForGenericStatement": {
      stmt.iterators = stmt.iterators.map((expr) => maskExpression(expr, scope, envAlias, reserved, ctx));
      const loopScope = createScope(scope);
      stmt.variables.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          defineName(loopScope, variable.name);
        }
      });
      maskScopedBody(stmt.body, loopScope, envAlias, reserved, ctx);
      return;
    }
    case "DoStatement":
      maskScopedBody(stmt.body, scope, envAlias, reserved, ctx);
      return;
    case "FunctionDeclaration":
      maskFunctionDeclaration(stmt, scope, envAlias, reserved, ctx);
      return;
    case "BreakStatement":
    case "ContinueStatement":
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

function maskFunctionDeclaration(stmt, scope, envAlias, reserved, ctx) {
  const fnScope = createScope(scope);

  let isLocal = Boolean(stmt.isLocal);
  let fnId = null;
  if (stmt.name && stmt.name.type === "FunctionName") {
    if (stmt.isLocal && stmt.name.base && stmt.name.base.type === "Identifier") {
      fnId = stmt.name.base;
    } else {
      isLocal = false;
    }
  } else if (stmt.identifier && stmt.identifier.type === "Identifier") {
    fnId = stmt.identifier;
  }

  if (isLocal && fnId) {
    defineName(scope, fnId.name);
    defineName(fnScope, fnId.name);
  }

  if (stmt.name && stmt.name.type === "FunctionName" && stmt.name.method) {
    defineName(fnScope, "self");
  }

  if (stmt.parameters && stmt.parameters.length) {
    stmt.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        defineName(fnScope, param.name);
      }
    });
  }

  if (stmt.body) {
    if (Array.isArray(stmt.body)) {
      maskStatementList(stmt.body, fnScope, envAlias, reserved, ctx);
    } else if (stmt.body.body && Array.isArray(stmt.body.body)) {
      maskStatementList(stmt.body.body, fnScope, envAlias, reserved, ctx);
    }
  }
}

function maskFunctionExpression(expr, scope, envAlias, reserved, ctx) {
  const fnScope = createScope(scope);

  if (expr.identifier && expr.identifier.type === "Identifier") {
    defineName(fnScope, expr.identifier.name);
  }

  if (expr.parameters && expr.parameters.length) {
    expr.parameters.forEach((param) => {
      if (param && param.type === "Identifier") {
        defineName(fnScope, param.name);
      }
    });
  }

  if (expr.body) {
    if (Array.isArray(expr.body)) {
      maskStatementList(expr.body, fnScope, envAlias, reserved, ctx);
    } else if (expr.body.body && Array.isArray(expr.body.body)) {
      maskStatementList(expr.body.body, fnScope, envAlias, reserved, ctx);
    }
  }
}

function maskIfStatement(stmt, scope, envAlias, reserved, ctx) {
  if (!stmt.clauses || !stmt.clauses.length) {
    return;
  }
  const firstClause = stmt.clauses[0];
  if (firstClause && typeof firstClause.type === "string") {
    stmt.clauses.forEach((clause) => {
      if (clause.type !== "ElseClause") {
        clause.condition = maskExpression(clause.condition, scope, envAlias, reserved, ctx);
      }
      const clauseScope = createScope(scope);
      maskStatementList(clause.body, clauseScope, envAlias, reserved, ctx);
    });
    return;
  }
  stmt.clauses.forEach((clause) => {
    clause.condition = maskExpression(clause.condition, scope, envAlias, reserved, ctx);
    const clauseScope = createScope(scope);
    if (clause.body && clause.body.body) {
      maskStatementList(clause.body.body, clauseScope, envAlias, reserved, ctx);
    }
  });
  if (stmt.elseBody) {
    const elseScope = createScope(scope);
    if (stmt.elseBody.body) {
      maskStatementList(stmt.elseBody.body, elseScope, envAlias, reserved, ctx);
    }
  }
}

function maskScopedBody(body, parentScope, envAlias, reserved, ctx) {
  const scope = createScope(parentScope);
  if (Array.isArray(body)) {
    maskStatementList(body, scope, envAlias, reserved, ctx);
    return;
  }
  if (body && Array.isArray(body.body)) {
    maskStatementList(body.body, scope, envAlias, reserved, ctx);
  }
}

function maskGlobalsLuau(ast, ctx) {
  if (!ctx.options.renameOptions || ctx.options.renameOptions.maskGlobals === false) {
    return;
  }
  if (!ast.__obf_env_alias) {
    const used = collectIdentifierNames(ast, ctx);
    if (ctx && typeof ctx.getSSA === "function") {
      getCachedSSAUsedNamesFromRoot(ctx.getSSA()).forEach((name) => used.add(name));
    }
    const reserved = new Set(NAME_RESERVED);
    const envAlias = makeName(ctx.rng, used, reserved);
    reserved.add(envAlias);
    const getfAlias = makeName(ctx.rng, used, reserved);
    reserved.add(getfAlias);
    ast.__obf_env_alias_name = envAlias;
    ast.__obf_getf_alias_name = getfAlias;
    const style = !ctx.options || ctx.options.luauParser !== "luaparse" ? "custom" : "luaparse";
    insertAtTop(ast, buildEnvAliasNodes(style, envAlias, getfAlias, ctx));
    ast.__obf_env_alias = true;
  }
  const rootScope = createScope(null);
  const envAlias = ast.__obf_env_alias_name;
  const getfAlias = ast.__obf_getf_alias_name;
  const reserved = new Set(BASE_RESERVED);
  if (envAlias) {
    reserved.add(envAlias);
  }
  if (getfAlias) {
    reserved.add(getfAlias);
  }
  if (Array.isArray(ast.body)) {
    maskStatementList(ast.body, rootScope, envAlias, reserved, ctx);
  }
}

module.exports = {
  maskGlobalsLuau,
};
