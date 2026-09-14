"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLegacyNodeShape = normalizeLegacyNodeShape;
exports.normalizeOfficialNodeShape = normalizeOfficialNodeShape;
exports.isOfficialStyleChunk = isOfficialStyleChunk;
const compatImpl = require("./compat-impl");
function normalizeLegacyNodeShape(node, options) {
    return compatImpl.normalizeLegacyNodeShape(node, options);
}
function normalizeOfficialNodeShape(node) {
    return compatImpl.normalizeOfficialNodeShape(node);
}
function isOfficialStyleChunk(node) {
    return compatImpl.isOfficialStyleChunk(node);
}
