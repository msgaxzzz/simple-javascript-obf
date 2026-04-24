function isPrimitive(value) {
  return value == null || typeof value !== "object";
}

function summarizeNode(value) {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (typeof value === "object") {
    if (typeof value.type === "string" && value.type.length > 0) {
      return value.type;
    }

    const keys = Object.keys(value);
    return keys.length > 0 ? `Object(${keys.join(",")})` : "Object";
  }

  return `${typeof value}:${String(value)}`;
}

function getNodeType(value) {
  if (value && typeof value === "object" && typeof value.type === "string" && value.type.length > 0) {
    return value.type;
  }

  if (Array.isArray(value)) {
    return "Array";
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return typeof value;
}

function encodeNodeValue(value) {
  if (value === undefined) {
    return { missing: true };
  }

  return value;
}

function getChangeKind(before, after) {
  if (isPrimitive(before) || isPrimitive(after)) {
    return "replace-value";
  }

  return "replace-node";
}

function makeChange(out, passName, path, before, after) {
  out.push({
    id: `${passName}:${String(out.length + 1).padStart(4, "0")}`,
    pass: passName,
    kind: getChangeKind(before, after),
    nodeType: getNodeType(after !== undefined ? after : before),
    path,
    before: {
      summary: summarizeNode(before),
      node: encodeNodeValue(before),
    },
    after: {
      summary: summarizeNode(after),
      node: encodeNodeValue(after),
    },
  });
}

function diffAst(before, after, passName, basePath = "root", out = []) {
  if (before === after) {
    return out;
  }

  if (isPrimitive(before) || isPrimitive(after)) {
    makeChange(out, passName, basePath, before, after);
    return out;
  }

  const beforeIsArray = Array.isArray(before);
  const afterIsArray = Array.isArray(after);

  if (beforeIsArray !== afterIsArray) {
    makeChange(out, passName, basePath, before, after);
    return out;
  }

  if (beforeIsArray) {
    const maxLength = Math.max(before.length, after.length);

    for (let index = 0; index < maxLength; index += 1) {
      diffAst(before[index], after[index], passName, `${basePath}[${index}]`, out);
    }

    return out;
  }

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  for (const key of keys) {
    diffAst(before[key], after[key], passName, `${basePath}.${key}`, out);
  }

  return out;
}

module.exports = {
  diffAst,
};
