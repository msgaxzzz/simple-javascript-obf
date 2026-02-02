const parser = require("@babel/parser");
const { buildCharCodeExpr } = require("../../utils/runtime");

function buildRuntime({ lock, timing, behavior }) {
  const errIntegrity = buildCharCodeExpr("Integrity check failed");
  const errRuntime = buildCharCodeExpr("Runtime integrity violation");
  const code = `
(function () {
  const g = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : this;

  // Native code marker
  const nativeMark = "[native code]";
  const errIntegrity = ${errIntegrity};
  const errRuntime = ${errRuntime};

  // Get original toString before any tampering
  const origToString = Function.prototype.toString;
  const fnToString = origToString.bind ? origToString.bind(origToString) : origToString;

  // Check if function appears native
  const isNative = (fn) => {
    if (typeof fn !== "function") {
      return false;
    }
    try {
      const str = fnToString.call(fn);
      return str.indexOf(nativeMark) !== -1;
    } catch (err) {
      return false;
    }
  };

  // Check function source length (native functions have consistent lengths)
  const checkSourceLength = (fn, expectedMin, expectedMax) => {
    if (typeof fn !== "function") return true;
    try {
      const len = fnToString.call(fn).length;
      return len >= expectedMin && len <= expectedMax;
    } catch {
      return false;
    }
  };

  // Check prototype chain integrity
  const checkPrototype = (fn, expected) => {
    try {
      return Object.getPrototypeOf(fn) === expected;
    } catch {
      return false;
    }
  };

  // Check if object is a Proxy
  const isProxy = (obj) => {
    try {
      // Proxies throw when accessing certain internal properties
      const toString = Object.prototype.toString;
      const tag = toString.call(obj);
      // Additional check: Proxy objects have special behavior
      if (typeof obj === "function") {
        // Try to detect if function was wrapped
        const str = fnToString.call(obj);
        if (str.indexOf("Proxy") !== -1 || str.indexOf("=>") !== -1 && str.length < 50) {
          return true;
        }
      }
      return false;
    } catch {
      return true; // Error might indicate proxy
    }
  };

  // Timing-based debugger detection
  const checkDebugger = () => {
    if (!${timing}) return true;
    try {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        // Debugger will slow this down significantly
        void (1 + 1);
      }
      const elapsed = Date.now() - start;
      return elapsed < 50; // Should be nearly instant
    } catch {
      return false;
    }
  };

  // Check for modified getters/setters
  const checkPropertyDescriptors = () => {
    if (!${behavior}) return true;
    try {
      const desc = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__");
      if (desc && typeof desc.get === "function") {
        return isNative(desc.get);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Check for console modifications
  const checkConsole = () => {
    if (!${behavior}) return true;
    try {
      if (typeof console === "undefined") return true;
      if (typeof console.log !== "function") return false;
      return isNative(console.log);
    } catch {
      return true;
    }
  };

  // Main integrity check
  const checkAll = () => {
    // Critical functions that must be native
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
      if (isProxy(fn)) {
        return false;
      }
    }

    // Optional functions (check if they exist)
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
      g.Array && g.Array.prototype && g.Array.prototype.push,
      g.Array && g.Array.prototype && g.Array.prototype.map,
      g.String && g.String.prototype && g.String.prototype.indexOf,
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

    // Behavior checks
    if (!checkPropertyDescriptors()) {
      return false;
    }

    if (!checkConsole()) {
      return false;
    }

    // Timing check for debugger
    if (!checkDebugger()) {
      return false;
    }

    return true;
  };

  // Perform initial check
  if (!checkAll()) {
    throw new Error(errIntegrity);
  }

  // Lock prototypes if requested
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
      lockProto(g.Promise && g.Promise.prototype);
      lockProto(g.Map && g.Map.prototype);
      lockProto(g.Set && g.Set.prototype);
      lockProto(g.WeakMap && g.WeakMap.prototype);
      lockProto(g.WeakSet && g.WeakSet.prototype);
    }
  }

  // Set up periodic checks (optional, for high-security mode)
  if (${timing}) {
    let checkCount = 0;
    const periodicCheck = () => {
      checkCount++;
      if (checkCount > 100) return; // Limit checks to avoid performance impact
      if (!checkAll()) {
        throw new Error(errRuntime);
      }
      // Schedule next check with random delay
      const delay = 1000 + Math.floor(Math.random() * 4000);
      setTimeout(periodicCheck, delay);
    };
    // Start periodic checks after a random delay
    setTimeout(periodicCheck, 2000 + Math.floor(Math.random() * 3000));
  }
})();
`;
  return parser.parse(code, { sourceType: "script" }).program.body;
}

module.exports = {
  buildRuntime,
};
