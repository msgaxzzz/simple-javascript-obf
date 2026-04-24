const { insertAtTop } = require("../../utils/ast");
const { buildRuntime } = require("./runtime");

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

  const runtime = buildRuntime({
    lock: ctx.options.antiHook.lock,
    timing: ctx.options.antiHook.timing !== false,
    behavior: ctx.options.antiHook.behavior !== false,
  });

  insertAtTop(programPathRef, runtime);
}

module.exports = antiHook;
