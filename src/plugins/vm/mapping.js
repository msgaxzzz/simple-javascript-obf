const { OPCODE_NAMES } = require("./constants");

// Generate unique random values for each opcode
function generateUniqueOpcodes(count, rng) {
  const used = new Set();
  const values = new Array(count);

  for (let i = 0; i < count; i++) {
    let value;
    do {
      value = rng.int(0, 255);
    } while (used.has(value));
    used.add(value);
    values[i] = value;
  }

  return values;
}

// Build decode table with trap opcodes for unused slots
function buildDecodeTable(encode, trapValue) {
  const decode = new Array(256).fill(trapValue);
  for (let i = 0; i < encode.length; i++) {
    decode[encode[i]] = i;
  }
  return decode;
}

function buildOpcodeMapping(ctx) {
  if (ctx.state.vmOpcodeMapping) {
    return ctx.state.vmOpcodeMapping;
  }

  const count = OPCODE_NAMES.length;
  let encode;

  if (ctx.options.vm.opcodeShuffle) {
    // Generate unique random opcode values (dynamic mapping)
    encode = generateUniqueOpcodes(count, ctx.rng);
  } else {
    // Sequential mapping (no shuffle)
    encode = Array.from({ length: count }, (_, i) => i);
  }

  // Trap opcode value for unused slots (causes error if executed)
  const trapOpcode = -1;

  // Build decode table with traps
  const decode = buildDecodeTable(encode, trapOpcode);

  // Multi-layer masks for different instruction components
  const masks = {
    opcode: ctx.rng.int(1, 255),
    operand: ctx.rng.int(1, 255),
    address: ctx.rng.int(1, 255),
  };

  // Additional obfuscation: XOR key for the entire instruction
  const instructionKey = ctx.rng.int(1, 0xffff);

  // Generate fake opcodes that look valid but trap
  const fakeOpcodes = [];
  if (ctx.options.vm.fakeOpcodes > 0) {
    const fakeCount = Math.floor(ctx.rng.next() * 10 * ctx.options.vm.fakeOpcodes);
    const usedValues = new Set(encode);
    for (let i = 0; i < fakeCount && usedValues.size < 256; i++) {
      let value;
      do {
        value = ctx.rng.int(0, 255);
      } while (usedValues.has(value));
      usedValues.add(value);
      fakeOpcodes.push(value);
    }
  }

  // Store mapping
  ctx.state.vmOpcodeMapping = {
    encode,
    decode,
    masks,
    instructionKey,
    fakeOpcodes,
    // Legacy single mask for backward compatibility
    mask: masks.opcode,
  };

  return ctx.state.vmOpcodeMapping;
}

// Apply multi-layer encoding to an opcode
function encodeOpcode(opcode, mapping) {
  return (opcode ^ mapping.masks.opcode) & 0xff;
}

// Apply encoding to operand
function encodeOperand(operand, mapping) {
  return operand ^ mapping.masks.operand;
}

// Apply encoding to address/offset
function encodeAddress(address, mapping) {
  return address ^ mapping.masks.address;
}

module.exports = {
  buildOpcodeMapping,
  encodeOpcode,
  encodeOperand,
  encodeAddress,
};
