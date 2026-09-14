function stripOuterSemicolon(source) {
  return String(source || "").trim().replace(/;$/, "").trim();
}

function getFirstNonWhitespaceLocation(source) {
  const text = String(source || "");
  let line = 1;
  let column = 1;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (ch === "\r") {
      if (text[index + 1] === "\n") {
        index += 1;
      }
      line += 1;
      column = 1;
      continue;
    }
    if (ch === "\n") {
      line += 1;
      column = 1;
      continue;
    }
    if (/\s/.test(ch)) {
      column += 1;
      continue;
    }
    return { line, column };
  }
  return { line: 1, column: 1 };
}

function getIdentifierOnlyName(source) {
  const text = stripOuterSemicolon(source);
  const match = /^[$A-Za-z_][$A-Za-z0-9_]*$/.exec(text);
  return match ? match[0] : null;
}

function isLikelyLuauSource(source) {
  const text = String(source || "");
  if (!text.trim()) {
    return false;
  }

  const patterns = [
    /^\s*local\s+(?:function\s+)?[A-Za-z_][A-Za-z0-9_]*/m,
    /^\s*(?:export\s+)?type\s+[A-Za-z_][A-Za-z0-9_]*\s*=/m,
    /^\s*if\s+[^\r\n;{}]+\s+then\b/m,
    /^\s*(?:for|while)\s+[^\r\n;{}]+\s+do\b/m,
    /^\s*(?:repeat|until)\b/m,
    /^\s*end\s*(?:[;,]|\s*--.*)?$/m,
    /^\s*--[^\r\n]*/m,
    /\b(?:game|workspace|Workspace|script|self)\s*:\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/,
    /\b(?:Instance|Vector3|CFrame|Color3|UDim2)\.new\s*\(/,
    /\btask\.(?:spawn|defer|wait|delay)\s*\(/,
    /[A-Za-z0-9_)]\s*::\s*[A-Za-z_]/,
  ];

  let score = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      score += 1;
    }
  }

  return score >= 1;
}

function makeInputDiagnosticError(message, source, details = {}) {
  const start = getFirstNonWhitespaceLocation(source);
  const err = new Error(message);
  err.name = "InputValidationError";
  err.code = details.code || "INPUT_VALIDATION";
  err.diagnostic = {
    kind: "input",
    code: err.code,
    message,
    advice: details.advice || null,
    token: details.token || null,
    loc: {
      start,
      end: start,
    },
    location: {
      start,
      end: start,
    },
  };
  return err;
}

function validateInputSource(source, options = {}) {
  if ((options.lang === "js" || options.lang === "javascript") && isLikelyLuauSource(source)) {
    throw makeInputDiagnosticError(
      "Selected language is JavaScript, but the source looks like Luau.",
      source,
      {
        code: "LANGUAGE_MISMATCH_LUAU",
        advice: {
          cause: "This source contains Luau syntax such as `local`, Roblox `:GetService(...)`, or Luau block keywords. JavaScript parsing will produce misleading errors like missing semicolons.",
          steps: [
            "Switch the language option to Luau.",
            "If this came from the web UI, set Language to Luau or use a `.lua` / `.luau` input filename.",
            "Do not add JavaScript semicolons to Luau code; that would be fixing the wrong parser.",
          ],
        },
      }
    );
  }

  const singleName = getIdentifierOnlyName(source);
  if (!singleName) {
    return;
  }

  throw makeInputDiagnosticError(
    `Input is only a bare name: ${singleName}`,
    source,
    {
      code: "SINGLE_BARE_IDENTIFIER",
      token: {
        type: "identifier",
        value: singleName,
      },
      advice: {
        cause: `The input only contains \`${singleName}\`. That is not a complete script to obfuscate.`,
        steps: [
          "Paste a complete source file or at least one complete statement.",
          `If \`${singleName}\` is a variable, include where it is declared or assigned before obfuscating.`,
          `If \`${singleName}\` is a function, write a real call such as \`${singleName}()\` and include the function definition or global context.`,
        ],
      },
    }
  );
}

module.exports = {
  getIdentifierOnlyName,
  isLikelyLuauSource,
  validateInputSource,
};
