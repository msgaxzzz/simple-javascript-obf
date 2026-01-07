const BIN_OPS = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "&",
  "^",
  "<<",
  ">>",
  ">>>",
  "==",
  "===",
  "!=",
  "!==",
  "in",
  "<",
  "<=",
  ">",
  ">=",
];

const UNARY_OPS = ["!", "+", "-", "~", "typeof", "void"];

const OPCODE_NAMES = [
  "PUSH_CONST",
  "GET_VAR",
  "SET_VAR",
  "BIN_OP",
  "UNARY_OP",
  "CALL",
  "RETURN",
  "POP",
  "GET_PROP",
  "SET_PROP",
  "CALL_METHOD",
  "PUSH_THIS",
  "GET_GLOBAL",
  "SET_GLOBAL",
  "JMP",
  "JMP_IF_FALSE",
  "JMP_IF_TRUE",
  "DUP",
  "NEW",
  "THROW",
  "TRY",
  "END_TRY",
  "ENTER_CATCH",
  "ENTER_FINALLY",
  "PUSH_ERROR",
  "MAKE_ARR",
  "MAKE_OBJ",
  "MAKE_FUNC",
  "RETHROW",
  "AWAIT",
  "FAKE_ADD",
  "FAKE_POP_PUSH",
  "FAKE_JMP",
];

const OPCODES = OPCODE_NAMES.reduce((acc, name, idx) => {
  acc[name] = idx;
  return acc;
}, {});

module.exports = {
  BIN_OPS,
  UNARY_OPS,
  OPCODE_NAMES,
  OPCODES,
};
