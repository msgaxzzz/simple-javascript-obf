const { walk, buildScope } = require("./ast");

const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
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
  "until",
  "while",
]);

const DEFAULT_RESERVED = new Set([
  "_ENV",
  "_G",
  "table",
  "string",
  "math",
  "bit32",
  "utf8",
  "debug",
  "coroutine",
  "type",
  "getfenv",
  "setfenv",
  "pcall",
  "xpcall",
  "pairs",
  "ipairs",
  "next",
  "print",
  "require",
  "select",
  "tonumber",
  "tostring",
  "rawget",
  "rawset",
  "setmetatable",
  "getmetatable",
]);

const FIRST_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const REST_ALPHABET = `${FIRST_ALPHABET}0123456789`;

function shuffleChars(chars, rng) {
  const list = chars.split("");
  if (rng && typeof rng.shuffle === "function") {
    rng.shuffle(list);
  }
  return list.join("");
}

function getProgressiveIdentifier(index, firstAlphabet = FIRST_ALPHABET, restAlphabet = REST_ALPHABET) {
  const fLen = firstAlphabet.length;
  const rLen = restAlphabet.length;

  if (index < fLen) {
    return firstAlphabet[index];
  }

  let n = index - fLen;
  let len = 2;
  let countForLen = fLen * rLen;

  while (n >= countForLen) {
    n -= countForLen;
    len += 1;
    countForLen *= rLen;
  }

  let chars = "";
  for (let i = 0; i < len - 1; i += 1) {
    chars = restAlphabet[n % rLen] + chars;
    n = Math.floor(n / rLen);
  }
  const firstChar = firstAlphabet[n % fLen];
  return firstChar + chars;
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
  if (typeof buildScope === "function" && ctx && ctx.useScope) {
    collectScopeNames(buildScope(ast, { includeTypes: true }), used);
    return used;
  }
  walk(ast, (node) => {
    if (node && node.type === "Identifier" && typeof node.name === "string") {
      used.add(node.name);
    }
  });
  return used;
}

function makeNameFactory(rng, used = new Set(), extraReserved = null, options = {}) {
  const reserved = new Set([...LUA_KEYWORDS, ...DEFAULT_RESERVED]);
  if (extraReserved) {
    for (const name of extraReserved) {
      reserved.add(name);
    }
  }
  const firstAlphabet = shuffleChars(FIRST_ALPHABET, rng);
  const restAlphabet = shuffleChars(REST_ALPHABET, rng);
  let index = 0;

  return (_prefix) => {
    while (true) {
      const name = getProgressiveIdentifier(index++, firstAlphabet, restAlphabet);
      if (!reserved.has(name) && !used.has(name) && !name.toLowerCase().includes("obf")) {
        used.add(name);
        return name;
      }
    }
  };
}

module.exports = {
  collectIdentifierNames,
  makeNameFactory,
  getProgressiveIdentifier,
};
