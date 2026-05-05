const { walk } = require("./ast");
const { collectIdentifierNames, makeNameFactory } = require("./names");

const SUPPORTED_STATEMENTS = new Set([
  "LocalStatement",
  "AssignmentStatement",
  "CompoundAssignmentStatement",
  "CallStatement",
  "ReturnStatement",
]);

function buildStateValues(count, rng) {
  const poolSize = Math.max(count * 3, count + 5);
  const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
  rng.shuffle(pool);
  const isLinearStep = (values) => {
    if (values.length < 3) {
      return true;
    }
    const step = values[1] - values[0];
    for (let i = 2; i < values.length; i += 1) {
      if (values[i] - values[i - 1] !== step) {
        return false;
      }
    }
    return true;
  };
  let values = pool.slice(0, count);
  for (let attempt = 0; attempt < 5 && isLinearStep(values); attempt += 1) {
    rng.shuffle(pool);
    values = pool.slice(0, count);
  }
  return values;
}

function pickUnusedNumber(used, rng, min, max) {
  let value = rng.int(min, max);
  let attempts = 0;
  while (used.has(value)) {
    value = rng.int(min, max);
    attempts += 1;
    if (attempts > 24) {
      value = max + attempts;
    }
  }
  used.add(value);
  return value;
}

function getFunctionStatements(node) {
  if (!node || !node.body) {
    return null;
  }
  if (Array.isArray(node.body)) {
    return { statements: node.body, style: "luaparse" };
  }
  if (node.body && Array.isArray(node.body.body)) {
    return { statements: node.body.body, style: "custom" };
  }
  return null;
}

function getFunctionName(fnNode) {
  if (!fnNode) {
    return null;
  }
  if (fnNode.name && fnNode.name.type === "FunctionName") {
    const parts = [fnNode.name.base.name, ...(fnNode.name.members || []).map((m) => m.name)];
    if (fnNode.name.method) {
      parts.push(fnNode.name.method.name);
    }
    return parts.join(".");
  }
  if (fnNode.identifier && fnNode.identifier.type === "Identifier") {
    return fnNode.identifier.name;
  }
  return null;
}

function shouldSkipForVm(node, options) {
  if (!options || !options.vm || options.vm.enabled === false || !node) {
    return false;
  }
  const include = Array.isArray(options.vm.include) ? options.vm.include : [];
  if (options.vm.all || include.length === 0) {
    return true;
  }
  const name = getFunctionName(node);
  return Boolean(name && include.includes(name));
}

function setFunctionStatements(node, statements, style) {
  if (style === "luaparse") {
    node.body = statements;
  } else if (node.body && node.body.type === "Block") {
    node.body.body = statements;
  }
}

function hasUnsupportedStatements(statements) {
  for (const stmt of statements) {
    if (!stmt || !stmt.type || !SUPPORTED_STATEMENTS.has(stmt.type)) {
      return true;
    }
  }
  return false;
}

function numericLiteral(value) {
  return { type: "NumericLiteral", value, raw: String(value) };
}

function stringLiteral(value) {
  return { type: "StringLiteral", value, raw: JSON.stringify(value) };
}

function escapedByteStringLiteral(value) {
  const bytes = Array.from(Buffer.from(String(value), "utf8"));
  const raw = `"${bytes.map((byte) => `\\${String(byte).padStart(3, "0")}`).join("")}"`;
  return { type: "StringLiteral", value, raw };
}

function identifier(name) {
  return { type: "Identifier", name };
}

function binaryExpression(operator, left, right) {
  return { type: "BinaryExpression", operator, left, right };
}

function logicalAnd(left, right, style) {
  if (style === "luaparse") {
    return { type: "LogicalExpression", operator: "and", left, right };
  }
  return { type: "BinaryExpression", operator: "and", left, right };
}

function logicalOr(left, right, style) {
  if (style === "luaparse") {
    return { type: "LogicalExpression", operator: "or", left, right };
  }
  return { type: "BinaryExpression", operator: "or", left, right };
}

