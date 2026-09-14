"use strict";

function isNode(value) {
  return Boolean(value && typeof value === "object" && typeof value.type === "string");
}

function createBlock(cfg, kind, label = null) {
  const block = {
    id: cfg.blocks.length,
    kind,
    label,
    statements: [],
    successors: [],
    predecessors: [],
  };
  cfg.blocks.push(block);
  return block;
}

function connect(from, to) {
  if (!from || !to) {
    return;
  }
  if (!from.successors.includes(to.id)) {
    from.successors.push(to.id);
  }
  if (!to.predecessors.includes(from.id)) {
    to.predecessors.push(from.id);
  }
}

function disconnect(from, to) {
  if (!from || !to) {
    return;
  }
  const sIdx = from.successors.indexOf(to.id);
  if (sIdx !== -1) {
    from.successors.splice(sIdx, 1);
  }
  const pIdx = to.predecessors.indexOf(from.id);
  if (pIdx !== -1) {
    to.predecessors.splice(pIdx, 1);
  }
}

// ---------------------------------------------------------------------------
// 1. Dominator Tree (Cooper-Harvey-Kennedy 2001)
// ---------------------------------------------------------------------------

function computeRPO(blocks, entryId) {
  const numBlocks = blocks.length;
  const visited = new Uint8Array(numBlocks);
  const postOrder = [];

  function dfs(u) {
    visited[u] = 1;
    const block = blocks[u];
    if (block) {
      for (let i = 0; i < block.successors.length; i++) {
        const succ = block.successors[i];
        if (!visited[succ] && succ < numBlocks) {
          dfs(succ);
        }
      }
    }
    postOrder.push(u);
  }

  if (entryId < numBlocks) {
    dfs(entryId);
  }

  const numReachable = postOrder.length;
  const rpoOrder = new Int32Array(numReachable);
  const rpoIndex = new Int32Array(numBlocks);
  rpoIndex.fill(-1);

  for (let i = 0; i < numReachable; i++) {
    const u = postOrder[numReachable - 1 - i];
    rpoOrder[i] = u;
    rpoIndex[u] = i;
  }

  return { rpoOrder, rpoIndex, numReachable };
}

function computeDominators(cfg) {
  const blocks = cfg.blocks;
  const numBlocks = blocks.length;
  const entryId = cfg.entry ? cfg.entry.id : 0;

  const { rpoOrder, rpoIndex, numReachable } = computeRPO(blocks, entryId);

  const idoms = new Int32Array(numBlocks);
  idoms.fill(-1);
  idoms[entryId] = entryId;

  function intersect(b1, b2) {
    let finger1 = b1;
    let finger2 = b2;
    while (finger1 !== finger2) {
      while (rpoIndex[finger1] > rpoIndex[finger2]) {
        finger1 = idoms[finger1];
      }
      while (rpoIndex[finger2] > rpoIndex[finger1]) {
        finger2 = idoms[finger2];
      }
    }
    return finger1;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < numReachable; i++) {
      const u = rpoOrder[i];
      const preds = blocks[u].predecessors;
      let newIdom = -1;

      for (let j = 0; j < preds.length; j++) {
        const p = preds[j];
        if (idoms[p] !== -1) {
          newIdom = p;
          break;
        }
      }

      if (newIdom !== -1) {
        for (let j = 0; j < preds.length; j++) {
          const p = preds[j];
          if (p !== newIdom && idoms[p] !== -1) {
            newIdom = intersect(p, newIdom);
          }
        }

        if (idoms[u] !== newIdom) {
          idoms[u] = newIdom;
          changed = true;
        }
      }
    }
  }

  idoms[entryId] = -1;

  // Build Dominator Tree children
  const dominatorTree = {};
  const immediateDominators = {};
  const dominators = {};

  for (let i = 0; i < numBlocks; i++) {
    dominatorTree[i] = [];
    immediateDominators[i] = idoms[i] === -1 ? null : idoms[i];
  }

  for (let i = 0; i < numBlocks; i++) {
    const parent = idoms[i];
    if (parent !== -1 && dominatorTree[parent]) {
      dominatorTree[parent].push(i);
    }
  }

  // Compute full dominator sets
  for (let i = 0; i < numBlocks; i++) {
    const set = [];
    let curr = i;
    while (curr !== -1) {
      set.push(curr);
      curr = idoms[curr];
    }
    dominators[i] = set;
  }

  // Compute Dominance Frontiers in O(E)
  const dominanceFrontier = {};
  for (let i = 0; i < numBlocks; i++) {
    dominanceFrontier[i] = [];
  }

  for (let u = 0; u < numBlocks; u++) {
    const preds = blocks[u].predecessors;
    if (preds.length >= 2) {
      const idomU = idoms[u];
      for (let j = 0; j < preds.length; j++) {
        let runner = preds[j];
        while (runner !== -1 && runner !== idomU && runner !== u) {
          if (!dominanceFrontier[runner].includes(u)) {
            dominanceFrontier[runner].push(u);
          }
          runner = idoms[runner];
        }
      }
    }
  }

  cfg.dominators = dominators;
  cfg.immediateDominators = immediateDominators;
  cfg.dominatorTree = dominatorTree;
  cfg.dominanceFrontier = dominanceFrontier;
  cfg.rpoOrder = Array.from(rpoOrder);
  cfg.rpoIndex = rpoIndex;

  return { idoms, dominatorTree, dominanceFrontier };
}

