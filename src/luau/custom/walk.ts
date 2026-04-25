// @ts-nocheck
const { traverse } = require("./traverse.ts");

function walk(node, visitor) {
  traverse(node, (value, parent, key, index) => {
    visitor(value, parent, key, index);
  });
}

module.exports = {
  walk,
};