function indexExpression(base, index) {
  return { type: "IndexExpression", base, index };
}

function callExpression(base, args = []) {
  return { type: "CallExpression", base, arguments: args };
}

function assignmentStatement(variable, value) {
  return { type: "AssignmentStatement", variables: [variable], init: [value] };
}

function localStatement(variable, value) {
  return { type: "LocalStatement", variables: [variable], init: [value] };
}

function callStatement(expression) {
  return { type: "CallStatement", expression };
}

function returnStatement(args = []) {
  return { type: "ReturnStatement", arguments: args };
}

function cloneNode(node) {
  if (!node || typeof node !== "object") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => cloneNode(item));
  }
  const out = {};
  Object.keys(node).forEach((key) => {
    out[key] = cloneNode(node[key]);
  });
  return out;
}

function buildTableList(values, style) {
  const fields = values.map((value) => {
    if (style === "luaparse") {
      return { type: "TableValue", value };
    }
    return { type: "TableField", kind: "list", value };
  });
  return { type: "TableConstructorExpression", fields };
}

function buildTableIndex(pairs, style) {
  const fields = pairs.map(({ key, value }) => {
    if (style === "luaparse") {
      return { type: "TableKey", key, value };
    }
    return { type: "TableField", kind: "index", key, value };
  });
  return { type: "TableConstructorExpression", fields };
}

function buildBlock(body, style) {
  if (style === "luaparse") {
    return body;
  }
  return { type: "Block", body };
}

function buildFunctionExpression(body, style) {
  if (style === "luaparse") {
    return {
      cffGenerated: true,
      type: "FunctionDeclaration",
      identifier: null,
      parameters: [],
      isLocal: false,
      body,
    };
  }
  return {
    cffGenerated: true,
    type: "FunctionExpression",
    parameters: [],
    hasVararg: false,
    varargAnnotation: null,
    returnType: null,
    typeParameters: [],
    body: buildBlock(body, style),
  };
}

function buildIfStatement(cases, elseBody, style) {
  if (style === "luaparse") {
    const clauses = cases.map((entry, idx) => ({
      type: idx === 0 ? "IfClause" : "ElseifClause",
      condition: entry.condition,
      body: entry.body,
    }));
    clauses.push({ type: "ElseClause", body: elseBody });
    return { type: "IfStatement", clauses };
  }
  const clauses = cases.map((entry) => ({
    condition: entry.condition,
    body: buildBlock(entry.body, style),
  }));
  return { type: "IfStatement", clauses, elseBody: buildBlock(elseBody, style) };
}

function buildWhileStatement(condition, body, style) {
  return { type: "WhileStatement", condition, body: buildBlock(body, style) };
}

function buildOpaquePredicate(stateName, rng) {
  const subject = identifier(stateName);
  const template = rng.int(0, 3);
  if (template === 0) {
    const seed = rng.int(2, 13);
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression("*", subject, numericLiteral(seed)),
        numericLiteral(seed)
      ),
      numericLiteral(0)
    );
  }
  if (template === 1) {
    return binaryExpression(
      "==",
      binaryExpression("-", subject, subject),
      numericLiteral(0)
    );
  }
  if (template === 2) {
    const seed = rng.int(3, 19);
    return binaryExpression(
      "==",
      binaryExpression(
        "-",
        binaryExpression("+", subject, numericLiteral(seed)),
        subject
      ),
      numericLiteral(seed)
    );
  }
  return binaryExpression(
    "==",
    binaryExpression("%", subject, numericLiteral(1)),
    numericLiteral(0)
  );
}

function buildFakeAssignment(targetName, sourceExpr, modulusValue) {
  return assignmentStatement(
    identifier(targetName),
    binaryExpression(
      "%",
      binaryExpression("+", identifier(targetName), sourceExpr),
      numericLiteral(modulusValue)
    )
  );
}

