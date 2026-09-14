const { collectIdentifierNames, makeNameFactory } = require("./names");

function identifier(name) {
  return { type: "Identifier", name };
}

function numericLiteral(value) {
  return { type: "NumericLiteral", value, raw: String(value) };
}

function stringLiteral(value) {
  return { type: "StringLiteral", value, raw: JSON.stringify(value) };
}

function varargLiteral(isCustom) {
  return { type: "VarargLiteral", value: "...", raw: "..." };
}

function functionName(name) {
  return {
    type: "FunctionName",
    base: identifier(name),
    members: [],
    method: null,
  };
}

function buildFunctionExpression(parameters, body, isCustom, hasVararg = true) {
  if (isCustom) {
    const node = {
      type: "FunctionExpression",
      parameters,
      hasVararg,
      varargAnnotation: null,
      returnType: null,
      typeParameters: [],
      body: { type: "Block", body },
    };
    node.__obf_skip_vm = true;
    return node;
  }
  const params = parameters.slice();
  if (hasVararg) {
    params.push(varargLiteral(false));
  }
  const node = {
    type: "FunctionDeclaration",
    identifier: null,
    parameters: params,
    isLocal: false,
    body,
  };
  node.__obf_skip_vm = true;
  return node;
}

function buildNamedFunctionDeclaration(name, parameters, body, isCustom, hasVararg = true) {
  if (isCustom) {
    const node = {
      type: "FunctionDeclaration",
      name: functionName(name),
      parameters,
      hasVararg,
      varargAnnotation: null,
      returnType: null,
      typeParameters: [],
      isLocal: true,
      body: { type: "Block", body },
    };
    node.__obf_skip_vm = true;
    return node;
  }
  const params = parameters.slice();
  if (hasVararg) {
    params.push(varargLiteral(false));
  }
  const node = {
    type: "FunctionDeclaration",
    identifier: identifier(name),
    parameters: params,
    isLocal: true,
    body,
  };
  node.__obf_skip_vm = true;
  return node;
}

function buildTableConstructor(fields, isCustom) {
  if (isCustom) {
    return {
      type: "TableConstructorExpression",
      fields: fields.map((f) => ({
        type: "TableField",
        kind: f.kind || "name",
        key: f.key,
        value: f.value,
      })),
    };
  }
  return {
    type: "TableConstructorExpression",
    fields: fields.map((f) => ({
      type: f.kind === "index" ? "TableKey" : "TableKeyString",
      key: f.key,
      value: f.value,
    })),
  };
}

function wrapNamedWithDecoys(originalBody, nameGen, rng, isCustom) {
  const fnName = nameGen();
  const decoyParamName = nameGen();
  const decoyVal = rng.int(10, 250);
  const fn = buildNamedFunctionDeclaration(
    fnName,
    [identifier(decoyParamName)],
    originalBody,
    isCustom,
    true
  );
  const returnCall = {
    type: "ReturnStatement",
    arguments: [
      {
        type: "CallExpression",
        base: identifier(fnName),
        arguments: [numericLiteral(decoyVal), varargLiteral(isCustom)],
      },
    ],
  };
  return [fn, returnCall];
}

function wrapIIFE(originalBody, isCustom) {
  const fnExpr = buildFunctionExpression([], originalBody, isCustom, true);
  return [
    {
      type: "ReturnStatement",
      arguments: [
        {
          type: "CallExpression",
          base: {
            type: "GroupExpression",
            expression: fnExpr,
          },
          arguments: [varargLiteral(isCustom)],
        },
      ],
    },
  ];
}

function wrapCoroutine(originalBody, isCustom) {
  const fnExpr = buildFunctionExpression([], originalBody, isCustom, true);
  const coroutineWrapCall = {
    type: "CallExpression",
    base: {
      type: "MemberExpression",
      base: identifier("coroutine"),
      identifier: identifier("wrap"),
      indexer: ".",
    },
    arguments: [fnExpr],
  };
  return [
    {
      type: "ReturnStatement",
      arguments: [
        {
          type: "CallExpression",
          base: {
            type: "GroupExpression",
            expression: coroutineWrapCall,
          },
          arguments: [varargLiteral(isCustom)],
        },
      ],
    },
  ];
}

function wrapMetatable(originalBody, nameGen, isCustom) {
  const dummySelfName = nameGen();
  const fnExpr = buildFunctionExpression([identifier(dummySelfName)], originalBody, isCustom, true);
  const mt = buildTableConstructor(
    [
      {
        kind: "name",
        key: identifier("__call"),
        value: fnExpr,
      },
    ],
    isCustom
  );
  const setmtCall = {
    type: "CallExpression",
    base: identifier("setmetatable"),
    arguments: [buildTableConstructor([], isCustom), mt],
  };
  return [
    {
      type: "ReturnStatement",
      arguments: [
        {
          type: "CallExpression",
          base: {
            type: "GroupExpression",
            expression: setmtCall,
          },
          arguments: [varargLiteral(isCustom)],
        },
      ],
    },
  ];
}

function wrapOnce(ast, nameGen, rng, isCustom, styleIndex) {
  if (!ast || !Array.isArray(ast.body)) {
    return;
  }
  const originalBody = ast.body;
  const style = styleIndex % 4;
  switch (style) {
    case 0:
      ast.body = wrapNamedWithDecoys(originalBody, nameGen, rng, isCustom);
      break;
    case 1:
      ast.body = wrapIIFE(originalBody, isCustom);
      break;
    case 2:
      ast.body = wrapCoroutine(originalBody, isCustom);
      break;
    case 3:
    default:
      ast.body = wrapMetatable(originalBody, nameGen, isCustom);
      break;
  }
}

function wrapInFunction(ast, ctx) {
  if (!ctx.options.wrap) {
    return;
  }
  const iterations = ctx.options.wrapOptions?.iterations ?? 1;
  if (!Number.isFinite(iterations) || iterations < 1) {
    return;
  }
  const used = collectIdentifierNames(ast, ctx);
  const nameGen = makeNameFactory(ctx.rng, used);
  const isCustom = !ctx.options || ctx.options.luauParser !== "luaparse";
  const preferredStyle = ctx.options.wrapOptions?.style;
  const styleMap = {
    named: 0,
    iife: 1,
    coroutine: 2,
    metatable: 3,
  };

  for (let i = 0; i < iterations; i += 1) {
    const styleIndex = typeof preferredStyle === "string" && styleMap[preferredStyle] !== undefined
      ? styleMap[preferredStyle]
      : (ctx.rng ? ctx.rng.int(0, 3) : i);
    wrapOnce(ast, nameGen, ctx.rng, isCustom, styleIndex);
  }
}

module.exports = {
  wrapInFunction,
};

