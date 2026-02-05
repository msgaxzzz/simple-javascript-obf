const { walk, traverse } = require("./ast");
const { decodeRawString } = require("./strings");
const { collectIdentifierNames, makeNameFactory } = require("./names");
const { addSSAReadNames, collectSSAReadNamesFromRoot, findSSAForNode } = require("./ssa-utils");
const { addSSAUsedNamesFromRoot } = require("./ssa-utils");

function luaString(value) {
  const text = String(value);
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/"/g, "\\\"");
  return `"${escaped}"`;
}

function encodeBase64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function numericLiteral(value) {
  return {
    type: "NumericLiteral",
    value,
    raw: Number.isFinite(value) ? String(value) : "0",
  };
}

function identifier(name) {
  return { type: "Identifier", name };
}

function callExpression(name, index) {
  return {
    type: "CallExpression",
    base: identifier(name),
    arguments: [numericLiteral(index)],
  };
}

function isFunctionNode(node) {
  return node && (node.type === "FunctionDeclaration" || node.type === "FunctionExpression");
}

function getScopeBody(node) {
  if (!node) {
    return null;
  }
  if (node.type === "Chunk") {
    return Array.isArray(node.body) ? node.body : null;
  }
  if (isFunctionNode(node)) {
    if (node.body && Array.isArray(node.body.body)) {
      return node.body.body;
    }
    if (Array.isArray(node.body)) {
      return node.body;
    }
  }
  return null;
}

function walkScope(root, visitor) {
  traverse(root, {
    enter(node, parent, key, index, ctx) {
      if (node !== root && isFunctionNode(node)) {
        ctx.skip();
        return;
      }
      visitor(node, parent, key, index);
    },
  });
}

function collectScopes(root) {
  const scopes = [];
  const visit = (node) => {
    const body = getScopeBody(node);
    if (body) {
      scopes.push({ node, body });
    }
    traverse(node, {
      enter(child, _parent, _key, _index, ctx) {
        if (child === node) {
          return;
        }
        if (isFunctionNode(child)) {
          visit(child);
          ctx.skip();
        }
      },
    });
  };
  visit(root);
  return scopes;
}

function buildPools(entries, rng, poolCount) {
  if (!entries.length) {
    return [];
  }
  const pools = Array.from({ length: poolCount }, () => []);
  const ordered = entries.slice();
  rng.shuffle(ordered);
  ordered.forEach((entry, idx) => {
    pools[idx % poolCount].push(entry);
  });
  return pools.filter((pool) => pool.length);
}

function collectScopeMap(scope, map) {
  if (!scope) {
    return;
  }
  if (scope.node) {
    map.set(scope.node, scope);
  }
  scope.children.forEach((child) => collectScopeMap(child, map));
}

function pickOpaqueName(scope, ssaReadNames, rng) {
  if (!scope || !ssaReadNames || !ssaReadNames.size) {
    return null;
  }
  const locals = Array.from(scope.bindings.keys());
  if (!locals.length) {
    return null;
  }
  const candidates = locals.filter((name) => ssaReadNames.has(name));
  if (!candidates.length) {
    return null;
  }
  return candidates[rng.int(0, candidates.length - 1)];
}


function getStringValue(node) {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (typeof node.raw === "string") {
    const decoded = decodeRawString(node.raw);
    if (decoded !== null) {
      return decoded;
    }
    if (node.raw.length >= 2) {
      return node.raw.slice(1, -1);
    }
  }
  return null;
}

function getLiteralEntry(node) {
  if (!node || typeof node !== "object") {
    return null;
  }
  switch (node.type) {
    case "StringLiteral": {
      const value = getStringValue(node);
      if (typeof value !== "string") {
        return null;
      }
      return { kind: "string", value };
    }
    case "NumericLiteral": {
      const value = typeof node.value === "number" ? node.value : Number(node.raw);
      if (!Number.isFinite(value)) {
        return null;
      }
      return { kind: "number", value };
    }
    case "BooleanLiteral":
      return { kind: "boolean", value: Boolean(node.value) };
    case "NilLiteral":
      return { kind: "nil", value: null };
    default:
      return null;
  }
}

