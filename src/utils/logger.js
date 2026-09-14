const path = require("path");

function stripJsObfPrefix(message) {
  return String(message || "")
    .replace(/^\[js-obf\]\s*/i, "")
    .replace(/^luau parse failed:\s*/i, "")
    .replace(/\s+\(\d+:\d+\)$/g, "")
    .trim();
}

function findDiagnostic(error) {
  let current = error;
  const seen = new Set();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (current.diagnostic) {
      return current.diagnostic;
    }
    current = current.cause;
  }
  return null;
}

function findLocation(error) {
  const diagnostic = findDiagnostic(error);
  if (diagnostic && diagnostic.loc) {
    const loc = diagnostic.loc.start || diagnostic.loc.begin || diagnostic.loc;
    if (loc && Number.isFinite(loc.line) && Number.isFinite(loc.column)) {
      return {
        line: loc.line,
        column: loc.column,
        diagnostic,
      };
    }
  }
  if (error && error.loc && Number.isFinite(error.loc.line) && Number.isFinite(error.loc.column)) {
    return {
      line: error.loc.line,
      column: error.loc.column + 1,
      diagnostic: null,
    };
  }
  if (error && Number.isFinite(error.line) && Number.isFinite(error.column)) {
    return {
      line: error.line,
      column: error.column,
      diagnostic: null,
    };
  }
  return null;
}

function formatExpected(expected) {
  if (!expected) {
    return null;
  }
  const values = Array.isArray(expected) ? expected : [expected];
  const clean = values.map((value) => {
    const item = parseExpected(value);
    if (!item) {
      return String(value);
    }
    if (item.value) {
      return item.kind === "keyword" ? `\`${item.value}\` keyword` : `\`${item.value}\``;
    }
    return item.kind || String(value);
  }).filter(Boolean);
  return clean.length ? clean.join(", ") : null;
}

function parseExpected(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const text = String(value);
  const match = /^([^(]+)(?:\((.*)\))?$/.exec(text);
  if (!match) {
    return { kind: text, value: "" };
  }
  return {
    kind: match[1],
    value: match[2] || "",
  };
}

function getExpectedValues(expected) {
  if (!expected) {
    return [];
  }
  const values = Array.isArray(expected) ? expected : [expected];
  return values.map(parseExpected).filter(Boolean);
}

function hasExpected(expectedValues, kind, value) {
  return expectedValues.some((item) => {
    if (kind && item.kind !== kind) {
      return false;
    }
    return !(value !== undefined && item.value !== value);

  });
}

function extractExpectedFromMessage(message) {
  const text = String(message || "");
  const quoted = /expected\s+["']([^"']+)["']/i.exec(text);
  if (quoted) {
    const value = quoted[1].trim();
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ? [value] : [`symbol(${value})`];
  }
  const bare = /expected\s+([^\s)]+)/i.exec(text);
  if (!bare) {
    return null;
  }
  const value = bare[1].trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ? [value] : [`symbol(${value})`];
}

function getTokenLabel(diagnostic) {
  const token = diagnostic && diagnostic.token;
  if (!token) {
    return "the marked token";
  }
  if (token.type === "eof") {
    return "the end of the file";
  }
  if (token.value) {
    return `\`${token.value}\``;
  }
  return token.type || "the marked token";
}

function inferLanguage(options) {
  if (options.lang === "luau" || options.lang === "lua") {
    return "luau";
  }
  if (options.lang === "js" || options.lang === "javascript") {
    return "js";
  }
  const filename = String(options.filename || "").toLowerCase();
  if (filename.endsWith(".lua") || filename.endsWith(".luau")) {
    return "luau";
  }
  return "js";
}

function filenameLanguage(filename) {
  const lower = String(filename || "").toLowerCase();
  if (lower.endsWith(".lua") || lower.endsWith(".luau")) {
    return "luau";
  }
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs") || lower.endsWith(".ts") || lower.endsWith(".tsx") || lower.endsWith(".jsx")) {
    return "js";
  }
  return null;
}

function getSourceLine(source, location) {
  if (!source || !location || !Number.isFinite(location.line)) {
    return "";
  }
  return String(source).split(/\r?\n/)[location.line - 1] || "";
}

