const { OPCODE_NAMES } = require("./constants");

function buildOpcodeMapping(ctx) {
  if (ctx.state.vmOpcodeMapping) {
    return ctx.state.vmOpcodeMapping;
  }
  const count = OPCODE_NAMES.length;
  const base = Array.from({ length: count }, (_, i) => i);
  const shuffled = base.slice();
  if (ctx.options.vm.opcodeShuffle) {
    ctx.rng.shuffle(shuffled);
  }
  const encode = new Array(count);
  const decode = new Array(count);
  for (let i = 0; i < count; i += 1) {
    encode[i] = shuffled[i];
    decode[shuffled[i]] = i;
  }
  const mask = ctx.rng.int(1, 255);
  ctx.state.vmOpcodeMapping = { encode, decode, mask };
  return ctx.state.vmOpcodeMapping;
}

module.exports = { buildOpcodeMapping };
