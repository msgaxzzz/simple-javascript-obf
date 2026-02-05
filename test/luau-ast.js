#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parse } = require("../src/luau/custom/parser");
const { buildCFG } = require("../src/luau/custom/cfg");
const { buildSSA } = require("../src/luau/custom/ssa");
const { buildIR, buildIRSSA } = require("../src/luau/custom/ir");
const { printIR } = require("../src/luau/custom/ir-printer");

function readSource(filePath) {
  if (!filePath) {
    return [
      "local function demo(a, b)",
      "  local sum = a + b",
      "  return sum",
      "end",
      "",
      "print(demo(2, 6))",
    ].join("\n");
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseFile(filePath) {
  const source = readSource(filePath);
  const ast = parse(source);
  return ast;
}

function jsonReplacer(_key, value) {
  if (value instanceof Map) {
    return Array.from(value.entries());
  }
  if (value instanceof Set) {
    return Array.from(value.values());
  }
  return value;
}

function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const files = args.filter((arg) => !arg.startsWith("--"));
  const fileArg = files[0];
  const outArg = files[1];
  const inputPath = fileArg ? path.resolve(fileArg) : null;
  const ast = parseFile(inputPath);
  const wantCfg = flags.has("--cfg") || flags.has("--all");
  const wantSSA = flags.has("--ssa") || flags.has("--all");
  const wantIR = flags.has("--ir") || flags.has("--all");
  const wantIRSSA = flags.has("--ir-ssa") || flags.has("--all");
  const wantIRText = flags.has("--ir-text");
  const wantIRSSAText = flags.has("--ir-ssa-text");
  const wantIRTextRaw = flags.has("--ir-text-raw") || flags.has("--ir-text-no-ssa");
  const showEdges = flags.has("--ir-edges");
  const anonymizeNames = flags.has("--ir-anon") || flags.has("--ir-no-origname") || flags.has("--ir-anon-names");
  const includeAst = flags.has("--with-ast");
  let outputValue = ast;
  if (wantIRText || wantIRSSAText) {
    const useSSA = wantIRSSAText || !wantIRTextRaw;
    const irValue = useSSA ? buildIRSSA(ast, anonymizeNames ? { anonymizeNames: true } : null) : buildIR(ast);
    const outputText = printIR(irValue, showEdges ? { showEdges: true } : null);
    if (outArg) {
      fs.writeFileSync(path.resolve(outArg), outputText, "utf8");
      return;
    }
    process.stdout.write(outputText + "\n");
    return;
  }
  if (wantCfg || wantSSA || wantIR || wantIRSSA) {
    const payload = includeAst ? { ast } : {};
    if (wantSSA) {
      const cfgRoot = buildCFG(ast);
      const ssaRoot = buildSSA(cfgRoot);
      payload.ssa = ssaRoot;
      if (wantCfg) {
        payload.cfg = cfgRoot;
      }
    } else if (wantCfg) {
      payload.cfg = buildCFG(ast);
    }
    if (wantIR) {
      payload.ir = buildIR(ast);
    }
    if (wantIRSSA) {
      payload.irSSA = buildIRSSA(ast, anonymizeNames ? { anonymizeNames: true } : null);
    }
    outputValue = payload;
  }
  const output = JSON.stringify(outputValue, jsonReplacer, 2);

  if (outArg) {
    fs.writeFileSync(path.resolve(outArg), output, "utf8");
    return;
  }
  process.stdout.write(output + "\n");
}

main();