function buildModuloExpression(left, right, modulusValue) {
  return binaryExpression(
    "%",
    binaryExpression("+", left, right),
    numericLiteral(modulusValue)
  );
}

function createLinearCodec(rng, scaleMin, scaleMax, biasMin, biasMax) {
  const scale = rng.int(scaleMin, scaleMax);
  const bias = rng.int(biasMin, biasMax);
  return {
    scale,
    bias,
    encode(value) {
      return value * scale + bias;
    },
  };
}

function buildShardLookup(names, keyExpr, style) {
  const lookups = names.map((name) => indexExpression(identifier(name), cloneNode(keyExpr)));
  if (lookups.length === 1) {
    return lookups[0];
  }
  return lookups.slice(1).reduce((left, right) => logicalOr(left, right, style), lookups[0]);
}

function buildFakeStateBody(rng, names, index) {
  const {
    trashAName,
    trashBName,
    slotName,
    stateName,
  } = names;
  const modA = rng.int(97, 251);
  const modB = rng.int(127, 283);
  const template = rng.int(0, 2);

  if (template === 0) {
    return [
      buildFakeAssignment(trashAName, identifier(slotName), modA),
      buildFakeAssignment(
        trashBName,
        binaryExpression("+", identifier(stateName), numericLiteral(index + 1)),
        modB
      ),
    ];
  }

  if (template === 1) {
    return [
      assignmentStatement(
        identifier(trashAName),
        buildModuloExpression(
          binaryExpression("*", identifier(trashAName), numericLiteral(rng.int(2, 5))),
          identifier(slotName),
          modA
        )
      ),
      assignmentStatement(
        identifier(trashBName),
        buildModuloExpression(
          binaryExpression("+", identifier(trashBName), identifier(trashAName)),
          numericLiteral(index + 1),
          modB
        )
      ),
    ];
  }

  return [
    assignmentStatement(
      identifier(trashAName),
      buildModuloExpression(
        identifier(trashBName),
        identifier(stateName),
        modA
      )
    ),
    assignmentStatement(
      identifier(trashBName),
      buildModuloExpression(
        identifier(slotName),
        numericLiteral(index + rng.int(2, 9)),
        modB
      )
    ),
  ];
}

