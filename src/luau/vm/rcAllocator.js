"use strict";

/**
 * Register Allocator for Luau RC VM
 * Manages virtual registers (R0, R1, R2, ...) for local variables and temporaries.
 */
class RcAllocator {
  constructor() {
    this.currentReg = 0;
    this.maxReg = 0;
    this.freeRegs = [];
    this.scopes = [new Map()]; // stack of scope maps: name -> reg
  }

  enterScope() {
    this.scopes.push(new Map());
  }

  exitScope() {
    const scope = this.scopes.pop();
    if (scope) {
      for (const reg of scope.values()) {
        this.freeReg(reg);
      }
    }
  }

  defineLocal(name) {
    const reg = this.allocReg();
    const currentScope = this.scopes[this.scopes.length - 1];
    currentScope.set(name, reg);
    return reg;
  }

  resolveLocal(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name);
      }
    }
    return null;
  }

  allocReg() {
    let reg;
    if (this.freeRegs.length > 0) {
      reg = this.freeRegs.pop();
    } else {
      reg = this.currentReg++;
    }
    if (reg + 1 > this.maxReg) {
      this.maxReg = reg + 1;
    }
    return reg;
  }

  freeReg(reg) {
    if (reg >= 0 && !this.freeRegs.includes(reg)) {
      this.freeRegs.push(reg);
      this.freeRegs.sort((a, b) => b - a); // keep lowest reg at pop end
    }
  }

  allocTemp() {
    return this.allocReg();
  }

  freeTemp(reg) {
    this.freeReg(reg);
  }

  reserveConsecutive(count) {
    // Allocates `count` consecutive registers (needed for function calls / returns: A, A+1, ... A+count-1)
    // To ensure consecutive indices, we take starting from currentReg
    const start = this.currentReg;
    this.currentReg += count;
    if (this.currentReg > this.maxReg) {
      this.maxReg = this.currentReg;
    }
    return start;
  }

  freeConsecutive(start, count) {
    for (let i = start; i < start + count; i++) {
      this.freeReg(i);
    }
  }

  reset() {
    this.currentReg = 0;
    this.maxReg = 0;
    this.freeRegs = [];
    this.scopes = [new Map()];
  }
}

module.exports = {
  RcAllocator,
};
