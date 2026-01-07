const parser = require("@babel/parser");

function insertAtTop(programPath, nodes) {
  const body = programPath.node.body;
  let index = 0;
  while (index < body.length) {
    const stmt = body[index];
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      index += 1;
      continue;
    }
    break;
  }
  body.splice(index, 0, ...nodes);
}

function buildRuntime({ lock }) {
  const code = `
(function () {
  const g = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : this;
  const nativeMark = "[native code]";
  const fnToString =
    g.Function && g.Function.prototype && g.Function.prototype.toString;
  const isNative = (fn) => {
    if (typeof fn !== "function" || !fnToString) {
      return false;
    }
    try {
      return fnToString.call(fn).indexOf(nativeMark) !== -1;
    } catch (err) {
      return false;
    }
  };
  const checkAll = () => {
    const required = [
      g.Function,
      g.eval,
      g.Object && g.Object.defineProperty,
      g.Object && g.Object.getOwnPropertyDescriptor,
      g.Function && g.Function.prototype && g.Function.prototype.toString,
    ];
    for (let i = 0; i < required.length; i += 1) {
      const fn = required[i];
      if (!isNative(fn)) {
        return false;
      }
    }
    const optional = [
      g.Object && g.Object.getPrototypeOf,
      g.Object && g.Object.keys,
      g.Object && g.Object.freeze,
      g.JSON && g.JSON.parse,
      g.JSON && g.JSON.stringify,
      g.Math && g.Math.random,
      g.Date,
      g.Date && g.Date.now,
      g.Reflect && g.Reflect.apply,
      g.Reflect && g.Reflect.construct,
    ];
    for (let i = 0; i < optional.length; i += 1) {
      const fn = optional[i];
      if (typeof fn !== "function") {
        continue;
      }
      if (!isNative(fn)) {
        return false;
      }
    }
    return true;
  };
  if (!checkAll()) {
    throw new Error("Hook detected");
  }
  if (${lock ? "true" : "false"}) {
    const freeze = g.Object && g.Object.freeze;
    if (typeof freeze === "function") {
      const lockProto = (obj) => {
        try {
          if (obj) {
            freeze(obj);
          }
        } catch (err) {}
      };
      lockProto(g.Function && g.Function.prototype);
      lockProto(g.Object && g.Object.prototype);
      lockProto(g.Array && g.Array.prototype);
      lockProto(g.String && g.String.prototype);
      lockProto(g.Number && g.Number.prototype);
      lockProto(g.Boolean && g.Boolean.prototype);
      lockProto(g.Date && g.Date.prototype);
      lockProto(g.RegExp && g.RegExp.prototype);
      lockProto(g.Error && g.Error.prototype);
    }
  }
})();
`;
  return parser.parse(code, { sourceType: "script" }).program.body;
}

function antiHook(ast, ctx) {
  if (!ctx.options.antiHook || !ctx.options.antiHook.enabled) {
    return;
  }
  let programPathRef = null;
  ctx.traverse(ast, {
    Program(path) {
      programPathRef = path;
    },
  });
  if (!programPathRef) {
    return;
  }
  const runtime = buildRuntime({ lock: ctx.options.antiHook.lock });
  insertAtTop(programPathRef, runtime);
}

module.exports = antiHook;
