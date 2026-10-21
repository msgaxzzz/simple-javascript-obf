"use strict";

const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const runExec = promisify(execFile);

/**
 * Safely executes a binary or batch file across platforms (Windows .bat/.cmd support without EINVAL).
 */
async function runTool(cmd, args = [], options = {}) {
  const isWindows = process.platform === "win32";
  const isBatOrCmd =
    isWindows &&
    (cmd.toLowerCase().endsWith(".bat") || cmd.toLowerCase().endsWith(".cmd"));

  if (isBatOrCmd) {
    const comSpec = process.env.ComSpec || "cmd.exe";
    return runExec(comSpec, ["/d", "/s", "/c", cmd, ...args], {
      windowsHide: true,
      ...options,
    });
  }

  return runExec(cmd, args, {
    windowsHide: true,
    ...options,
  });
}

module.exports = {
  runTool,
};