function literalKey(entry) {
  if (!entry) {
    return null;
  }
  return `${entry.kind}:${String(entry.value)}`;
}

function literalToLua(entry, encoding) {
  if (!entry) {
    return "nil";
  }
  switch (entry.kind) {
    case "string":
      if (encoding === "base64") {
        return luaString(encodeBase64(entry.value));
      }
      return luaString(entry.value);
    case "number":
      return String(entry.value);
    case "boolean":
      return entry.value ? "true" : "false";
    case "nil":
      return "nil";
    default:
      return "nil";
  }
}

function rotateArray(list, offset) {
  if (!list.length) {
    return list;
  }
  const size = list.length;
  const shift = ((offset % size) + size) % size;
  if (!shift) {
    return list.slice();
  }
  return list.slice(shift).concat(list.slice(0, shift));
}

function markSkip(nodes) {
  if (!nodes || !nodes.length) {
    return;
  }
  nodes.forEach((stmt) => {
    if (stmt && typeof stmt === "object") {
      stmt.__obf_skip_const = true;
      stmt.__obf_skip_numbers = true;
      stmt.__obf_skip_split = true;
      stmt.__obf_skip_vm = true;
    }
  });
  nodes.forEach((stmt) => {
    walk(stmt, (node) => {
      node.__obf_skip_const = true;
      node.__obf_skip_numbers = true;
      node.__obf_skip_split = true;
      node.__obf_skip_vm = true;
    });
  });
}

