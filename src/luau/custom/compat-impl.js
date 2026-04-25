function isNode(value) {
  return Boolean(value && typeof value === "object" && typeof value.type === "string");
}

function stripLocationFields(node, options) {
  if (!isNode(node)) {
    return node;
  }

  if (options.locations === false) {
    delete node.loc;
  }
  if (options.ranges === false) {
    delete node.range;
  }

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (isNode(item)) {
          stripLocationFields(item, options);
        }
      });
    } else if (isNode(value)) {
      stripLocationFields(value, options);
    }
  }

  return node;
}

function normalizeLegacyNodeShape(node, options = {}) {
  if (!isOfficialStyleChunk(node)) {
    throw new Error("Expected a custom Luau Chunk root");
  }
  return stripLocationFields(node, options);
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = cloneValue(value[key]);
    }
    return out;
  }
  return value;
}

function withOfficialLocation(loc) {
  if (!loc || typeof loc !== "object") {
    return loc;
  }
  const begin = loc.begin || loc.start || null;
  const end = loc.end || null;
  const out = { ...loc };
  if (begin) {
    out.begin = begin;
    out.start = begin;
  }
  if (end) {
    out.end = end;
  }
  return out;
}

function convertType(node) {
  if (!isNode(node)) {
    return cloneValue(node);
  }

  const out = {};
  for (const key of Object.keys(node)) {
    if (key === "loc") {
      out.loc = withOfficialLocation(node.loc);
      continue;
    }
    out[key] = convertType(node[key]);
  }

  if (node.type === "TypeReference") {
    out.name = Array.isArray(node.name) ? node.name[node.name.length - 1] || node.name : node.name;
    out.prefix = Array.isArray(node.name) && node.name.length > 1 ? node.name.slice(0, -1) : null;
    out.parameters = node.typeArguments || [];
  }

  return out;
}

function toOfficialNode(node) {
  if (Array.isArray(node)) {
    return node.map(toOfficialNode);
  }
  if (!isNode(node)) {
    return cloneValue(node);
  }

  const out = {};
  for (const key of Object.keys(node)) {
    if (key === "loc") {
      out.loc = withOfficialLocation(node.loc);
      continue;
    }
    out[key] = toOfficialNode(node[key]);
  }

  switch (node.type) {
    case "Chunk":
      return out;
    case "ExportTypeStatement":
    case "TypeAliasStatement":
      out.type = "StatTypeAlias";
      out.generics = node.typeParameters || [];
      out.genericPacks = null;
      out.annotation = convertType(node.value);
      out.exported = node.type === "ExportTypeStatement";
      delete out.typeParameters;
      delete out.value;
      return out;
    case "FunctionDeclaration":
      out.type = node.isLocal ? "StatLocalFunction" : "StatFunction";
      return out;
    case "DeclareFunctionStatement":
      out.type = "StatDeclareFunction";
      return out;
    case "IfExpression":
      out.type = "ExprIfElse";
      out.condition = node.clauses && node.clauses[0] ? toOfficialNode(node.clauses[0].condition) : null;
      out.trueExpression = node.clauses && node.clauses[0] ? toOfficialNode(node.clauses[0].value) : null;
      out.falseExpression = toOfficialNode(node.elseValue);
      return out;
    case "InterpolatedString":
      out.type = "ExprInterpString";
      return out;
    default:
      return out;
  }
}

function normalizeOfficialNodeShape(node) {
  if (!isOfficialStyleChunk(node)) {
    throw new Error("Expected a custom Luau Chunk root");
  }
  return toOfficialNode(node);
}

function isOfficialStyleChunk(node) {
  return Boolean(
    node &&
    typeof node === "object" &&
    node.type === "Chunk" &&
    Array.isArray(node.body)
  );
}

module.exports = {
  normalizeLegacyNodeShape,
  normalizeOfficialNodeShape,
  isOfficialStyleChunk,
};