function insertIntoMarkedLine(source, location, insertion) {
  const line = getSourceLine(source, location);
  if (!line || !location || !Number.isFinite(location.column)) {
    return null;
  }
  const index = Math.max(0, Math.min(line.length, location.column - 1));
  const normalizedInsertion = /\s$/.test(insertion) && /\s/.test(line[index] || "")
    ? insertion.trimEnd()
    : insertion;
  const next = `${line.slice(0, index)}${normalizedInsertion}${line.slice(index)}`.trim();
  return next.length <= 120 ? next : null;
}

function isSingleIdentifierSource(source) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(source || "").trim());
}

function makeSyntaxAdvice(error, options, diagnostic, location, expectedValues) {
  const language = inferLanguage(options);
  const fileLang = filenameLanguage(options.filename);
  const message = error && error.message ? error.message : "";
  const reasonCode = error && error.reasonCode ? String(error.reasonCode) : "";
  const tokenLabel = getTokenLabel(diagnostic);
  const tokenType = diagnostic && diagnostic.token && diagnostic.token.type;
  const advice = {
    cause: "",
    steps: [],
  };

  const add = (step) => {
    if (step && !advice.steps.includes(step)) {
      advice.steps.push(step);
    }
  };
  const insertedSemicolon = insertIntoMarkedLine(options.source, location, "; ");
  const insertedEquals = insertIntoMarkedLine(options.source, location, "= ");
  const insertedComma = insertIntoMarkedLine(options.source, location, ", ");

  if (
    language === "luau" &&
    tokenType === "eof" &&
    hasExpected(expectedValues, "symbol", "=") &&
    isSingleIdentifierSource(options.source)
  ) {
    const name = String(options.source || "").trim();
    advice.cause = `The input is only \`${name}\`. Luau does not allow a bare variable name as a complete statement.`;
    add(`If this is JavaScript, switch the language option to JavaScript${fileLang === "js" ? " to match the file name" : ""}.`);
    add(`If this is Luau and you meant to call a function, write \`${name}()\`.`);
    add(`If this is Luau and you meant to assign a value, write \`${name} = value\`.`);
    return advice;
  }

  if (fileLang && fileLang !== language) {
    add(`The file name looks like ${fileLang === "js" ? "JavaScript" : "Luau"}, but the selected language is ${language === "js" ? "JavaScript" : "Luau"}. Switch the language selector if that is not intentional.`);
  }

  if (/MissingSemicolon|missing semicolon/i.test(reasonCode) || /missing semicolon/i.test(message)) {
    advice.cause = "Two JavaScript statements are touching each other, so the parser needs a statement separator.";
    add(insertedSemicolon
      ? `Add a semicolon before ${tokenLabel}, for example: \`${insertedSemicolon}\`.`
      : `Add a semicolon before ${tokenLabel}.`);
    add("A newline can also separate many JavaScript statements, but a semicolon is safer in generated or minified code.");
    return advice;
  }

  if (hasExpected(expectedValues, "keyword", "then")) {
    advice.cause = "A Luau `if` condition is missing the `then` keyword.";
    add(`Insert \`then\` before ${tokenLabel}: \`if condition then\`.`);
    add("If the marked token is meant to be part of the condition, add the missing operator before it.");
    return advice;
  }

  if (hasExpected(expectedValues, "keyword", "do")) {
    advice.cause = "A Luau loop header is missing `do`.";
    add(`Insert \`do\` before ${tokenLabel}: \`while condition do\` or \`for ... do\`.`);
    add("Check the loop header for a missing comma, `in`, or range value before adding `do`.");
    return advice;
  }

  if (hasExpected(expectedValues, "keyword", "end")) {
    advice.cause = "The file ended before a Luau block was closed.";
    add("Add `end` for the nearest unclosed `function`, `if`, `for`, `while`, or `do` block.");
    add("Start checking above the marked location; the missing block opener is usually a few lines earlier.");
    return advice;
  }

  if (hasExpected(expectedValues, "keyword", "until")) {
    advice.cause = "A Luau `repeat` block is missing its `until` condition.";
    add("Close the block with `until condition`, for example: `repeat ... until done`.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", "=")) {
    advice.cause = language === "luau"
      ? "Luau found an assignment target but no `=` before the value."
      : "The statement is missing an assignment operator.";
    add(insertedEquals
      ? `Add \`=\` before ${tokenLabel}, for example: \`${insertedEquals}\`.`
      : `Add \`=\` before ${tokenLabel}.`);
    add("If this was meant to be a function call, use parentheses instead, for example: `name(value)`.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", ",")) {
    advice.cause = "A list item is missing a separator.";
    add(insertedComma
      ? `Add a comma before ${tokenLabel}, for example: \`${insertedComma}\`.`
      : `Add a comma before ${tokenLabel}.`);
    add(language === "luau"
      ? "Use commas between function arguments, return values, and table fields when the next field is ambiguous."
      : "Use commas between object fields, array items, function parameters, and function arguments.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", ";")) {
    advice.cause = "The parser needs a statement or field separator at this point.";
    add(insertedSemicolon
      ? `Add \`;\` before ${tokenLabel}, for example: \`${insertedSemicolon}\`.`
      : `Add \`;\` before ${tokenLabel}.`);
    add(language === "luau"
      ? "Normal Luau statements do not usually need semicolons; if this is inside a table, a comma is often clearer."
      : "In JavaScript, this often happens when two statements are written on the same line.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", ")")) {
    advice.cause = "A parenthesized expression or function call was not closed.";
    add(`Add \`)\` before ${tokenLabel}.`);
    add("Check the nearest unmatched `(` before the marked location.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", "]")) {
    advice.cause = "An index expression or type/list bracket was not closed.";
    add(`Add \`]\` before ${tokenLabel}.`);
    add("Check the nearest unmatched `[` before the marked location.");
    return advice;
  }

  if (hasExpected(expectedValues, "symbol", "}")) {
    advice.cause = language === "luau"
      ? "A table constructor was not closed, or a table field separator is missing."
      : "An object, block, or destructuring pattern was not closed.";
    add(`Add \`}\` before ${tokenLabel}, or add the missing separator before the next field.`);
    add(language === "luau"
      ? "For Luau tables, prefer commas between fields when fields are on the same line."
      : "For JavaScript objects, add commas between properties.");
    return advice;
  }

  if (hasExpected(expectedValues, "identifier")) {
    advice.cause = "The parser expected a name here.";
    add(language === "luau"
      ? `Add an identifier before ${tokenLabel}, for example: \`local name = value\`.`
      : `Add an identifier before ${tokenLabel}.`);
    return advice;
  }

  if ((diagnostic && diagnostic.token && diagnostic.token.type === "eof") || /unexpected end|unterminated/i.test(message)) {
    advice.cause = "The file ended while an expression, string, table/object, or block was still open.";
    add("Check for an unclosed quote, `(`, `[`, `{`, or Luau `end` above the marked location.");
    add("Close the open construct before the end of the file.");
    return advice;
  }

  if (expectedValues.length) {
    advice.cause = `The parser found ${tokenLabel}, but this grammar position expects ${formatExpected(expectedValues.map((item) => item.value ? `${item.kind}(${item.value})` : item.kind))}.`;
    add(`Change ${tokenLabel}, or insert the missing token immediately before it.`);
  } else {
    advice.cause = "The parser could not continue from the marked token.";
    add("Check the marked line for a missing operator, separator, closing bracket, or block keyword.");
  }
  return advice;
}

