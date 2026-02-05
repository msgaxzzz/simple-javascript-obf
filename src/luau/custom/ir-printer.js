function formatOperand(operand, ctx) {
  if (!operand) {
    return "nil";
  }
  if (typeof operand === "string") {
    if (operand.startsWith("v") && ctx && ctx.values && ctx.values[operand]) {
      const info = ctx.values[operand];
      if (info.base && String(info.base).startsWith("temp:")) {
        return info.display || info.name || operand;
      }
      if (info.display) {
        return `l:${info.display}`;
      }
      if (info.name) {
        return `l:${info.name}`;
      }
      return operand;
    }
    if (operand.startsWith("k") && ctx && ctx.consts) {
      const idx = Number(operand.slice(1));
      const value = Number.isNaN(idx) ? undefined : ctx.consts[idx];
      return `k:${formatConst(value)}`;
    }
    if (operand === "...") {
      return "...";
    }
    return operand;
  }
  switch (operand.kind) {
    case "ssa":
      if (operand.base && String(operand.base).startsWith("temp:")) {
        return operand.name || operand.id;
      }
      if (operand.name) {
        return `l:${operand.name}`;
      }
      return operand.id;
    case "temp":
      return operand.name || `t${operand.value}`;
    case "var":
      return operand.name ? `l:${operand.name}` : `l:${operand.value}`;
    case "upvalue":
      return operand.name ? `u:${operand.name}` : `u:${operand.value}`;
    case "global":
      return operand.name ? `g:${operand.name}` : `g:${operand.value}`;
    case "const":
      return `k:${formatConst(operand.value)}`;
    case "function":
      return `fn#${operand.value}`;
    case "vararg":
      return "...";
    default:
      return String(operand.value);
  }
}

function formatConst(value) {
  if (value === null || value === undefined) {
    return "nil";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Number.isFinite(value)) {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatArgs(args, ctx) {
  if (!args || !args.length) {
    return "";
  }
  return args.map((arg) => formatOperand(arg, ctx)).join(", ");
}

function formatPhi(inst, blockLabel, ctx) {
  let dest = null;
  if (inst.dest) {
    dest = formatOperand(inst.dest, ctx);
  } else if (inst.name) {
    dest = `l:${inst.name}`;
  } else if (inst.base && typeof inst.base === "string") {
    if (inst.base.startsWith("temp:")) {
      dest = `t${inst.base.slice("temp:".length)}`;
    } else if (inst.base.startsWith("var:")) {
      dest = `l:v${inst.base.slice("var:".length)}`;
    } else {
      dest = inst.base;
    }
  } else {
    dest = "nil";
  }
  const args = inst.args || {};
  const parts = Object.keys(args)
    .map((key) => ({ id: Number(key), value: args[key] }))
    .sort((a, b) => a.id - b.id)
    .map((entry) => `${blockLabel(entry.id)}:${formatOperand(entry.value, ctx)}`);
  return `${dest} = phi(${parts.join(", ")})`;
}

function formatInstruction(inst, blockLabel, ctx) {
  switch (inst.op) {
    case "phi":
      return formatPhi(inst, blockLabel, ctx);
    case "param": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = param ${inst.index}`;
    }
    case "move": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = mov ${formatOperand(inst.src, ctx)}`;
    }
    case "binary": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = ${inst.operator} ${formatOperand(inst.left, ctx)}, ${formatOperand(inst.right, ctx)}`;
    }
    case "unary": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = ${inst.operator} ${formatOperand(inst.argument, ctx)}`;
    }
    case "call": {
      const args = formatArgs(inst.args, ctx);
      const call = `call ${formatOperand(inst.base, ctx)}(${args})`;
      return inst.dest ? `${formatOperand(inst.dest, ctx)} = ${call}` : call;
    }
    case "method_call": {
      const args = formatArgs(inst.args, ctx);
      const call = `call ${formatOperand(inst.base, ctx)}:${inst.method || "<method>"}(${args})`;
      return inst.dest ? `${formatOperand(inst.dest, ctx)} = ${call}` : call;
    }
    case "get_index": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = get_index ${formatOperand(inst.base, ctx)}, ${formatOperand(inst.index, ctx)}`;
    }
    case "set_index":
      return `set_index ${formatOperand(inst.base, ctx)}, ${formatOperand(inst.index, ctx)}, ${formatOperand(inst.value, ctx)}`;
    case "get_member": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = get_member ${formatOperand(inst.base, ctx)}, ${inst.name}`;
    }
    case "set_member":
      return `set_member ${formatOperand(inst.base, ctx)}, ${inst.name}, ${formatOperand(inst.value, ctx)}`;
    case "table_new": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = table_new`;
    }
    case "table_set":
      return `table_set ${formatOperand(inst.base, ctx)}, ${formatOperand(inst.key, ctx)}, ${formatOperand(inst.value, ctx)}`;
    case "interpolate": {
      const dest = formatOperand(inst.dest, ctx);
      const parts = formatArgs(inst.parts, ctx);
      return `${dest} = interpolate ${parts}`;
    }
    case "branch":
      return `br ${formatOperand(inst.test, ctx)}, ${blockLabel(inst.consequent)}, ${blockLabel(inst.alternate)}`;
    case "jump":
      return typeof inst.target === "number" ? `jmp ${blockLabel(inst.target)}` : `jmp ${inst.target}`;
    case "return": {
      const values = formatArgs(inst.values, ctx);
      return values ? `ret ${values}` : "ret";
    }
    case "for_numeric_check": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = for_num_check ${formatOperand(inst.variable, ctx)}, ${formatOperand(inst.limit, ctx)}, ${formatOperand(inst.step, ctx)}`;
    }
    case "for_generic_init":
      return `for_gen_init ${formatArgs(inst.iterators, ctx)}`;
    case "for_generic_next": {
      const vars = formatArgs(inst.variables, ctx);
      const iters = formatArgs(inst.iterators, ctx);
      return `for_gen_next ${vars}${iters ? ` <- ${iters}` : ""}`;
    }
    case "for_generic_check": {
      const dest = formatOperand(inst.dest, ctx);
      return `${dest} = for_gen_check`;
    }
    case "mem_write":
      return `mem_write ${formatOperand(inst.target, ctx)}, ${formatOperand(inst.value, ctx)}`;
    default:
      return inst.op;
  }
}

function printFunction(fn, options) {
  const lines = [];
  const blockLabel = (id) => `bb${id}`;
  const ctx = { values: fn.values || null, consts: fn.consts || null };
  lines.push(`fn#${fn.id} ${fn.kind}`);
  fn.blocks.forEach((block) => {
    if (block.removed) {
      return;
    }
    let header = `${blockLabel(block.id)}:`;
    if (options && options.showEdges) {
      const preds = (block.predecessors || []).map((id) => blockLabel(id)).join(", ");
      const succs = (block.successors || []).map((id) => blockLabel(id)).join(", ");
      header += ` ; preds=[${preds}] succs=[${succs}]`;
    }
    lines.push(header);
    const instructions = block.instructions || [];
    instructions.forEach((inst) => {
      lines.push(`  ${formatInstruction(inst, blockLabel, ctx)}`);
    });
  });
  return lines.join("\n");
}

function printIR(root, options = null) {
  if (!root || !Array.isArray(root.functions)) {
    return "";
  }
  return root.functions.map((fn) => printFunction(fn, options)).join("\n\n");
}

module.exports = {
  printIR,
};
