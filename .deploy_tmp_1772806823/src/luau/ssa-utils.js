function baseName(value) {
  if (!value || typeof value !== "string") {
    return null;
  }
  const idx = value.indexOf("$");
  if (idx === -1) {
    return value;
  }
  return value.slice(0, idx);
}

function addName(target, name) {
  if (!target || !name) {
    return;
  }
  target.add(name);
}

function addVersion(target, value) {
  const name = baseName(value);
  if (name) {
    target.add(name);
  }
}

function addSSAUsedNames(ssa, target) {
  if (!ssa || !target) {
    return target;
  }
  if (Array.isArray(ssa.variables)) {
    ssa.variables.forEach((name) => addName(target, name));
  }
  if (ssa.uses && typeof ssa.uses.forEach === "function") {
    ssa.uses.forEach((value) => addVersion(target, value));
  }
  if (ssa.defs && typeof ssa.defs.forEach === "function") {
    ssa.defs.forEach((value) => addVersion(target, value));
  }
  if (ssa.blocks) {
    Object.values(ssa.blocks).forEach((block) => {
      if (!block || !Array.isArray(block.phi)) {
        return;
      }
      block.phi.forEach((phi) => {
        if (!phi) {
          return;
        }
        addName(target, phi.variable);
        addVersion(target, phi.result);
        if (phi.args) {
          Object.values(phi.args).forEach((value) => addVersion(target, value));
        }
      });
    });
  }
  return target;
}

function addSSAUsedNamesFromRoot(ssaRoot, target) {
  if (!ssaRoot || !Array.isArray(ssaRoot.functions)) {
    return target;
  }
  ssaRoot.functions.forEach((cfg) => {
    if (cfg && cfg.ssa) {
      addSSAUsedNames(cfg.ssa, target);
    }
  });
  return target;
}

function addSSAReadNames(ssa, target) {
  if (!ssa || !target) {
    return target;
  }
  if (ssa.uses && typeof ssa.uses.forEach === "function") {
    ssa.uses.forEach((value) => addVersion(target, value));
  }
  if (ssa.blocks) {
    Object.values(ssa.blocks).forEach((block) => {
      if (!block || !Array.isArray(block.phi)) {
        return;
      }
      block.phi.forEach((phi) => {
        if (phi && phi.args) {
          Object.values(phi.args).forEach((value) => addVersion(target, value));
        }
      });
    });
  }
  return target;
}

function collectSSAReadNamesFromRoot(ssaRoot) {
  const out = new Set();
  if (!ssaRoot || !Array.isArray(ssaRoot.functions)) {
    return out;
  }
  ssaRoot.functions.forEach((cfg) => {
    if (cfg && cfg.ssa) {
      addSSAReadNames(cfg.ssa, out);
    }
  });
  return out;
}

function findSSAForNode(ssaRoot, node) {
  if (!ssaRoot || !Array.isArray(ssaRoot.functions)) {
    return null;
  }
  for (const cfg of ssaRoot.functions) {
    if (cfg && cfg.node === node) {
      return cfg.ssa || null;
    }
  }
  return null;
}

module.exports = {
  addSSAUsedNames,
  addSSAUsedNamesFromRoot,
  addSSAReadNames,
  collectSSAReadNamesFromRoot,
  findSSAForNode,
};
