const { walk, traverse } = require("./ast");
const { decodeRawString } = require("./strings");
const { collectIdentifierNames, makeNameFactory } = require("./names");
const { addSSAReadNames, findSSAForNode, getCachedSSAReadNamesFromRoot, getCachedSSAUsedNamesFromRoot } = require("./ssa-utils").default;
const { encodeBase85, buildBase85DecoderSource } = require("./vm/runtime");

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

function luaByteString(bytes) {
  if (!bytes || !bytes.length) {
    return '""';
  }
  let out = '"';
  for (const value of bytes) {
    const num = Math.max(0, Math.min(255, Number(value) || 0));
    out += `\\${String(num).padStart(3, "0")}`;
  }
  out += '"';
  return out;
}

function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function pickCoprime(n, rng) {
  if (n <= 1) return 1;
  const candidates = [];
  for (let i = 1; i < Math.min(n * 2, 100); i += 1) {
    if (gcd(i, n) === 1) {
      candidates.push(i);
    }
  }
  if (!candidates.length) return 1;
  return rng && typeof rng.pick === "function" ? rng.pick(candidates) : candidates[0];
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

function getFunctionName(fnNode) {
  if (!fnNode) {
    return null;
  }
  if (fnNode.name && fnNode.name.type === "FunctionName") {
    const parts = [fnNode.name.base.name, ...(fnNode.name.members || []).map((m) => m.name)];
    if (fnNode.name.method) {
      parts.push(fnNode.name.method.name);
    }
    return parts.join(".");
  }
  if (fnNode.identifier && fnNode.identifier.type === "Identifier") {
    return fnNode.identifier.name;
  }
  return null;
}

function isVmTargetScope(node, options) {
  if (!options || !options.vm || options.vm.enabled === false || !node) {
    return false;
  }
  if (node.type === "Chunk") {
    return options.vm.topLevel === true;
  }
  if (!isFunctionNode(node)) {
    return false;
  }
  const include = Array.isArray(options.vm.include) ? options.vm.include : [];
  if (options.vm.all || include.length === 0) {
    return true;
  }
  const name = getFunctionName(node);
  return Boolean(name && include.includes(name));
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

function encodeNumberLiteral(value, rng) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "0";
  }
  const plain = String(num);
  if (!rng || !Number.isSafeInteger(num)) {
    return plain;
  }
  if (rng.bool(0.75)) {
    const mul = rng.int(3, 11);
    const shift = rng.int(-2048, 2048) || 1;
    const shifted = num + shift;
    const encoded = shifted * mul;
    const bias = shift * mul;
    if (
      Number.isSafeInteger(shifted) &&
      Number.isSafeInteger(encoded) &&
      Number.isSafeInteger(bias)
    ) {
      return `((${encoded} - ${bias}) // ${mul})`;
    }
  }
  const offset = rng.int(1, 8192);
  const encoded = num + offset;
  if (Number.isSafeInteger(encoded)) {
    return `(${encoded} - ${offset})`;
  }
  return plain;
}

