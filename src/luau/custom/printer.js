function printChunk(ast) {
  const out = [];
  printBlock(ast.body, out, 0);
  return out.join("\n");
}

function printBlock(body, out, indent) {
  for (const stmt of body) {
    if (stmt.attributes && stmt.attributes.length) {
      for (const attr of stmt.attributes) {
        out.push(`${"  ".repeat(indent)}${printAttribute(attr)}`);
      }
    }
    out.push(`${"  ".repeat(indent)}${printStatement(stmt, indent)}`);
  }
}

function printAttribute(attr) {
  const name = printIdentifier(attr.name);
  if (!attr.arguments || !attr.arguments.length) {
    return `@${name}`;
  }
  return `@${name}(${attr.arguments.map(printExpression).join(", ")})`;
}

function printStatement(stmt, indent) {
  switch (stmt.type) {
    case "LocalStatement": {
      const names = stmt.variables.map(printTypedIdentifier).join(", ");
      const init = stmt.init && stmt.init.length ? ` = ${stmt.init.map(printExpression).join(", ")}` : "";
      return `local ${names}${init}`;
    }
    case "AssignmentStatement":
      return `${stmt.variables.map(printExpression).join(", ")} = ${stmt.init.map(printExpression).join(", ")}`;
    case "CompoundAssignmentStatement":
      return `${printExpression(stmt.variable)} ${stmt.operator} ${printExpression(stmt.value)}`;
    case "CallStatement":
      return printExpression(stmt.expression);
    case "FunctionDeclaration": {
      const params = stmt.parameters.map(printTypedIdentifier).join(", ");
      const header = stmt.isLocal ? "local function" : "function";
      const name = printFunctionName(stmt.name);
      const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
      const typeParams = printTypeParameters(stmt.typeParameters);
      const returnType = stmt.returnType ? `: ${printType(stmt.returnType)}` : "";
      const lines = [`${header} ${name}${typeParams}(${args})${returnType}`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "FunctionExpression": {
      const params = stmt.parameters.map(printTypedIdentifier).join(", ");
      const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
      const typeParams = printTypeParameters(stmt.typeParameters);
      const returnType = stmt.returnType ? `: ${printType(stmt.returnType)}` : "";
      const lines = [`function${typeParams}(${args})${returnType}`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "IfStatement": {
      const lines = [];
      stmt.clauses.forEach((clause, idx) => {
        const head = idx === 0 ? "if" : "elseif";
        lines.push(`${head} ${printExpression(clause.condition)} then`);
        printBlock(clause.body.body, lines, indent + 1);
      });
      if (stmt.elseBody) {
        lines.push(`${"  ".repeat(indent)}else`);
        printBlock(stmt.elseBody.body, lines, indent + 1);
      }
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "WhileStatement": {
      const lines = [`while ${printExpression(stmt.condition)} do`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "RepeatStatement": {
      const lines = ["repeat"];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}until ${printExpression(stmt.condition)}`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "ForNumericStatement": {
      const parts = [
        `for ${printTypedIdentifier(stmt.variable)} = ${printExpression(stmt.start)}, ${printExpression(stmt.end)}`,
      ];
      if (stmt.step) {
        parts.push(`, ${printExpression(stmt.step)}`);
      }
      const lines = [parts.join("") + " do"];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "ForGenericStatement": {
      const vars = stmt.variables.map(printTypedIdentifier).join(", ");
      const iter = stmt.iterators.map(printExpression).join(", ");
      const lines = [`for ${vars} in ${iter} do`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "DoStatement": {
      const lines = ["do"];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "ReturnStatement":
      return stmt.arguments.length
        ? `return ${stmt.arguments.map(printExpression).join(", ")}`
        : "return";
    case "BreakStatement":
      return "break";
    case "ContinueStatement":
      return "continue";
    case "LabelStatement":
      return `::${printIdentifier(stmt.name)}::`;
    case "GotoStatement":
      return `goto ${printIdentifier(stmt.name)}`;
    case "TypeAliasStatement":
      return `type ${printIdentifier(stmt.name)}${printTypeParameters(stmt.typeParameters)} = ${printType(stmt.value)}`;
    case "ExportTypeStatement":
      return `export type ${printIdentifier(stmt.name)}${printTypeParameters(stmt.typeParameters)} = ${printType(stmt.value)}`;
    case "TypeFunctionStatement":
    case "ExportTypeFunctionStatement": {
      const params = stmt.parameters.map(printTypedIdentifier).join(", ");
      const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
      const typeParams = printTypeParameters(stmt.typeParameters);
      const returnTypes = stmt.returnTypes && stmt.returnTypes.length
        ? `: ${stmt.returnTypes.map(printType).join(", ")}`
        : "";
      const prefix = stmt.type === "ExportTypeFunctionStatement" ? "export type function" : "type function";
      const lines = [`${prefix} ${printIdentifier(stmt.name)}${typeParams}(${args})${returnTypes}`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    default:
      throw new Error(`Unsupported statement: ${stmt.type}`);
  }
}

function printExpression(expr) {
  switch (expr.type) {
    case "Identifier":
      return expr.name;
    case "NumericLiteral":
      return expr.raw ?? String(expr.value);
    case "StringLiteral":
      return expr.raw;
    case "InterpolatedString":
      if (expr.raw) {
        return expr.raw;
      }
      return `\`${expr.parts.map(printInterpolatedPart).join("")}\``;
    case "BooleanLiteral":
      return expr.value ? "true" : "false";
    case "NilLiteral":
      return "nil";
    case "VarargLiteral":
      return "...";
    case "UnaryExpression":
      return `${expr.operator} ${printExpression(expr.argument)}`;
    case "BinaryExpression":
      return `${printExpression(expr.left)} ${expr.operator} ${printExpression(expr.right)}`;
    case "TypeAssertion":
      return `${printExpression(expr.expression)} :: ${printType(expr.annotation)}`;
    case "IfExpression": {
      const segments = [];
      expr.clauses.forEach((clause, idx) => {
        const head = idx === 0 ? "if" : "elseif";
        segments.push(`${head} ${printExpression(clause.condition)} then ${printExpression(clause.value)}`);
      });
      segments.push(`else ${printExpression(expr.elseValue)}`);
      return segments.join(" ");
    }
    case "GroupExpression":
      return `(${printExpression(expr.expression)})`;
    case "MemberExpression":
      return `${printExpression(expr.base)}.${printIdentifier(expr.identifier)}`;
    case "IndexExpression":
      return `${printExpression(expr.base)}[${printExpression(expr.index)}]`;
    case "CallExpression":
      return `${printExpression(expr.base)}(${expr.arguments.map(printExpression).join(", ")})`;
    case "MethodCallExpression":
      return `${printExpression(expr.base)}:${printIdentifier(expr.method)}(${expr.arguments
        .map(printExpression)
        .join(", ")})`;
    case "FunctionExpression": {
      const params = expr.parameters.map(printTypedIdentifier).join(", ");
      const args = buildVarargParams(params, expr.hasVararg, expr.varargAnnotation);
      const typeParams = printTypeParameters(expr.typeParameters);
      const returnType = expr.returnType ? `: ${printType(expr.returnType)}` : "";
      const attrPrefix = expr.attributes && expr.attributes.length
        ? `${expr.attributes.map(printAttribute).join(" ")} `
        : "";
      const lines = [`${attrPrefix}function${typeParams}(${args})${returnType}`];
      printBlock(expr.body.body, lines, 1);
      lines.push("end");
      return lines.join("\n");
    }
    case "TableConstructorExpression":
      return `{${expr.fields.map(printTableField).join(", ")}}`;
    default:
      throw new Error(`Unsupported expression: ${expr.type}`);
  }
}

function printInterpolatedPart(part) {
  if (part.type === "InterpolatedStringText") {
    return part.raw;
  }
  return `{${printExpression(part)}}`;
}

function printTableField(field) {
  if (field.kind === "name") {
    return `${printIdentifier(field.name)} = ${printExpression(field.value)}`;
  }
  if (field.kind === "index") {
    return `[${printExpression(field.key)}] = ${printExpression(field.value)}`;
  }
  return printExpression(field.value);
}

function printTypedIdentifier(node) {
  const name = printIdentifier(node);
  if (node.annotation) {
    return `${name}: ${printType(node.annotation)}`;
  }
  return name;
}

function printType(type) {
  switch (type.type) {
    case "TypeReference": {
      const base = type.name.map(printIdentifier).join(".");
      const args = type.typeArguments && type.typeArguments.length
        ? `<${type.typeArguments.map(printType).join(", ")}>`
        : "";
      return `${base}${args}`;
    }
    case "UnionType":
      return type.types.map(printType).join(" | ");
    case "IntersectionType":
      return type.types.map(printType).join(" & ");
    case "OptionalType":
      return `${printType(type.base)}?`;
    case "VariadicType":
      return `...${printType(type.value)}`;
    case "TypeLiteral":
      return type.raw;
    case "TypeofType":
      return `typeof ${printExpression(type.expression)}`;
    case "FunctionType": {
      const params = type.parameters.map(printTypeParameter).join(", ");
      const returns = type.returnTypes.map(printType).join(", ");
      const typeParams = printTypeParameters(type.typeParameters);
      return `${typeParams}(${params}) -> ${returns}`;
    }
    case "TableType":
      return `{${type.fields.map(printTableTypeField).join(", ")}}`;
    case "ParenthesizedType":
      return `(${printType(type.value)})`;
    case "TupleType":
      return `(${type.items.map(printType).join(", ")})`;
    case "TypePack":
      if (type.postfix) {
        return `${printType(type.value)}...`;
      }
      return `...${printType(type.value)}`;
    case "TypeParameter":
      return printTypeParameter(type);
    default:
      throw new Error(`Unsupported type: ${type.type}`);
  }
}

function printTypeParameter(param) {
  if (param.type === "TypePack") {
    if (param.postfix) {
      return `${printType(param.value)}...`;
    }
    return `...${printType(param.value)}`;
  }
  if (param.name) {
    return `${printIdentifier(param.name)}: ${printType(param.value)}`;
  }
  return printType(param.value);
}

function printTableTypeField(field) {
  const access = field.access ? `${field.access} ` : "";
  if (field.kind === "name") {
    return `${access}${printIdentifier(field.name)}: ${printType(field.value)}`;
  }
  if (field.kind === "index") {
    return `[${access}${printType(field.key)}]: ${printType(field.value)}`;
  }
  return printType(field.value);
}

function printIdentifier(node) {
  return node.name;
}

function printFunctionName(node) {
  const parts = [printIdentifier(node.base), ...node.members.map(printIdentifier)];
  let name = parts.join(".");
  if (node.method) {
    name += `:${printIdentifier(node.method)}`;
  }
  return name;
}

function buildVarargParams(params, hasVararg, varargAnnotation) {
  if (!hasVararg) {
    return params;
  }
  const suffix = varargAnnotation ? `...: ${printType(varargAnnotation)}` : "...";
  return params ? `${params}, ${suffix}` : suffix;
}

function printTypeParameters(params) {
  if (!params || !params.length) {
    return "";
  }
  const rendered = params.map((param) => {
    if (param.isPack) {
      return `...${printIdentifier(param)}`;
    }
    if (param.default) {
      return `${printIdentifier(param)} = ${printType(param.default)}`;
    }
    return printIdentifier(param);
  });
  return `<${rendered.join(", ")}>`;
}

module.exports = {
  printChunk,
};
