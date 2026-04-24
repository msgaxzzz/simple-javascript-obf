function buildCharCodeExpr(value) {
  const codes = Array.from(String(value), (ch) => ch.charCodeAt(0));
  return `String.fromCharCode(${codes.join(", ")})`;
}

module.exports = {
  buildCharCodeExpr,
};