// ---------------------------------------------------------------------------
// 2. Post-Dominator Tree & Control Dependence Graph (CDG)
// ---------------------------------------------------------------------------

function computePostDominators(cfg) {
  const blocks = cfg.blocks;
  const numBlocks = blocks.length;
  const exitId = cfg.exit ? cfg.exit.id : numBlocks - 1;

  // Build Reverse CFG blocks
  const revBlocks = [];
  for (let i = 0; i < numBlocks; i++) {
    revBlocks.push({
      id: i,
      successors: blocks[i].predecessors,
      predecessors: blocks[i].successors,
    });
  }

  const { rpoOrder, rpoIndex, numReachable } = computeRPO(revBlocks, exitId);

  const ipdoms = new Int32Array(numBlocks);
  ipdoms.fill(-1);
  ipdoms[exitId] = exitId;

  function intersect(b1, b2) {
    let finger1 = b1;
    let finger2 = b2;
    while (finger1 !== finger2) {
      while (rpoIndex[finger1] > rpoIndex[finger2]) {
        finger1 = ipdoms[finger1];
      }
      while (rpoIndex[finger2] > rpoIndex[finger1]) {
        finger2 = ipdoms[finger2];
      }
    }
    return finger1;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < numReachable; i++) {
      const u = rpoOrder[i];
      const preds = revBlocks[u].predecessors;
      let newIpdom = -1;

      for (let j = 0; j < preds.length; j++) {
        const p = preds[j];
        if (ipdoms[p] !== -1) {
          newIpdom = p;
          break;
        }
      }

      if (newIpdom !== -1) {
        for (let j = 0; j < preds.length; j++) {
          const p = preds[j];
          if (p !== newIpdom && ipdoms[p] !== -1) {
            newIpdom = intersect(p, newIpdom);
          }
        }

        if (ipdoms[u] !== newIpdom) {
          ipdoms[u] = newIpdom;
          changed = true;
        }
      }
    }
  }

  ipdoms[exitId] = -1;

  const postDominatorTree = {};
  const immediatePostDominators = {};
  for (let i = 0; i < numBlocks; i++) {
    postDominatorTree[i] = [];
    immediatePostDominators[i] = ipdoms[i] === -1 ? null : ipdoms[i];
  }

  for (let i = 0; i < numBlocks; i++) {
    const parent = ipdoms[i];
    if (parent !== -1 && postDominatorTree[parent]) {
      postDominatorTree[parent].push(i);
    }
  }

  // Reverse Dominance Frontiers (RDF / PDF)
  const postDominanceFrontier = {};
  for (let i = 0; i < numBlocks; i++) {
    postDominanceFrontier[i] = [];
  }

  for (let u = 0; u < numBlocks; u++) {
    const preds = revBlocks[u].predecessors;
    if (preds.length >= 2) {
      const ipdomU = ipdoms[u];
      for (let j = 0; j < preds.length; j++) {
        let runner = preds[j];
        while (runner !== -1 && runner !== ipdomU && runner !== u) {
          if (!postDominanceFrontier[runner].includes(u)) {
            postDominanceFrontier[runner].push(u);
          }
          runner = ipdoms[runner];
        }
      }
    }
  }

  // Control Dependence Graph: block Y is control-dependent on X iff X in PDF(Y)
  const controlDependence = {};
  for (let i = 0; i < numBlocks; i++) {
    controlDependence[i] = [];
  }
  for (let y = 0; y < numBlocks; y++) {
    const frontier = postDominanceFrontier[y];
    for (let j = 0; j < frontier.length; j++) {
      const x = frontier[j];
      if (!controlDependence[x].includes(y)) {
        controlDependence[x].push(y);
      }
    }
  }

  cfg.immediatePostDominators = immediatePostDominators;
  cfg.postDominatorTree = postDominatorTree;
  cfg.postDominanceFrontier = postDominanceFrontier;
  cfg.controlDependence = controlDependence;

  return { ipdoms, postDominatorTree, postDominanceFrontier, controlDependence };
}

