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

function looksLikeTypeScript(text) {
  return (
    /^\s*(?:export\s+)?(?:interface|type)\s+[A-Za-z_$][A-Za-z0-9_$]*(?:\s*<[^>]*>)?\s*(?:=|extends|\{)/m.test(text) ||
    /\b(?:implements|declare|namespace|abstract)\b/.test(text) ||
    /:\s*(?:string|number|boolean|any|unknown|void|never|object|bigint|symbol|undefined|null)\b/.test(text) ||
    /\bas\s+(?:const|unknown|any|string|number|boolean|[A-Z][A-Za-z0-9_$]*)/.test(text) ||
    /^\s*(?:import|export)\s+type\b/m.test(text)
  );
}

function isLikelyLuauSource(source, options = {}) {
  const text = String(source || "");
  if (!text.trim()) {
    return false;
  }

  const filename = String((options && options.filename) || "");
  if (/\.(ts|tsx|mts|cts)$/i.test(filename)) {
    return false;
  }

  const strongPatterns = [
    /^\s*local\s+(?:function\s+)?[A-Za-z_][A-Za-z0-9_]*/m,
    /^\s*if\s+[^\r\n;{}]+\s+then\b/m,
    /^\s*(?:for|while)\s+[^\r\n;{}]+\s+do\b/m,
    /^\s*(?:repeat|until)\b/m,
    /\b(?:game|workspace|Workspace|script|self)\s*:\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/,
    /\b(?:Instance|Vector3|CFrame|Color3|UDim2)\.new\s*\(/,
    /\btask\.(?:spawn|defer|wait|delay)\s*\(/,
    /[A-Za-z0-9_)]\s*::\s*[A-Za-z_]/,
  ];
  for (const pattern of strongPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  const weakPatterns = [
    /^\s*(?:export\s+)?type\s+[A-Za-z_][A-Za-z0-9_]*\s*=/m,
    /^\s*end\s*(?:[;,]|\s*--.*)?$/m,
    /^\s*--[^\r\n]*/m,
  ];
  let weakMatches = 0;
  for (const pattern of weakPatterns) {
    if (pattern.test(text)) {
      weakMatches += 1;
    }
  }
  if (weakMatches === 0) {
    return false;
  }

  // TypeScript type aliases share the `type Name =` shape with Luau. If the
  // extension is not Luau and the source has TypeScript cues, do not report a
  // misleading "looks like Luau" error.
  if (!/\.(lua|luau)$/i.test(filename) && looksLikeTypeScript(text)) {
    return false;
  }

  return true;
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
  if ((options.lang === "js" || options.lang === "javascript") && isLikelyLuauSource(source, options)) {
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