function addNamesFromSSA(ssa, used) {
  if (!ssa || !used) {
    return;
  }
  if (Array.isArray(ssa.variables)) {
    ssa.variables.forEach((name) => {
      if (name) {
        used.add(name);
      }
    });
  }
  const addVersioned = (value) => {
    if (!value || typeof value !== "string") {
      return;
    }
    const base = value.split("$", 1)[0];
    if (base) {
      used.add(base);
    }
  };
  if (ssa.uses && typeof ssa.uses.forEach === "function") {
    ssa.uses.forEach((value) => addVersioned(value));
  }
  if (ssa.defs && typeof ssa.defs.forEach === "function") {
    ssa.defs.forEach((value) => addVersioned(value));
  }
  if (ssa.blocks) {
    Object.values(ssa.blocks).forEach((block) => {
      if (block && Array.isArray(block.phi)) {
        block.phi.forEach((phi) => {
          if (phi && phi.variable) {
            used.add(phi.variable);
          }
        });
      }
    });
  }
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

function extractLocalName(variable) {
  if (!variable || variable.type !== "Identifier" || typeof variable.name !== "string") {
    return null;
  }
  return variable.name;
}

function prepareFlattenStatements(statements) {
  const hoisted = [];
  const seen = new Set();
  const rewritten = [];
  for (const stmt of statements) {
    if (!stmt || stmt.type !== "LocalStatement") {
      rewritten.push(stmt);
      continue;
    }
    const variables = Array.isArray(stmt.variables) ? stmt.variables : [];
    for (const variable of variables) {
      const name = extractLocalName(variable);
      if (!name || seen.has(name)) {
        return null;
      }
      seen.add(name);
      hoisted.push(cloneNode(variable));
    }
    const init = Array.isArray(stmt.init) && stmt.init.length
      ? cloneNode(stmt.init)
      : variables.map(() => ({ type: "NilLiteral", value: null }));
    rewritten.push({
      type: "AssignmentStatement",
      variables: cloneNode(variables),
      init,
    });
  }
  return { hoisted, rewritten };
}

function buildFlattenedStatements(statements, ctx, style, usedNames = null) {
  const { rng } = ctx;
  const used = usedNames || collectIdentifierNames({ type: "Chunk", body: statements });
  const nameFor = makeNameFactory(rng, used);
  const stateName = nameFor("cff_state");
  const exitName = nameFor("cff_exit");
  const nextNames = [nameFor("cff_next"), nameFor("cff_next")];
  const dispatchNames = [nameFor("cff_dispatch"), nameFor("cff_dispatch")];
  const valuesName = nameFor("cff_vals");
  const slotName = nameFor("cff_slot");
  const handlerName = nameFor("cff_handler");
  const handlerNames = [nameFor("cff_handlers"), nameFor("cff_handlers")];
  const packName = nameFor("cff_pack");
  const unpackName = nameFor("cff_unpack");
  const returnPackName = nameFor("cff_ret");
  const trashAName = nameFor("cff_trash");
  const trashBName = nameFor("cff_trash");

  const count = statements.length;
  const stateValues = buildStateValues(count, rng);
  const stateCodec = createLinearCodec(rng, 2, 7, 11, 79);
  const dispatchCodec = createLinearCodec(rng, 2, 9, 17, 113);
  const usedStates = new Set(stateValues);
  const usedDispatch = new Set();
  const exitState = pickUnusedNumber(usedStates, rng, count * 4 + 7, count * 12 + 97);
  const dispatchValues = stateValues.map(() =>
    pickUnusedNumber(usedDispatch, rng, count * 5 + 11, count * 15 + 131)
  );
  const nextStates = stateValues.map((_, idx) => (idx < count - 1 ? stateValues[idx + 1] : exitState));
  const nonTerminalIndices = statements
    .map((stmt, index) => (stmt.type === "ReturnStatement" ? null : index))
    .filter((index) => index !== null);
  rng.shuffle(nonTerminalIndices);
  const maxFakeTransitions = Math.min(
    3,
    Math.max(0, Math.min(nonTerminalIndices.length, Math.floor(count / 2)))
  );
  const fakeTransitionCount = count >= 4 && maxFakeTransitions > 0
    ? rng.int(1, maxFakeTransitions)
    : 0;
  const fakeTransitions = new Map();
  for (let i = 0; i < fakeTransitionCount; i += 1) {
    const realIndex = nonTerminalIndices[i];
    if (typeof realIndex !== "number") {
      continue;
    }
    fakeTransitions.set(realIndex, {
      state: pickUnusedNumber(usedStates, rng, count * 16 + 23, count * 40 + 211),
      dispatch: pickUnusedNumber(usedDispatch, rng, count * 18 + 31, count * 44 + 257),
    });
  }
  const order = Array.from({ length: count }, (_, i) => ({ kind: "real", index: i }));
  const nextPairs = [[], []];
  const dispatchPairs = [[], []];
  const directCases = [];
  const handlerPairs = [[], []];
  const allowIndirectHandlers = ctx.allowIndirectHandlers !== false;
  const hasReturnState = allowIndirectHandlers && statements.some((stmt) => stmt && stmt.type === "ReturnStatement");
  const useOpaque = ctx.options.cffOptions?.opaque !== false;
  const loopOpaque = useOpaque ? buildOpaquePredicate(stateName, rng) : null;

  // Real states dispatch through a second randomized token table. Some of them
  // intentionally bounce through fake states so the runtime path includes junk.
  stateValues.forEach((value, idx) => {
    const fake = fakeTransitions.get(idx);
    nextPairs[rng.int(0, nextPairs.length - 1)].push({
      key: numericLiteral(stateCodec.encode(value)),
      value: numericLiteral(stateCodec.encode(fake ? fake.state : nextStates[idx])),
    });
    dispatchPairs[rng.int(0, dispatchPairs.length - 1)].push({
      key: numericLiteral(stateCodec.encode(value)),
      value: numericLiteral(dispatchCodec.encode(dispatchValues[idx])),
    });
    if (fake) {
      nextPairs[rng.int(0, nextPairs.length - 1)].push({
        key: numericLiteral(stateCodec.encode(fake.state)),
        value: numericLiteral(stateCodec.encode(nextStates[idx])),
      });
      dispatchPairs[rng.int(0, dispatchPairs.length - 1)].push({
        key: numericLiteral(stateCodec.encode(fake.state)),
        value: numericLiteral(dispatchCodec.encode(fake.dispatch)),
      });
      order.push({ kind: "fake", index: idx });
    }
  });
  rng.shuffle(order);

  order.forEach((entry) => {
    const isFake = entry.kind === "fake";
    const index = entry.index;
    const stmt = statements[index];
    const dispatchValue = isFake
      ? fakeTransitions.get(index).dispatch
      : dispatchValues[index];
    const body = [];
    if (isFake) {
      body.push(...buildFakeStateBody(rng, {
        trashAName,
        trashBName,
        slotName,
        stateName,
      }, index));
    } else {
      body.push(stmt);
    }
    const caseOpaque = useOpaque ? buildOpaquePredicate(slotName, rng) : null;
    const condition = binaryExpression(
      "==",
      identifier(slotName),
      numericLiteral(dispatchCodec.encode(dispatchValue))
    );
    const caseEntry = {
      condition: caseOpaque ? logicalAnd(condition, caseOpaque, style) : condition,
      body,
    };
    if (!isFake && stmt.type === "ReturnStatement") {
      if (!allowIndirectHandlers) {
        directCases.push(caseEntry);
        return;
      }
      handlerPairs[rng.int(0, handlerPairs.length - 1)].push({
        key: numericLiteral(dispatchCodec.encode(dispatchValue)),
        value: buildFunctionExpression([
          assignmentStatement(
            identifier(returnPackName),
            callExpression(identifier(packName), cloneNode(stmt.arguments || []))
          ),
          assignmentStatement(identifier(stateName), identifier(exitName)),
        ], style),
      });
      return;
    } else {
      body.push(
        assignmentStatement(
          identifier(stateName),
          buildShardLookup(nextNames, identifier(stateName), style)
        )
      );
      if (!allowIndirectHandlers) {
        directCases.push(caseEntry);
      } else {
        handlerPairs[rng.int(0, handlerPairs.length - 1)].push({
          key: numericLiteral(dispatchCodec.encode(dispatchValue)),
          value: buildFunctionExpression(body, style),
        });
      }
    }
  });

  const elseBody = [
    assignmentStatement(identifier(stateName), identifier(exitName)),
  ];

  const whileBody = [
    localStatement(
      identifier(slotName),
      buildShardLookup(dispatchNames, identifier(stateName), style)
    ),
  ];
  if (!allowIndirectHandlers) {
    whileBody.push(buildIfStatement(directCases, elseBody, style));
  } else {
    const handlerCondition = useOpaque
      ? logicalAnd(identifier(handlerName), buildOpaquePredicate(slotName, rng), style)
      : identifier(handlerName);
    const cases = [
      {
        condition: handlerCondition,
        body: [
          callStatement(callExpression(identifier(handlerName))),
        ],
      },
    ];
    whileBody.push(
      localStatement(
        identifier(handlerName),
        buildShardLookup(handlerNames, identifier(slotName), style)
      )
    );
    whileBody.push(buildIfStatement(cases, elseBody, style));
  }

  const flattened = [
    localStatement(
      identifier(valuesName),
      buildTableList([
        numericLiteral(stateCodec.encode(stateValues[0])),
        numericLiteral(stateCodec.encode(exitState)),
      ], style)
    ),
    ...nextNames.map((name, idx) => localStatement(
      identifier(name),
      buildTableIndex(nextPairs[idx], style)
    )),
    ...dispatchNames.map((name, idx) => localStatement(
      identifier(name),
      buildTableIndex(dispatchPairs[idx], style)
    )),
    {
      type: "LocalStatement",
      variables: [identifier(trashAName), identifier(trashBName)],
      init: [numericLiteral(0), numericLiteral(0)],
    },
    localStatement(
      identifier(stateName),
      indexExpression(identifier(valuesName), numericLiteral(1))
    ),
    localStatement(
      identifier(exitName),
      indexExpression(identifier(valuesName), numericLiteral(2))
    ),
    buildWhileStatement(
      loopOpaque
        ? logicalAnd(
          binaryExpression("~=", identifier(stateName), identifier(exitName)),
          loopOpaque,
          style
        )
        : binaryExpression("~=", identifier(stateName), identifier(exitName)),
      whileBody,
      style
    ),
  ];
  if (allowIndirectHandlers) {
    if (hasReturnState) {
      flattened.splice(1, 0,
        localStatement(
          identifier(packName),
          indexExpression(
            indexExpression(identifier("_G"), escapedByteStringLiteral("table")),
            escapedByteStringLiteral("pack")
          )
        ),
        localStatement(
          identifier(unpackName),
          logicalOr(
            indexExpression(
              indexExpression(identifier("_G"), escapedByteStringLiteral("table")),
              escapedByteStringLiteral("unpack")
            ),
            indexExpression(identifier("_G"), escapedByteStringLiteral("unpack")),
            style
          )
        ),
        {
          type: "LocalStatement",
          variables: [identifier(returnPackName)],
          init: [],
        }
      );
    }
    flattened.splice(3, 0, ...handlerNames.map((name, idx) => localStatement(
      identifier(name),
      buildTableIndex(handlerPairs[idx], style)
    )));
  }
  if (hasReturnState) {
    flattened.push(
      returnStatement([
        callExpression(identifier(unpackName), [
          identifier(returnPackName),
          numericLiteral(1),
          indexExpression(identifier(returnPackName), stringLiteral("n")),
        ]),
      ])
    );
  }
  return flattened;
}

function flattenFunction(node, ctx) {
  if (node && node.cffGenerated) {
    return;
  }
  if (shouldSkipForVm(node, ctx && ctx.options)) {
    return;
  }
  const info = getFunctionStatements(node);
  if (!info) {
    return;
  }
  const { statements, style } = info;
  const minStatements = ctx.options.cffOptions?.minStatements ?? 3;
  if (!statements || statements.length < minStatements) {
    return;
  }
  if (hasUnsupportedStatements(statements)) {
    return;
  }

  const usedNames = collectIdentifierNames({ type: "Chunk", body: statements });
  if (ctx && typeof ctx.getSSA === "function") {
    const ssaRoot = ctx.getSSA();
    const ssa = findSSAForNode(ssaRoot, node);
    if (ssa) {
      addNamesFromSSA(ssa, usedNames);
    }
  }
  const prepared = prepareFlattenStatements(statements);
  if (!prepared) {
    return;
  }
  const flattened = buildFlattenedStatements(prepared.rewritten, {
    ...ctx,
    allowIndirectHandlers: !(node.hasVararg || node.isVararg),
  }, style, usedNames);
  if (prepared.hoisted.length) {
    flattened.unshift({
      type: "LocalStatement",
      variables: prepared.hoisted,
      init: [],
    });
  }
  setFunctionStatements(node, flattened, style);
}

function controlFlowFlatten(ast, ctx) {
  if (ctx && typeof ctx.getCFG === "function") {
    ctx.cfg = ctx.getCFG();
  }
  walk(ast, (node) => {
    if (!node || !node.type) {
      return;
    }
    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
      flattenFunction(node, ctx);
    }
  });
}

module.exports = {
  controlFlowFlatten,
};