function constantArrayLuau(ast, ctx) {
  if (!ctx.options.constArray) {
    return;
  }
  const options = ctx.options.constArrayOptions || {};
  const probability = options.probability ?? 1;
  const stringsOnly = options.stringsOnly ?? false;
  const shuffle = options.shuffle !== false;
  const rotate = options.rotate !== false;
  const minLength = options.minLength ?? 1;
  const encoding = options.encoding === "base64" ? "base64" : "none";
  const wrapper = options.wrapper !== false;
  const shards = options.shards ?? 1;
  const shardMinLength = options.shardMinLength ?? 6;
  const perScope = options.perScope !== false;
  const wipe = options.wipe !== false;
  const opaque = options.opaque !== false;
  const allowStrings = !ctx.options.strings;
  const allowNonStrings = !stringsOnly;

  const used = collectIdentifierNames(ast, ctx);
  if (ctx && typeof ctx.getSSA === "function") {
    addSSAUsedNamesFromRoot(ctx.getSSA(), used);
  }
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;
  const globalSSAReads = ssaRoot ? collectSSAReadNamesFromRoot(ssaRoot) : null;
  const scopeRoot = ctx && typeof ctx.getScope === "function" ? ctx.getScope() : null;
  const scopeMap = new Map();
  if (scopeRoot) {
    collectScopeMap(scopeRoot, scopeMap);
  }
  const nameFor = makeNameFactory(ctx.rng, used);
  const scopes = perScope ? collectScopes(ast) : [{ node: ast, body: getScopeBody(ast) }];

  scopes.forEach(({ node, body }) => {
    if (!body) {
      return;
    }
    const entries = [];
    const entryMap = new Map();
    const decisionMap = new Map();
    const scopeInfo = scopeMap.get(node) || null;
    let scopeSSAReads = null;
    if (ssaRoot) {
      const ssa = findSSAForNode(ssaRoot, node);
      if (ssa) {
        scopeSSAReads = new Set();
        addSSAReadNames(ssa, scopeSSAReads);
      }
    }
    if (!scopeSSAReads || !scopeSSAReads.size) {
      scopeSSAReads = globalSSAReads;
    }
    const opaqueName = opaque ? pickOpaqueName(scopeInfo, scopeSSAReads, ctx.rng) : null;

    walkScope(node, (child) => {
      if (!child || child.__obf_skip_const) {
        return;
      }
      const entry = getLiteralEntry(child);
      if (!entry) {
        return;
      }
      if (entry.kind === "string") {
        if (!allowStrings || entry.value.length < minLength) {
          return;
        }
      } else if (!allowNonStrings) {
        return;
      }

      const key = literalKey(entry);
      if (!key) {
        return;
      }
      let decision = decisionMap.get(key);
      if (decision === undefined) {
        decision = ctx.rng.bool(probability);
        decisionMap.set(key, decision);
      }
      if (!decision) {
        return;
      }
      if (!entryMap.has(key)) {
        entryMap.set(key, entry);
        entries.push(entry);
      }
    });

    if (!entries.length) {
      return;
    }

    const poolCount = entries.length >= shardMinLength
      ? Math.min(Math.max(1, shards), entries.length)
      : 1;
    const pools = buildPools(entries, ctx.rng, poolCount);
    if (!pools.length) {
      return;
    }

    const lookup = new Map();
    const runtimeLines = [];
    const hasBase64Strings = encoding === "base64"
      && entries.some((entry) => entry.kind === "string");
    const decodeName = hasBase64Strings ? nameFor("const_dec") : null;
    const charsName = hasBase64Strings ? nameFor("b64_chars") : null;
    const mapName = hasBase64Strings ? nameFor("b64_map") : null;

    if (hasBase64Strings) {
      runtimeLines.push(`local ${charsName} = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"`);
      runtimeLines.push(`local ${mapName} = {}`);
      runtimeLines.push(`for i = 1, #${charsName} do`);
      runtimeLines.push(`  ${mapName}[${charsName}:sub(i, i)] = i - 1`);
      runtimeLines.push("end");
      runtimeLines.push(`local function ${decodeName}(data)`);
      runtimeLines.push("  local out = {}");
      runtimeLines.push("  local buffer = 0");
      runtimeLines.push("  local bits = 0");
      runtimeLines.push("  for i = 1, #data do");
      runtimeLines.push("    local ch = data:sub(i, i)");
      runtimeLines.push("    if ch ~= \"=\" then");
      runtimeLines.push(`      local v = ${mapName}[ch]`);
      runtimeLines.push("      if v ~= nil then");
      runtimeLines.push("        buffer = buffer * 64 + v");
      runtimeLines.push("        bits = bits + 6");
      runtimeLines.push("        if bits >= 8 then");
      runtimeLines.push("          bits = bits - 8");
      runtimeLines.push("          local byte = math.floor(buffer / 2 ^ bits) % 256");
      runtimeLines.push("          out[#out + 1] = string.char(byte)");
      runtimeLines.push("        end");
      runtimeLines.push("      end");
      runtimeLines.push("    end");
      runtimeLines.push("  end");
      runtimeLines.push("  return table.concat(out)");
      runtimeLines.push("end");
    }

    const poolMeta = pools.map((pool) => {
      let ordered = pool.slice();
      if (shuffle) {
        ctx.rng.shuffle(ordered);
      }
      if (rotate && ordered.length > 1) {
        const offset = ctx.rng.int(1, ordered.length - 1);
        ordered = rotateArray(ordered, offset);
      }
      const constLength = ordered.length;
      const indexOffset = wrapper && constLength > 1 ? ctx.rng.int(1, constLength - 1) : 0;
      const tableName = nameFor("consts");
      const getterName = nameFor("const_get");
      const cacheName = nameFor("const_cache");
      const offsetName = nameFor("const_off");
      const lengthName = nameFor("const_len");
      const guardName = opaque ? nameFor("const_guard") : null;

      ordered.forEach((entry, idx) => {
        let tableIndex = idx + 1;
        if (wrapper && constLength > 1) {
          tableIndex = ((tableIndex - 1 - indexOffset) % constLength + constLength) % constLength + 1;
        }
        lookup.set(literalKey(entry), { getterName, index: tableIndex });
      });

      return {
        ordered,
        constLength,
        indexOffset,
        tableName,
        getterName,
        cacheName,
        offsetName,
        lengthName,
        guardName,
      };
    });

    poolMeta.forEach((meta) => {
      const values = meta.ordered.map((entry) => literalToLua(entry, encoding)).join(", ");
      const needCache = Boolean(hasBase64Strings || wipe);
      runtimeLines.push(`local ${meta.tableName} = { ${values} }`);
      if (needCache) {
        runtimeLines.push(`local ${meta.cacheName} = {}`);
      }
      if (wrapper && meta.constLength > 1) {
        runtimeLines.push(`local ${meta.offsetName} = ${meta.indexOffset}`);
        runtimeLines.push(`local ${meta.lengthName} = ${meta.constLength}`);
      }
      runtimeLines.push(`local function ${meta.getterName}(i)`);
      if (wrapper && meta.constLength > 1) {
        runtimeLines.push(`  local idx = i + ${meta.offsetName}`);
        runtimeLines.push(`  idx = idx % ${meta.lengthName}`);
        runtimeLines.push("  idx = idx + 1");
      } else {
        runtimeLines.push("  local idx = i");
      }
      if (needCache) {
        runtimeLines.push(`  local cached = ${meta.cacheName}[idx]`);
        runtimeLines.push("  if cached ~= nil then");
        runtimeLines.push("    return cached");
        runtimeLines.push("  end");
      }
      runtimeLines.push(`  local value = ${meta.tableName}[idx]`);
      if (opaque && meta.guardName) {
        const guardExpr = opaqueName ? `(${opaqueName} and 1 or 1)` : "1";
        runtimeLines.push(`  local ${meta.guardName} = ${guardExpr}`);
        runtimeLines.push(`  if ${meta.guardName} == 1 then`);
      }
      if (hasBase64Strings) {
        runtimeLines.push("  if type(value) == \"string\" then");
        runtimeLines.push(`    value = ${decodeName}(value)`);
        runtimeLines.push("  end");
      }
      if (needCache) {
        runtimeLines.push(`  if value ~= nil then`);
        runtimeLines.push(`    ${meta.cacheName}[idx] = value`);
        runtimeLines.push("  end");
      }
      if (wipe) {
        runtimeLines.push(`  ${meta.tableName}[idx] = nil`);
      }
      if (opaque && meta.guardName) {
        runtimeLines.push("  end");
      }
      runtimeLines.push("  return value");
      runtimeLines.push("end");
    });

    walkScope(node, (child, parent, key, index) => {
      if (!child || child.__obf_skip_const) {
        return;
      }
      const entry = getLiteralEntry(child);
      if (!entry) {
        return;
      }
      if (entry.kind === "string") {
        if (!allowStrings || entry.value.length < minLength) {
          return;
        }
      } else if (!allowNonStrings) {
        return;
      }

      const mapping = lookup.get(literalKey(entry));
      if (!mapping) {
        return;
      }
      const replacement = callExpression(mapping.getterName, mapping.index);
      if (!parent || key === null || key === undefined) {
        return;
      }
      if (index === null || index === undefined) {
        parent[key] = replacement;
      } else {
        parent[key][index] = replacement;
      }
    });

    const runtime = runtimeLines.join("\n");
    const runtimeAst = ctx.options.luauParser === "custom"
      ? ctx.parseCustom(runtime)
      : ctx.parseLuaparse(runtime);
    if (runtimeAst && Array.isArray(runtimeAst.body)) {
      markSkip(runtimeAst.body);
      body.unshift(...runtimeAst.body);
    }
  });
}

module.exports = {
  constantArrayLuau,
};
