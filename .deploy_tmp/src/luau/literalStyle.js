const { walk } = require("./ast");

function resolveNumericStyle(options) {
  const vmStyle = options && options.vm && typeof options.vm.numericStyle === "string"
    ? options.vm.numericStyle.toLowerCase()
    : "";
  const topStyle = options && typeof options.numericStyle === "string"
    ? options.numericStyle.toLowerCase()
    : "";
  const style = vmStyle || topStyle;
  if (style === "off" || style === "none" || style === "plain") {
    return "plain";
  }
  if (style === "chaos" || style === "aggressive") {
    return "chaos";
  }
  if (style === "mixed" || style === "auto") {
    return "mixed";
  }
  if (options && options.vm && options.vm.enabled) {
    return "mixed";
  }
  return "plain";
}

function addSeparators(digits, rng, minLen = 6) {
  if (!rng || digits.length < minLen || !rng.bool(0.7)) {
    return digits;
  }
  const group = rng.int(2, 4);
  const parts = [];
  for (let i = digits.length; i > 0; i -= group) {
    const start = Math.max(0, i - group);
    parts.unshift(digits.slice(start, i));
  }
  if (parts.length < 2) {
    return digits;
  }
  return parts.join("_");
}

function formatDecimal(value, rng, chaos) {
  const digits = addSeparators(String(value), rng, chaos ? 4 : 7);
  return digits;
}

function formatHex(value, rng, chaos) {
  let digits = value.toString(16);
  if (chaos ? rng.bool(0.85) : rng.bool(0.5)) {
    digits = digits.toUpperCase();
  }
  digits = addSeparators(digits, rng, chaos ? 4 : 7);
  const prefix = rng.bool(0.5) ? "0x" : "0X";
  return `${prefix}${digits}`;
}

function formatBinary(value, rng, chaos) {
  let digits = value.toString(2);
  digits = addSeparators(digits, rng, chaos ? 4 : 9);
  const prefix = rng.bool(0.5) ? "0b" : "0B";
  return `${prefix}${digits}`;
}

function pickMode(value, rng, style) {
  if (style === "chaos") {
    if (value <= 7) {
      return rng.pick(["bin", "hex", "dec", "bin"]);
    }
    return rng.pick(["hex", "bin", "hex", "dec", "bin"]);
  }
  if (value <= 7) {
    return rng.pick(["dec", "hex", "dec", "bin"]);
  }
  return rng.pick(["dec", "hex", "bin", "dec"]);
}

function shouldStylizeNode(node, style, rng) {
  if (!node || node.type !== "NumericLiteral") {
    return false;
  }
  if (!Number.isFinite(node.value) || !Number.isSafeInteger(node.value)) {
    return false;
  }
  if (node.value < 0) {
    return false;
  }
  if (typeof node.raw === "string" && /[.eE]/.test(node.raw)) {
    return false;
  }
  if (style === "chaos") {
    return node.value > 1 || rng.bool(0.35);
  }
  if (node.value <= 1) {
    return false;
  }
  return rng.bool(0.7);
}

function stylizeNumericLiteralsLuau(ast, ctx) {
  const rng = ctx && ctx.rng;
  if (!rng || !ast) {
    return;
  }
  const style = resolveNumericStyle(ctx.options);
  if (style === "plain") {
    return;
  }
  const chaos = style === "chaos";
  walk(ast, (node) => {
    if (!shouldStylizeNode(node, style, rng)) {
      return;
    }
    const mode = pickMode(node.value, rng, style);
    if (mode === "hex") {
      node.raw = formatHex(node.value, rng, chaos);
      return;
    }
    if (mode === "bin") {
      node.raw = formatBinary(node.value, rng, chaos);
      return;
    }
    node.raw = formatDecimal(node.value, rng, chaos);
  });
}

module.exports = {
  stylizeNumericLiteralsLuau,
};
