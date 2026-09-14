// @ts-nocheck
const { traverse } = require("./traverse");


function walk(node, visitor) {
  traverse(node, (value, parent, key, index) => {
    visitor(value, parent, key, index);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    walk,
  };
}
export { walk };