function literalToLua(entry, encoding, rng) {
  if (!entry) {
    return "nil";
  }
  switch (entry.kind) {
    case "string":
      if (encoding === "base85") {
        return luaString(encodeBase85(Buffer.from(String(entry.value), "utf8")));
      }
      if (encoding === "base64") {
        return luaString(encodeBase64(entry.value));
      }
      return luaByteString(Array.from(Buffer.from(String(entry.value), "utf8")));
    case "number":
      return encodeNumberLiteral(entry.value, rng);
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
    getCachedSSAUsedNamesFromRoot(ctx.getSSA()).forEach((name) => used.add(name));
  }
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;
  const globalSSAReads = ssaRoot ? getCachedSSAReadNamesFromRoot(ssaRoot) : null;
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
    if (isVmTargetScope(node, ctx.options)) {
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
    const hasEncodedStrings = (encoding === "base64" || encoding === "base85")
      && entries.some((entry) => entry.kind === "string");
    const decodeName = hasEncodedStrings ? nameFor("const_dec") : null;
    const charsName = hasEncodedStrings ? nameFor("b_chars") : null;
    const mapName = hasEncodedStrings ? nameFor("b_map") : null;

    if (hasEncodedStrings && encoding === "base85") {
      const b85Lines = buildBase85DecoderSource({
        fnName: decodeName,
        charsName,
        mapName,
        runtimeTools: {
          floor: "math.floor",
          char: "string.char",
          byte: "string.byte",
          concat: "table.concat",
        },
      });
      runtimeLines.push(...b85Lines);
    } else if (hasEncodedStrings && encoding === "base64") {
      const outName = nameFor("b64_out");
      const bufferName = nameFor("b64_buf");
      const bitsName = nameFor("b64_bits");
      const indexName = nameFor("b64_i");
      const charName = nameFor("b64_ch");
      const valueName = nameFor("b64_v");
      const byteName = nameFor("b64_byte");
      runtimeLines.push(`local ${charsName} = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"`);
      runtimeLines.push(`local ${mapName} = {}`);
      runtimeLines.push(`for i = 1, #${charsName} do`);
      runtimeLines.push(`  ${mapName}[${charsName}:sub(i, i)] = i - 1`);
      runtimeLines.push("end");
      runtimeLines.push(`local function ${decodeName}(data)`);
      runtimeLines.push(`  local ${outName} = {}`);
      runtimeLines.push(`  local ${bufferName} = 0`);
      runtimeLines.push(`  local ${bitsName} = 0`);
      runtimeLines.push(`  for ${indexName} = 1, #data do`);
      runtimeLines.push(`    local ${charName} = data:sub(${indexName}, ${indexName})`);
      runtimeLines.push(`    if ${charName} ~= "=" then`);
      runtimeLines.push(`      local ${valueName} = ${mapName}[${charName}]`);
      runtimeLines.push(`      if ${valueName} ~= nil then`);
      runtimeLines.push(`        ${bufferName} = ${bufferName} * 64 + ${valueName}`);
      runtimeLines.push(`        ${bitsName} = ${bitsName} + 6`);
      runtimeLines.push(`        if ${bitsName} >= 8 then`);
      runtimeLines.push(`          ${bitsName} = ${bitsName} - 8`);
      runtimeLines.push(`          local ${byteName} = math.floor(${bufferName} / 2 ^ ${bitsName}) % 256`);
      runtimeLines.push(`          ${outName}[#${outName} + 1] = string.char(${byteName})`);
      runtimeLines.push("        end");
      runtimeLines.push("      end");
      runtimeLines.push("    end");
      runtimeLines.push("  end");
      runtimeLines.push(`  return table.concat(${outName})`);
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
      const scale = wrapper && constLength > 1 ? pickCoprime(constLength, ctx.rng) : 1;
      const bias = wrapper && constLength > 1 ? ctx.rng.int(1, Math.min(200, constLength * 5)) : 0;
      const physicalTable = new Array(constLength);
      const tableName = nameFor("consts");
      const getterName = nameFor("const_get");
      const cacheName = nameFor("const_cache");
      const scaleName = nameFor("const_scale");
      const biasName = nameFor("const_bias");
      const lengthName = nameFor("const_len");
      const guardName = opaque ? nameFor("const_guard") : null;
      const indexName = nameFor("const_idx");
      const cachedName = nameFor("const_cached");
      const valueName = nameFor("const_value");

      ordered.forEach((entry, idx) => {
        const logicalIndex = idx + 1;
        const physicalIndex = wrapper && constLength > 1
          ? (((logicalIndex - 1) * scale + bias) % constLength) + 1
          : logicalIndex;
        physicalTable[physicalIndex - 1] = entry;
        lookup.set(literalKey(entry), { getterName, index: logicalIndex });
      });

      return {
        physicalTable,
        constLength,
        scale,
        bias,
        tableName,
        getterName,
        cacheName,
        scaleName,
        biasName,
        lengthName,
        guardName,
        indexName,
        cachedName,
        valueName,
      };
    });

    poolMeta.forEach((meta) => {
      const values = meta.physicalTable.map((entry) => literalToLua(entry, encoding, ctx.rng)).join(", ");
      const needCache = Boolean(hasEncodedStrings || wipe);
      runtimeLines.push(`local ${meta.tableName} = { ${values} }`);
      if (needCache) {
        runtimeLines.push(`local ${meta.cacheName} = {}`);
      }
      if (wrapper && meta.constLength > 1) {
        runtimeLines.push(`local ${meta.scaleName} = ${meta.scale}`);
        runtimeLines.push(`local ${meta.biasName} = ${meta.bias}`);
        runtimeLines.push(`local ${meta.lengthName} = ${meta.constLength}`);
      }
      runtimeLines.push(`local function ${meta.getterName}(i)`);
      if (wrapper && meta.constLength > 1) {
        runtimeLines.push(`  local ${meta.indexName} = (i - 1) * ${meta.scaleName} + ${meta.biasName}`);
        runtimeLines.push(`  ${meta.indexName} = ${meta.indexName} % ${meta.lengthName}`);
        runtimeLines.push(`  ${meta.indexName} = ${meta.indexName} + 1`);
      } else {
        runtimeLines.push(`  local ${meta.indexName} = i`);
      }
      if (needCache) {
        runtimeLines.push(`  local ${meta.cachedName} = ${meta.cacheName}[${meta.indexName}]`);
        runtimeLines.push(`  if ${meta.cachedName} ~= nil then`);
        runtimeLines.push(`    return ${meta.cachedName}`);
        runtimeLines.push("  end");
      }
      runtimeLines.push(`  local ${meta.valueName} = ${meta.tableName}[${meta.indexName}]`);
      if (opaque && meta.guardName) {
        const guardExpr = opaqueName ? `(${opaqueName} and 1 or 1)` : "1";
        runtimeLines.push(`  local ${meta.guardName} = ${guardExpr}`);
        runtimeLines.push(`  if ${meta.guardName} == 1 then`);
      }
      if (hasEncodedStrings) {
        runtimeLines.push(`  if type(${meta.valueName}) == "string" then`);
        runtimeLines.push(`    ${meta.valueName} = ${decodeName}(${meta.valueName})`);
        runtimeLines.push("  end");
      }
      if (needCache) {
        runtimeLines.push(`  if ${meta.valueName} ~= nil then`);
        runtimeLines.push(`    ${meta.cacheName}[${meta.indexName}] = ${meta.valueName}`);
        runtimeLines.push("  end");
      }
      if (wipe) {
        runtimeLines.push(`  ${meta.tableName}[${meta.indexName}] = nil`);
      }
      if (opaque && meta.guardName) {
        runtimeLines.push("  end");
      }
      runtimeLines.push(`  return ${meta.valueName}`);
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
    const useCustom = !ctx.options || ctx.options.luauParser !== "luaparse";
    const runtimeAst = useCustom
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