// ---------------------------------------------------------------------------
// 3. Natural Loop Analysis (Headers, Latches, Exits, Loop Tree)
// ---------------------------------------------------------------------------

function dominates(cfg, a, b) {
  if (a === b) return true;
  if (!cfg.dominators || !cfg.dominators[b]) return false;
  return cfg.dominators[b].includes(a);
}

function analyzeLoops(cfg) {
  if (!cfg.dominators) {
    computeDominators(cfg);
  }

  const blocks = cfg.blocks;
  const numBlocks = blocks.length;
  const backEdges = [];

  // 1. Find all back-edges: edge (u -> h) where h dominates u
  for (let u = 0; u < numBlocks; u++) {
    const succs = blocks[u].successors;
    for (let j = 0; j < succs.length; j++) {
      const h = succs[j];
      if (dominates(cfg, h, u)) {
        backEdges.push({ from: u, to: h });
      }
    }
  }

  // 2. Compute natural loop for each back-edge
  const loopMap = new Map(); // header -> LoopObject

  for (let i = 0; i < backEdges.length; i++) {
    const { from: latch, to: header } = backEdges[i];
    let loop = loopMap.get(header);
    if (!loop) {
      loop = {
        header,
        latches: [],
        blocks: new Set([header]),
        exits: [],
        exitBlocks: new Set(),
        parent: null,
        children: [],
        depth: 1,
        isReducible: true,
      };
      loopMap.set(header, loop);
    }
    loop.latches.push(latch);
    loop.blocks.add(latch);

    // Backward DFS from latch to header
    const stack = [latch];
    while (stack.length > 0) {
      const curr = stack.pop();
      const preds = blocks[curr].predecessors;
      for (let k = 0; k < preds.length; k++) {
        const p = preds[k];
        if (!loop.blocks.has(p)) {
          loop.blocks.add(p);
          stack.push(p);
        }
      }
    }
  }

  const loops = Array.from(loopMap.values());

  // 3. Find loop exits & exit blocks
  loops.forEach((loop) => {
    loop.blocks.forEach((bId) => {
      const succs = blocks[bId].successors;
      succs.forEach((succId) => {
        if (!loop.blocks.has(succId)) {
          loop.exits.push({ from: bId, to: succId });
          loop.exitBlocks.add(succId);
        }
      });
    });
    loop.exitBlocks = Array.from(loop.exitBlocks);
    loop.blocksArray = Array.from(loop.blocks);
  });

  // 4. Build Loop Nesting Tree (containment hierarchy)
  loops.sort((a, b) => b.blocks.size - a.blocks.size); // Outer loops first

  for (let i = 0; i < loops.length; i++) {
    const inner = loops[i];
    for (let j = i - 1; j >= 0; j--) {
      const outer = loops[j];
      // Check if outer contains inner
      let containsAll = true;
      for (const b of inner.blocks) {
        if (!outer.blocks.has(b)) {
          containsAll = false;
          break;
        }
      }
      if (containsAll) {
        inner.parent = outer.header;
        outer.children.push(inner);
        inner.depth = outer.depth + 1;
        break;
      }
    }
  }

  cfg.loops = loops;
  return loops;
}

