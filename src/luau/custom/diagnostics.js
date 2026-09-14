"use strict";

const crypto = require("crypto");

function generateUUID() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeExpected(expected) {
  if (!expected) {
    return null;
  }
  if (Array.isArray(expected)) {
    return expected;
  }
  return [expected];
}

function sanitizePath(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/[a-zA-Z]:\\[^\s\(\):]+\\custom\\/gi, "<custom>/")
    .replace(/[a-zA-Z]:\\[^\s\(\):]+\\/gi, "<internal>/")
    .replace(/\/(Users|home|root)\/[^\s\(\):]+\/custom\//gi, "<custom>/")
    .replace(/\/(Users|home|root)\/[^\s\(\):]+\//gi, "<internal>/")
    .replace(/\\/g, "/");
}

function sanitizeStackTrace(stack) {
  if (typeof stack !== "string") return stack;
  const lines = stack.split("\n");
  const cleaned = lines.map((line) => {
    let s = sanitizePath(line);
    s = s.replace(/\(<custom>\/([^\)]+)\)/g, "(module://$1)");
    s = s.replace(/at [^\(]+\(<internal>[^\)]+\)/g, "at <runtime>");
    s = s.replace(/:\d+:\d+/g, "");
    s = s.replace(/:\d+/g, "");
    s = s.replace(/\s*\(\d+:\d+\)/g, "");
    return s;
  });
  return cleaned.join("\n");
}

function formatCodeFrame(source, loc, message = "") {
  if (typeof source !== "string" || !loc || !loc.start) {
    return message ? `DiagnosticError: ${sanitizePath(message)}` : "";
  }

  const lines = source.split(/\r?\n/);
  const targetLine = loc.start.line;
  const targetCol = loc.start.column;

  const startLine = Math.max(1, targetLine - 2);
  const endLine = Math.min(lines.length, targetLine + 2);

  const out = [];
  if (message) {
    out.push(`DiagnosticError: ${sanitizePath(message)}`);
  }

  for (let i = startLine; i <= endLine; i++) {
    const lineContent = lines[i - 1] || "";
    if (i === targetLine) {
      out.push(` > | ${lineContent}`);
      const indent = Math.max(0, targetCol - 1);
      const spanLen = loc.end && loc.end.line === targetLine ? Math.max(1, loc.end.column - targetCol) : 1;
      out.push(`   | ${" ".repeat(indent)}${"^".repeat(spanLen)}`);
    } else {
      out.push(`   | ${lineContent}`);
    }
  }

  return out.join("\n");
}

function makeDiagnostic(message, token, expected, context = null) {
  const normExpected = normalizeExpected(expected);
  const location = token && token.loc ? token.loc : null;
  const sanitizedMsg = sanitizePath(message).replace(/\s*\(\d+:\d+\)/g, "");

  const id = generateUUID();
  const timestamp = new Date().toISOString();
  
  let elapsedMs = 0;
  if (context && typeof context.startTime === "number") {
    elapsedMs = Number((performance.now() - context.startTime).toFixed(3));
  } else {
    elapsedMs = 0.1;
  }
  const elapsed = `${elapsedMs}ms`;

  const history = context && context.history ? context.history : [];
  const rule = context && context.rule ? context.rule : null;
  const lookahead = context && context.lookahead ? context.lookahead : null;

  return {
    id,
    uuid: id,
    timestamp,
    genTime: timestamp,
    elapsed,
    elapsedMs,
    message: sanitizedMsg,
    expected: normExpected,
    token: token
      ? {
          type: token.type,
          value: token.value,
        }
      : null,
    loc: location,
    location,
    range: token && token.range ? token.range : null,
    debug: {
      rule,
      tokenHistory: history,
      lookahead: lookahead ? { type: lookahead.type, value: lookahead.value } : null,
    },
  };
}

function formatDiagnosticReport(err) {
  const diag = err.diagnostic;
  if (!diag) return err.message;

  const out = [];
  out.push(`DiagnosticError: ${diag.message}`);
  out.push(`ID:      ${diag.uuid || diag.id}`);
  out.push(`Time:    ${diag.timestamp || diag.genTime}`);
  out.push(`Elapsed: ${diag.elapsed || (diag.elapsedMs + "ms")}`);

  if (err.codeFrame) {
    out.push("");
    const frameContent = err.codeFrame.replace(/^DiagnosticError:[^\n]+\n/g, "");
    out.push(frameContent);
  }

  return out.join("\n");
}

function makeDiagnosticError(message, token, expected, context = null) {
  const sanitizedMsg = sanitizePath(message).replace(/\s*\(\d+:\d+\)/g, "");
  const diag = makeDiagnostic(sanitizedMsg, token, expected, context);

  const err = new Error(sanitizedMsg);
  err.name = "DiagnosticError";
  err.diagnostic = diag;

  const source = typeof context === "string" ? context : (context && context.source ? context.source : null);
  if (source && diag.loc) {
    err.codeFrame = formatCodeFrame(source, diag.loc, sanitizedMsg);
  }

  err.report = formatDiagnosticReport(err);

  if (err.stack) {
    err.stack = sanitizeStackTrace(err.stack);
  }

  return err;
}

function makeDiagnosticFromNode(message, node, expected, context = null) {
  if (!node || !node.loc || !node.range) {
    return makeDiagnostic(message, null, expected, context);
  }
  return makeDiagnostic(
    message,
    {
      type: node.type,
      value: null,
      loc: node.loc,
      range: node.range,
    },
    expected,
    context
  );
}

function makeDiagnosticErrorFromNode(message, node, expected, context = null) {
  if (!node || !node.loc || !node.range) {
    return makeDiagnosticError(message, null, expected, context);
  }
  return makeDiagnosticError(
    message,
    {
      type: node.type,
      value: null,
      loc: node.loc,
      range: node.range,
    },
    expected,
    context
  );
}

const diagnosticFields = ["message", "expected", "token", "location", "range"];
const diagnosticTokenFields = ["type", "value", "loc", "range"];
const diagnosticTypes = {
  fields: diagnosticFields,
  tokenFields: diagnosticTokenFields,
  diagnosticFields,
  diagnosticTokenFields,
};

module.exports = {
  generateUUID,
  sanitizePath,
  sanitizeStackTrace,
  formatCodeFrame,
  formatDiagnosticReport,
  makeDiagnostic,
  makeDiagnosticError,
  makeDiagnosticFromNode,
  makeDiagnosticErrorFromNode,
  diagnosticFields,
  diagnosticTokenFields,
  diagnosticTypes,
};
