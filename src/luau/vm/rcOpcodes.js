"use strict";

const RC_OPCODES = {
  MOVE: 0,
  LOADK: 1,
  LOADBOOL: 2,
  LOADNIL: 3,
  GETGLOBAL: 4,
  GETTABLE: 5,
  SETGLOBAL: 6,
  SETTABLE: 7,
  NEWTABLE: 8,
  SELF: 9,
  ADD: 10,
  SUB: 11,
  MUL: 12,
  DIV: 13,
  MOD: 14,
  POW: 15,
  UNM: 16,
  NOT: 17,
  LEN: 18,
  CONCAT: 19,
  JMP: 20,
  EQ: 21,
  LT: 22,
  LE: 23,
  TEST: 24,
  TESTSET: 25,
  CALL: 26,
  RETURN: 27,
  FORLOOP: 28,
  FORPREP: 29,
  TFORLOOP: 30,
  SETLIST: 31,
  CLOSURE: 32,
  VARARG: 33,
  BAND: 34,
  BOR: 35,
  BXOR: 36,
  SHL: 37,
  SHR: 38,
  BNOT: 39,
  GETUPVAL: 40,
  SETUPVAL: 41,
  IDIV: 42,
};

const RC_OPCODE_NAMES = Object.keys(RC_OPCODES);

// Constant flag: if operand is >= CONST_BIAS, it's a constant index
const CONST_BIAS = 512;

function isConstIndex(val) {
  return typeof val === "number" && val >= CONST_BIAS;
}

function toConstIndex(idx) {
  return idx + CONST_BIAS;
}

function fromConstIndex(val) {
  return val - CONST_BIAS;
}

module.exports = {
  RC_OPCODES,
  RC_OPCODE_NAMES,
  CONST_BIAS,
  isConstIndex,
  toConstIndex,
  fromConstIndex,
};