// ---------------------------------------------------------------------------
// 4. CFG Simplification Passes
// ---------------------------------------------------------------------------

function simplifyCFG(cfg) {
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    iterations += 1;

    // Pass 1: Eliminate Unreachable Blocks from entry
    const entryId = cfg.entry.id;
    const { numReachable, rpoIndex } = computeRPO(cfg.blocks, entryId);
    if (numReachable < cfg.blocks.length) {
      for (let i = 0; i < cfg.blocks.length; i++) {
        if (rpoIndex[i] === -1 && i !== cfg.exit.id) {
          const dead = cfg.blocks[i];
          for (const succId of dead.successors.slice()) {
            disconnect(dead, cfg.blocks[succId]);
          }
          for (const predId of dead.predecessors.slice()) {
            disconnect(cfg.blocks[predId], dead);
          }
          dead.statements = [];
          changed = true;
        }
      }
    }

    // Pass 2: Inline Empty Trampoline Blocks (A -> Trampoline -> B ==> A -> B)
    for (let i = 0; i < cfg.blocks.length; i++) {
      const b = cfg.blocks[i];
      if (i === entryId || i === cfg.exit.id) continue;
      if (b.statements.length === 0 && b.successors.length === 1 && b.predecessors.length > 0) {
        const targetId = b.successors[0];
        if (targetId !== i) {
          const target = cfg.blocks[targetId];
          const preds = b.predecessors.slice();
          for (const predId of preds) {
            const pred = cfg.blocks[predId];
            disconnect(pred, b);
            connect(pred, target);
          }
          disconnect(b, target);
          changed = true;
        }
      }
    }

    // Pass 3: Merge Sequential Blocks (A -> B where A has single succ B and B has single pred A)
    for (let i = 0; i < cfg.blocks.length; i++) {
      const a = cfg.blocks[i];
      if (a.successors.length === 1) {
        const bId = a.successors[0];
        if (bId !== i && bId !== entryId && bId !== cfg.exit.id) {
          const b = cfg.blocks[bId];
          if (b.predecessors.length === 1 && b.predecessors[0] === i) {
            // Merge B into A
            a.statements.push(...b.statements);
            const bSuccs = b.successors.slice();
            disconnect(a, b);
            for (const sId of bSuccs) {
              const s = cfg.blocks[sId];
              disconnect(b, s);
              connect(a, s);
            }
            b.statements = [];
            changed = true;
          }
        }
      }
    }
  }

  // Refresh dominators and post-dominators
  computeDominators(cfg);
  computePostDominators(cfg);
  analyzeLoops(cfg);

  return cfg;
}

// ---------------------------------------------------------------------------
// 5. Pattern-Independent Structuring Engine (CFG -> Structured Luau AST)
// ---------------------------------------------------------------------------

