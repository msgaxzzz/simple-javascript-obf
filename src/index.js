const parser = require("@babel/parser");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const { minify } = require("terser");
const { buildPipeline } = require("./pipeline");
const { normalizeOptions } = require("./options");

function parseSource(code, filename) {
  return parser.parse(code, {
    sourceType: "unambiguous",
    sourceFilename: filename,
    allowReturnOutsideFunction: true,
    plugins: [
      "jsx",
      "typescript",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "decorators-legacy",
      "dynamicImport",
      "objectRestSpread",
      "optionalChaining",
      "nullishCoalescingOperator",
      "numericSeparator",
      "logicalAssignment",
      "topLevelAwait",
      "exportDefaultFrom",
      "exportNamespaceFrom",
      "asyncGenerators",
      "bigInt",
      "optionalCatchBinding",
      "privateIn",
      "importAssertions"
    ],
  });
}

async function obfuscate(source, userOptions = {}) {
  const options = normalizeOptions(userOptions);
  const ast = parseSource(source, options.filename);

  const pipeline = buildPipeline({
    t,
    traverse,
    options,
  });

  for (const plugin of pipeline) {
    plugin(ast);
  }

  const output = generate(
    ast,
    {
      compact: options.compact,
      sourceMaps: options.sourceMap,
      sourceFileName: options.filename,
      retainLines: false,
      comments: false,
    },
    source
  );

  const ecma = Number.isFinite(options.ecma) ? options.ecma : 2015;
  const minifyOptions = {
    ecma,
    compress: {
      defaults: true,
      ecma,
    },
    mangle: true,
    format: { comments: false, ecma },
  };
  if (options.sourceMap) {
    minifyOptions.sourceMap = { content: output.map, asObject: true };
  }

  const minified = await minify(output.code, minifyOptions);
  if (minified && minified.error) {
    throw minified.error;
  }

  let map = null;
  if (options.sourceMap) {
    if (typeof minified.map === "string") {
      try {
        map = JSON.parse(minified.map);
      } catch {
        map = null;
      }
    } else {
      map = minified.map || null;
    }
  }

  return {
    code: minified.code || "",
    map,
  };
}

module.exports = {
  obfuscate,
  parseSource,
};
