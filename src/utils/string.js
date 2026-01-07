const { TextEncoder } = require("util");
const { streamXor } = require("./stream");

function encodeString(value, keyBytes) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const encrypted = streamXor(bytes, keyBytes);
  return Buffer.from(encrypted).toString("base64");
}

module.exports = {
  encodeString,
};