function structureCFG(cfg) {
  if (!cfg.immediatePostDominators) {
    computeDominators(cfg);
    computePostDominators(cfg);
    analyzeLoops(cfg);
  }

  const blocks = cfg.blocks;
  const loopMap = new Map();
  if (cfg.loops) {
    cfg.loops.forEach((l) => loopMap.set(l.header, l));
  }

  const visited = new Uint8Array(blocks.length);

  function structureRegion(startId, stopId, loopCtx = null) {
    const stmts = [];
    let currentId = startId;

    while (currentId !== null && currentId !== undefined && currentId !== stopId) {
      if (currentId >= blocks.length || visited[currentId]) {
        break;
      }

      const block = blocks[currentId];
      visited[currentId] = 1;

      // 1. Check if current block is a Natural Loop Header
      const loop = loopMap.get(currentId);
      if (loop && (!loopCtx || loopCtx.header !== currentId)) {
        const loopExit = loop.exitBlocks.length === 1 ? loop.exitBlocks[0] : null;
        const newLoopCtx = {
          header: currentId,
          latches: loop.latches,
          exit: loopExit,
          parent: loopCtx,
        };

        // Determine if while loop or repeat loop
        let loopStmt;
        const headerSuccs = block.successors;

        if (headerSuccs.length === 2 && loopExit && headerSuccs.includes(loopExit)) {
          // While loop with condition at header
          const bodyEntry = headerSuccs[0] === loopExit ? headerSuccs[1] : headerSuccs[0];
          const condStmt = block.statements.find((s) => s.type === "IfStatement" || s.type === "WhileStatement");
          const condition = condStmt && condStmt.clauses && condStmt.clauses[0]
            ? condStmt.clauses[0].condition
            : (condStmt && condStmt.condition ? condStmt.condition : { type: "BooleanLiteral", value: true });

          const loopBodyStmts = structureRegion(bodyEntry, currentId, newLoopCtx);
          loopStmt = {
            type: "WhileStatement",
            condition,
            body: { type: "Block", body: loopBodyStmts },
          };
        } else if (loop.latches.length === 1 && blocks[loop.latches[0]].successors.length === 2) {
          // Repeat ... until loop
          const latchBlock = blocks[loop.latches[0]];
          const condStmt = latchBlock.statements.find((s) => s.type === "RepeatStatement" || s.type === "IfStatement");
          const condition = condStmt && condStmt.condition
            ? condStmt.condition
            : { type: "BooleanLiteral", value: true };

          const loopBodyStmts = structureRegion(currentId, loop.latches[0], newLoopCtx);
          loopStmt = {
            type: "RepeatStatement",
            condition,
            body: { type: "Block", body: loopBodyStmts },
          };
        } else {
          // General While true loop
          const loopBodyStmts = structureRegion(currentId, null, newLoopCtx);
          loopStmt = {
            type: "WhileStatement",
            condition: { type: "BooleanLiteral", value: true },
            body: { type: "Block", body: loopBodyStmts },
          };
        }

        stmts.push(loopStmt);
        currentId = loopExit;
        continue;
      }

      // 2. Check if current block jumps to loop exit (Break) or loop latch (Continue)
      if (loopCtx) {
        if (currentId === loopCtx.exit) {
          stmts.push({ type: "BreakStatement" });
          break;
        }
        if (loopCtx.latches.includes(currentId)) {
          stmts.push(...block.statements.filter((s) => s.type !== "IfStatement" && s.type !== "WhileStatement" && s.type !== "RepeatStatement"));
          stmts.push({ type: "ContinueStatement" });
          break;
        }
      }

      // 3. Conditional Branch Structuring (If-Then / If-Then-Else)
      const succs = block.successors;
      if (succs.length === 2) {
        // Non-control flow statements from this block
        const normalStmts = block.statements.filter(
          (s) => s.type !== "IfStatement" && s.type !== "WhileStatement" && s.type !== "RepeatStatement"
        );
        stmts.push(...normalStmts);

        const condStmt = block.statements.find((s) => s.type === "IfStatement");
        const condition = condStmt && condStmt.clauses && condStmt.clauses[0]
          ? condStmt.clauses[0].condition
          : { type: "BooleanLiteral", value: true };

        const mergeBlockId = cfg.immediatePostDominators[currentId];
        const thenBlockId = succs[0];
        const elseBlockId = succs[1];

        if (elseBlockId === mergeBlockId) {
          // Simple If-Then (no else)
          const thenStmts = structureRegion(thenBlockId, mergeBlockId, loopCtx);
          stmts.push({
            type: "IfStatement",
            clauses: [{ condition, body: { type: "Block", body: thenStmts } }],
            elseBody: null,
          });
          currentId = mergeBlockId;
        } else if (thenBlockId === mergeBlockId) {
          // Inverted If-Then
          const thenStmts = structureRegion(elseBlockId, mergeBlockId, loopCtx);
          stmts.push({
            type: "IfStatement",
            clauses: [
              {
                condition: { type: "UnaryExpression", operator: "not", argument: condition },
                body: { type: "Block", body: thenStmts },
              },
            ],
            elseBody: null,
          });
          currentId = mergeBlockId;
        } else {
          // Full If-Then-Else
          const thenStmts = structureRegion(thenBlockId, mergeBlockId, loopCtx);
          const elseStmts = structureRegion(elseBlockId, mergeBlockId, loopCtx);
          stmts.push({
            type: "IfStatement",
            clauses: [{ condition, body: { type: "Block", body: thenStmts } }],
            elseBody: { type: "Block", body: elseStmts },
          });
          currentId = mergeBlockId;
        }
        continue;
      }

      // 4. Sequential block
      stmts.push(...block.statements);
      if (succs.length === 1) {
        currentId = succs[0];
      } else {
        break;
      }
    }

    return stmts;
  }

  const structuredBody = structureRegion(cfg.entry.id, cfg.exit.id, null);
  return {
    type: "Chunk",
    body: structuredBody,
  };
}