function sourceFrame(source, location, radius = 2) {
  if (!source || !location || !Number.isFinite(location.line)) {
    return "";
  }
  const lines = String(source).split(/\r?\n/);
  const lineNumber = Math.max(1, Math.min(lines.length, location.line));
  const start = Math.max(1, lineNumber - radius);
  const end = Math.min(lines.length, lineNumber + radius);
  const width = String(end).length;
  const out = [];

  for (let line = start; line <= end; line += 1) {
    const marker = line === lineNumber ? ">" : " ";
    const text = lines[line - 1] || "";
    out.push(`${marker} ${String(line).padStart(width, " ")} | ${text}`);
    if (line === lineNumber) {
      const column = Math.max(1, location.column || 1);
      const prefix = text.slice(0, column - 1).replace(/[^\t]/g, " ").replace(/\t/g, "\t");
      out.push(`  ${" ".repeat(width)} | ${prefix}^`);
    }
  }

  return out.join("\n");
}

function classifyError(error) {
  const diagnostic = findDiagnostic(error);
  if (diagnostic && diagnostic.kind === "input") {
    return "Input error";
  }
  if (diagnostic || (error && error.loc)) {
    return "Syntax error";
  }
  const message = error && error.message ? error.message : String(error || "");
  if (/parse failed|unexpected token|unterminated|unexpected end/i.test(message)) {
    return "Syntax error";
  }
  if (/ENOENT|no such file/i.test(message)) {
    return "File error";
  }
  return "Build failed";
}

