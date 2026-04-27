const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "web", "index.html"), "utf8");

assert(html.includes('id="themeToggle"'), "expected theme toggle control");
assert(html.includes('id="overlay"'), "expected processing overlay");
assert(html.includes('id="overlayDownloadBtn"'), "expected overlay download action");
assert(html.includes('id="overlayCopyBtn"'), "expected overlay copy action");
assert(html.includes("function setOverlayState"), "expected overlay state controller");

console.log("web-ui: ok");