// ---------------------------------------------------------------------------
// 6. AST Building & CFG Construction
// ---------------------------------------------------------------------------

function scanExpressionForFunctions(node, ctx) {
  if (!isNode(node)) {
    return;
  }
  if (node.type === "FunctionExpression") {
    buildFunctionCFG(node, ctx.root, "function");
    return;
  }
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === "loc" || key === "range") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        scanExpressionForFunctions(value[j], ctx);
      }
    } else if (isNode(value)) {
      scanExpressionForFunctions(value, ctx);
    }
  }
}

function processStatementExpressions(stmt, ctx) {
  switch (stmt.type) {
    case "LocalStatement":
    case "AssignmentStatement":
      if (stmt.variables) {
        for (let i = 0; i < stmt.variables.length; i++) scanExpressionForFunctions(stmt.variables[i], ctx);
      }
      if (stmt.init) {
        for (let i = 0; i < stmt.init.length; i++) scanExpressionForFunctions(stmt.init[i], ctx);
      }
      return;
    case "CompoundAssignmentStatement":
      scanExpressionForFunctions(stmt.variable, ctx);
      scanExpressionForFunctions(stmt.value, ctx);
      return;
    case "CallStatement":
      scanExpressionForFunctions(stmt.expression, ctx);
      return;
    case "ReturnStatement":
      if (stmt.arguments) {
        for (let i = 0; i < stmt.arguments.length; i++) scanExpressionForFunctions(stmt.arguments[i], ctx);
      }
      return;
    case "IfStatement":
      if (stmt.clauses) {
        for (let i = 0; i < stmt.clauses.length; i++) scanExpressionForFunctions(stmt.clauses[i].condition, ctx);
      }
      return;
    case "WhileStatement":
    case "RepeatStatement":
      scanExpressionForFunctions(stmt.condition, ctx);
      return;
    case "ForNumericStatement":
      scanExpressionForFunctions(stmt.start, ctx);
      scanExpressionForFunctions(stmt.end, ctx);
      if (stmt.step) scanExpressionForFunctions(stmt.step, ctx);
      return;
    case "ForGenericStatement":
      if (stmt.iterators) {
        for (let i = 0; i < stmt.iterators.length; i++) scanExpressionForFunctions(stmt.iterators[i], ctx);
      }
      return;
    default:
      return;
  }
}