function formatError(error, options = {}) {
  const {
    source = "",
    filename = "",
    debug = false,
    toolName = "js-obf",
  } = options;
  const diagnostic = findDiagnostic(error);
  const location = findLocation(error);
  const problem = diagnostic && diagnostic.message
    ? diagnostic.message
    : error && error.message
      ? error.message
      : String(error || "Unknown error");
  const expectedRaw = diagnostic && diagnostic.expected
    ? diagnostic.expected
    : extractExpectedFromMessage(problem);
  const expectedValues = getExpectedValues(expectedRaw);
  const expected = formatExpected(expectedRaw);
  const kind = classifyError(error);
  const lines = [];

  lines.push(`[${toolName}] ${kind}`);
  if (filename) {
    lines.push(`File: ${path.normalize(filename)}`);
  }
  if (location) {
    lines.push(`Location: line ${location.line}, column ${location.column}`);
  }
  lines.push(`Problem: ${stripJsObfPrefix(problem) || "Unknown error"}`);
  if (expected) {
    lines.push(`Expected: ${expected}`);
  }

  const frame = sourceFrame(source, location);
  if (frame) {
    lines.push("");
    lines.push(frame);
  }

  if (kind === "Input error") {
    const advice = diagnostic && diagnostic.advice ? diagnostic.advice : null;
    if (advice && advice.cause) {
      lines.push("");
      lines.push(`Likely cause: ${advice.cause}`);
    }
    if (advice && Array.isArray(advice.steps) && advice.steps.length) {
      lines.push("How to fix:");
      advice.steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
    }
    lines.push("");
    lines.push("After editing the input, run the command again.");
  } else if (kind === "Syntax error") {
    const advice = makeSyntaxAdvice(error, { ...options, source, filename }, diagnostic, location, expectedValues);
    if (advice.cause) {
      lines.push("");
      lines.push(`Likely cause: ${advice.cause}`);
    }
    if (advice.steps.length) {
      lines.push("How to fix:");
      advice.steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
    }
    lines.push("");
    lines.push("After editing the input file, run the command again.");
  }
  if (debug && error && error.stack) {
    lines.push("");
    lines.push("Debug stack:");
    lines.push(error.stack);
  } else {
    lines.push("Use --debug to print the internal stack trace.");
  }

  return lines.join("\n");
}

function createLogger(options = {}) {
  const stream = options.stream || process.stderr;
  const debugEnabled = Boolean(options.debug);
  const toolName = options.toolName || "js-obf";
  const write = (level, message) => {
    stream.write(`[${toolName}] ${level}: ${message}\n`);
  };
  return {
    info(message) {
      write("info", message);
    },
    warn(message) {
      write("warning", message);
    },
    error(message) {
      stream.write(`${message}\n`);
    },
    debug(message) {
      if (debugEnabled) {
        write("debug", message);
      }
    },
    formatError(error, context = {}) {
      return formatError(error, {
        ...context,
        debug: context.debug !== undefined ? context.debug : debugEnabled,
        toolName,
      });
    },
  };
}

module.exports = {
  createLogger,
  findDiagnostic,
  findLocation,
  formatError,
  sourceFrame,
};