function buildSequence(statements, ctx, startBlock) {
  let current = startBlock || createBlock(ctx.cfg, "block");
  const entry = current;

  for (const stmt of statements) {
    if (!current) {
      current = createBlock(ctx.cfg, "block");
    }

    processStatementExpressions(stmt, ctx);

    if (stmt.type === "LabelStatement") {
      if (current.statements.length) {
        const labelBlock = createBlock(ctx.cfg, "label");
        connect(current, labelBlock);
        current = labelBlock;
      }
      current.statements.push(stmt);
      const labelName = stmt.name && (stmt.name.name || stmt.name);
      if (labelName) {
        if (!ctx.labels.has(labelName)) {
          ctx.labels.set(labelName, current);
        }
        const pending = ctx.pendingGotos.get(labelName);
        if (pending) {
          for (let p = 0; p < pending.length; p++) {
            connect(pending[p], current);
          }
          ctx.pendingGotos.delete(labelName);
        }
      }
      continue;
    }

    switch (stmt.type) {
      case "FunctionDeclaration":
        current.statements.push(stmt);
        buildFunctionCFG(stmt, ctx.root, "function");
        break;
      case "TypeFunctionStatement":
      case "ExportTypeFunctionStatement":
        current.statements.push(stmt);
        buildFunctionCFG(stmt, ctx.root, "type-function");
        break;
      case "IfStatement": {
        current.statements.push(stmt);
        const afterBlock = createBlock(ctx.cfg, "join");
        for (let c = 0; c < stmt.clauses.length; c++) {
          const clause = stmt.clauses[c];
          const clauseEntry = createBlock(ctx.cfg, "if");
          connect(current, clauseEntry);
          const clauseBody = clause.body ? (clause.body.body || clause.body) : [];
          const clauseResult = buildSequence(clauseBody, ctx, clauseEntry);
          for (let e = 0; e < clauseResult.exits.length; e++) {
            connect(clauseResult.exits[e], afterBlock);
          }
        }
        if (stmt.elseBody) {
          const elseEntry = createBlock(ctx.cfg, "else");
          connect(current, elseEntry);
          const elseBody = stmt.elseBody.body || stmt.elseBody;
          const elseResult = buildSequence(elseBody, ctx, elseEntry);
          for (let e = 0; e < elseResult.exits.length; e++) {
            connect(elseResult.exits[e], afterBlock);
          }
        } else {
          connect(current, afterBlock);
        }
        current = afterBlock;
        break;
      }
      case "WhileStatement": {
        current.statements.push(stmt);
        const loopHead = current;
        const bodyEntry = createBlock(ctx.cfg, "loop-body");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(loopHead, bodyEntry);
        connect(loopHead, afterBlock);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
        const body = stmt.body ? (stmt.body.body || stmt.body) : [];
        const bodyResult = buildSequence(body, ctx, bodyEntry);
        for (let e = 0; e < bodyResult.exits.length; e++) {
          connect(bodyResult.exits[e], loopHead);
        }
        ctx.loopStack.pop();
        current = afterBlock;
        break;
      }
      case "RepeatStatement": {
        const bodyEntry = createBlock(ctx.cfg, "repeat-body");
        const condBlock = createBlock(ctx.cfg, "repeat-cond");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(current, bodyEntry);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: condBlock });
        const body = stmt.body ? (stmt.body.body || stmt.body) : [];
        const bodyResult = buildSequence(body, ctx, bodyEntry);
        for (let e = 0; e < bodyResult.exits.length; e++) {
          connect(bodyResult.exits[e], condBlock);
        }
        ctx.loopStack.pop();
        condBlock.statements.push(stmt);
        connect(condBlock, bodyEntry);
        connect(condBlock, afterBlock);
        current = afterBlock;
        break;
      }
      case "ForNumericStatement":
      case "ForGenericStatement": {
        current.statements.push(stmt);
        const loopHead = current;
        const bodyEntry = createBlock(ctx.cfg, "loop-body");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(loopHead, bodyEntry);
        connect(loopHead, afterBlock);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
        const body = stmt.body ? (stmt.body.body || stmt.body) : [];
        const bodyResult = buildSequence(body, ctx, bodyEntry);
        for (let e = 0; e < bodyResult.exits.length; e++) {
          connect(bodyResult.exits[e], loopHead);
        }
        ctx.loopStack.pop();
        current = afterBlock;
        break;
      }
      case "DoStatement": {
        const bodyEntry = createBlock(ctx.cfg, "do-body");
        const afterBlock = createBlock(ctx.cfg, "do-exit");
        current.statements.push(stmt);
        connect(current, bodyEntry);
        const body = stmt.body ? (stmt.body.body || stmt.body) : [];
        const bodyResult = buildSequence(body, ctx, bodyEntry);
        for (let e = 0; e < bodyResult.exits.length; e++) {
          connect(bodyResult.exits[e], afterBlock);
        }
        current = afterBlock;
        break;
      }
      case "ReturnStatement":
        current.statements.push(stmt);
        connect(current, ctx.exitBlock);
        current = null;
        break;
      case "BreakStatement": {
        current.statements.push(stmt);
        const target = ctx.loopStack.length ? ctx.loopStack[ctx.loopStack.length - 1].breakTarget : ctx.exitBlock;
        connect(current, target);
        current = null;
        break;
      }
      case "ContinueStatement": {
        current.statements.push(stmt);
        const target = ctx.loopStack.length ? ctx.loopStack[ctx.loopStack.length - 1].continueTarget : ctx.exitBlock;
        connect(current, target);
        current = null;
        break;
      }
      case "GotoStatement": {
        current.statements.push(stmt);
        const labelName = stmt.name && (stmt.name.name || stmt.name);
        if (labelName && ctx.labels.has(labelName)) {
          connect(current, ctx.labels.get(labelName));
        } else if (labelName) {
          const pending = ctx.pendingGotos.get(labelName);
          if (pending) {
            pending.push(current);
          } else {
            ctx.pendingGotos.set(labelName, [current]);
          }
        } else {
          connect(current, ctx.exitBlock);
        }
        current = null;
        break;
      }
      default:
        current.statements.push(stmt);
        break;
    }
  }

  const exits = [];
  if (current) {
    exits.push(current);
  }
  return { entry, exits };
}

function buildFunctionCFG(node, root, kind) {
  const cfg = {
    node,
    kind,
    blocks: [],
    entry: null,
    exit: null,
    dominators: null,
    immediateDominators: null,
    dominatorTree: null,
    dominanceFrontier: null,
    immediatePostDominators: null,
    postDominatorTree: null,
    postDominanceFrontier: null,
    controlDependence: null,
    loops: null,
  };
  cfg.entry = createBlock(cfg, "entry");
  cfg.exit = createBlock(cfg, "exit");

  const ctx = {
    cfg,
    exitBlock: cfg.exit,
    loopStack: [],
    root,
    labels: new Map(),
    pendingGotos: new Map(),
  };

  const bodyStatements = node.type === "Chunk" ? node.body : (node.body ? (node.body.body || node.body) : []);
  const result = buildSequence(bodyStatements, ctx, cfg.entry);
  for (let i = 0; i < result.exits.length; i++) {
    connect(result.exits[i], cfg.exit);
  }
  for (const pending of ctx.pendingGotos.values()) {
    for (let p = 0; p < pending.length; p++) {
      connect(pending[p], cfg.exit);
    }
  }

  computeDominators(cfg);
  computePostDominators(cfg);
  analyzeLoops(cfg);

  root.functions.push(cfg);
  return cfg;
}

function buildCFG(ast) {
  const root = { functions: [] };
  buildFunctionCFG(ast, root, "chunk");
  return root;
}

module.exports = {
  buildCFG,
  createBlock,
  connect,
  disconnect,
  computeDominators,
  computePostDominators,
  analyzeLoops,
  simplifyCFG,
  structureCFG,
};
