const { makeDiagnosticErrorFromNode } = require("./diagnostics");

let COMPACT = false;

function printChunk(ast, options = {}) {
  const compact = Boolean(options.compact);
  const previousCompact = COMPACT;
  COMPACT = compact;
  if (compact) {
    const code = printBlockInline(ast.body);
    COMPACT = previousCompact;
    return code;
  }
  const out = [];
  printBlock(ast.body, out, 0);
  const result = out.join("\n");
  COMPACT = previousCompact;
  return result;
}

const BINARY_PRECEDENCE = {
  or: 1,
  and: 2,
  "<": 3,
  ">": 3,
  "<=": 3,
  ">=": 3,
  "~=": 3,
  "==": 3,
  "|": 4,
  "~": 5,
  "&": 6,
  "<<": 7,
  ">>": 7,
  "..": 8,
  "+": 9,
  "-": 9,
  "*": 10,
  "/": 10,
  "//": 10,
  "%": 10,
  "^": 12,
};

const RIGHT_ASSOCIATIVE = new Set(["..", "^"]);
const UNARY_PRECEDENCE = 11;
const POSTFIX_PRECEDENCE = 13;
const PRIMARY_PRECEDENCE = 14;
const IF_EXPRESSION_PRECEDENCE = 0;

function printBlockInline(body) {
  const parts = [];
  for (const stmt of body) {
    const attrs = stmt.attributes && stmt.attributes.length
      ? stmt.attributes.map(printAttribute).join(" ") + " "
      : "";
    parts.push(`${attrs}${printStatement(stmt, 0, true)}`);
  }
  return parts.join("; ");
}

function printBlock(body, out, indent) {
  for (const stmt of body) {
    if (stmt.attributes && stmt.attributes.length) {
      for (const attr of stmt.attributes) {
        out.push(`${"  ".repeat(indent)}${printAttribute(attr)}`);
      }
    }
    out.push(`${"  ".repeat(indent)}${printStatement(stmt, indent, false)}`);
  }
}

function printAttribute(attr) {
  const name = printIdentifier(attr.name);
  if (!attr.arguments || !attr.arguments.length) {
    return `@${name}`;
  }
  if (attr.argumentStyle === "bare" && attr.arguments.length === 1) {
    return `@${name} ${printExpression(attr.arguments[0])}`;
  }
  return `@${name}(${attr.arguments.map((arg) => printExpression(arg)).join(", ")})`;
}

function printStatement(stmt, indent, compact) {
  switch (stmt.type) {
    case "LocalStatement": {
      const names = stmt.variables.map(printTypedIdentifier).join(", ");
      const init = stmt.init && stmt.init.length ? ` = ${stmt.init.map((arg) => printExpression(arg)).join(", ")}` : "";
      return `local ${names}${init}`;
    }
    case "AssignmentStatement":
      return `${stmt.variables.map((arg) => printExpression(arg)).join(", ")} = ${stmt.init
        .map((arg) => printExpression(arg))
        .join(", ")}`;
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
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `${header} ${name}${typeParams}(${args})${returnType}${bodyText}end`;
      }
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
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `function${typeParams}(${args})${returnType}${bodyText}end`;
      }
      const lines = [`function${typeParams}(${args})${returnType}`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "IfStatement": {
      if (compact) {
        const parts = [];
        stmt.clauses.forEach((clause, idx) => {
          const head = idx === 0 ? "if" : "elseif";
          const body = printBlockInline(clause.body.body);
          const bodyText = body ? ` ${body} ` : " ";
          parts.push(`${head} ${printExpression(clause.condition)} then${bodyText}`);
        });
        if (stmt.elseBody) {
          const body = printBlockInline(stmt.elseBody.body);
          const bodyText = body ? ` ${body} ` : " ";
          parts.push(`else${bodyText}`);
        }
        parts.push("end");
        return parts.join(" ");
      }
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
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `while ${printExpression(stmt.condition)} do${bodyText}end`;
      }
      const lines = [`while ${printExpression(stmt.condition)} do`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "RepeatStatement": {
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `repeat${bodyText}until ${printExpression(stmt.condition)}`;
      }
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
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `${parts.join("")} do${bodyText}end`;
      }
      const lines = [parts.join("") + " do"];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "ForGenericStatement": {
      const vars = stmt.variables.map(printTypedIdentifier).join(", ");
      const iter = stmt.iterators.map((arg) => printExpression(arg)).join(", ");
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `for ${vars} in ${iter} do${bodyText}end`;
      }
      const lines = [`for ${vars} in ${iter} do`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "DoStatement": {
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `do${bodyText}end`;
      }
      const lines = ["do"];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "ReturnStatement":
      return stmt.arguments.length
        ? `return ${stmt.arguments.map((arg) => printExpression(arg)).join(", ")}`
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
      if (compact) {
        const body = printBlockInline(stmt.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        return `${prefix} ${printIdentifier(stmt.name)}${typeParams}(${args})${returnTypes}${bodyText}end`;
      }
      const lines = [`${prefix} ${printIdentifier(stmt.name)}${typeParams}(${args})${returnTypes}`];
      printBlock(stmt.body.body, lines, indent + 1);
      lines.push(`${"  ".repeat(indent)}end`);
      return lines.join("\n" + "  ".repeat(indent));
    }
    case "DeclareFunctionStatement": {
      const params = stmt.parameters.map(printTypedIdentifier).join(", ");
      const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
      const typeParams = printTypeParameters(stmt.typeParameters);
      const returnType = stmt.returnType ? `: ${printType(stmt.returnType)}` : "";
      const name = printFunctionName(stmt.name);
      return `declare function ${name}${typeParams}(${args})${returnType}`;
    }
    case "DeclareVariableStatement":
      return `declare ${printIdentifier(stmt.name)}: ${printType(stmt.annotation)}`;
    default:
      throw makeDiagnosticErrorFromNode(`Unsupported statement: ${stmt.type}`, stmt);
  }
}

function getExpressionPrecedence(expr) {
  switch (expr.type) {
    case "BinaryExpression":
      return BINARY_PRECEDENCE[expr.operator] ?? IF_EXPRESSION_PRECEDENCE;
    case "UnaryExpression":
      return UNARY_PRECEDENCE;
    case "TypeAssertion":
    case "MemberExpression":
    case "IndexExpression":
    case "CallExpression":
    case "MethodCallExpression":
      return POSTFIX_PRECEDENCE;
    case "IfExpression":
      return IF_EXPRESSION_PRECEDENCE;
    case "GroupExpression":
    case "FunctionExpression":
    case "TableConstructorExpression":
    case "Identifier":
    case "NumericLiteral":
    case "StringLiteral":
    case "InterpolatedString":
    case "BooleanLiteral":
    case "NilLiteral":
    case "VarargLiteral":
      return PRIMARY_PRECEDENCE;
    default:
      return PRIMARY_PRECEDENCE;
  }
}

function needsParentheses(expr, parentPrec, parentOp, position) {
  if (!parentPrec) {
    return false;
  }
  if (expr.type === "IfExpression" && parentPrec > IF_EXPRESSION_PRECEDENCE) {
    return true;
  }
  const exprPrec = getExpressionPrecedence(expr);
  if (exprPrec < parentPrec) {
    return true;
  }
  if (exprPrec > parentPrec) {
    return false;
  }
  if (expr.type !== "BinaryExpression" || !parentOp) {
    return false;
  }
  if (RIGHT_ASSOCIATIVE.has(parentOp)) {
    return position === "left";
  }
  return position === "right";
}

function printExpression(expr, parentPrec = 0, parentOp = null, position = null) {
  const exprPrec = getExpressionPrecedence(expr);
  let result;
  switch (expr.type) {
    case "Identifier":
      result = expr.name;
      break;
    case "NumericLiteral":
      result = expr.raw ?? String(expr.value);
      break;
    case "StringLiteral":
      result = expr.raw;
      break;
    case "InterpolatedString":
      if (expr.raw) {
        result = expr.raw;
        break;
      }
      result = `\`${expr.parts.map(printInterpolatedPart).join("")}\``;
      break;
    case "BooleanLiteral":
      result = expr.value ? "true" : "false";
      break;
    case "NilLiteral":
      result = "nil";
      break;
    case "VarargLiteral":
      result = "...";
      break;
    case "UnaryExpression": {
      const spacer = expr.operator === "not" ? " " : "";
      result = `${expr.operator}${spacer}${printExpression(expr.argument, UNARY_PRECEDENCE)}`;
      break;
    }
    case "BinaryExpression":
      result = `${printExpression(expr.left, exprPrec, expr.operator, "left")} ${expr.operator} ${printExpression(
        expr.right,
        exprPrec,
        expr.operator,
        "right",
      )}`;
      break;
    case "TypeAssertion":
      result = `${printExpression(expr.expression, POSTFIX_PRECEDENCE)} :: ${printType(expr.annotation)}`;
      break;
    case "IfExpression": {
      const segments = [];
      expr.clauses.forEach((clause, idx) => {
        const head = idx === 0 ? "if" : "elseif";
        segments.push(`${head} ${printExpression(clause.condition)} then ${printExpression(clause.value)}`);
      });
      segments.push(`else ${printExpression(expr.elseValue)}`);
      result = segments.join(" ");
      break;
    }
    case "GroupExpression":
      result = `(${printExpression(expr.expression)})`;
      break;
    case "MemberExpression":
      result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}.${printIdentifier(expr.identifier)}`;
      break;
    case "IndexExpression":
      result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}[${printExpression(expr.index)}]`;
      break;
    case "CallExpression":
      result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}(${expr.arguments
        .map((arg) => printExpression(arg))
        .join(", ")})`;
      break;
    case "MethodCallExpression":
      result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}:${printIdentifier(expr.method)}(${expr.arguments
        .map((arg) => printExpression(arg))
        .join(", ")})`;
      break;
    case "FunctionExpression": {
      const params = expr.parameters.map(printTypedIdentifier).join(", ");
      const args = buildVarargParams(params, expr.hasVararg, expr.varargAnnotation);
      const typeParams = printTypeParameters(expr.typeParameters);
      const returnType = expr.returnType ? `: ${printType(expr.returnType)}` : "";
      const attrPrefix = expr.attributes && expr.attributes.length
        ? `${expr.attributes.map(printAttribute).join(" ")} `
        : "";
      if (COMPACT) {
        const body = printBlockInline(expr.body.body);
        const bodyText = body ? ` ${body} ` : " ";
        result = `${attrPrefix}function${typeParams}(${args})${returnType}${bodyText}end`;
      } else {
        const lines = [`${attrPrefix}function${typeParams}(${args})${returnType}`];
        printBlock(expr.body.body, lines, 1);
        lines.push("end");
        result = lines.join("\n");
      }
      break;
    }
    case "TableConstructorExpression":
      result = `{${expr.fields.map(printTableField).join(", ")}}`;
      break;
    default:
      throw makeDiagnosticErrorFromNode(`Unsupported expression: ${expr.type}`, expr);
  }
  if (needsParentheses(expr, parentPrec, parentOp, position)) {
    return `(${result})`;
  }
  return result;
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
      const hasArgs = type.typeArguments && type.typeArguments.length;
      const explicitArgs = type.typeArgumentsExplicit;
      const args = hasArgs || explicitArgs
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
      throw makeDiagnosticErrorFromNode(`Unsupported type: ${type.type}`, type);
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
    let base = printIdentifier(param);
    if (param.isPack) {
      base = param.packStyle === "postfix" ? `${base}...` : `...${base}`;
    }
    if (param.default) {
      return `${base} = ${printType(param.default)}`;
    }
    return base;
  });
  return `<${rendered.join(", ")}>`;
}

module.exports = {
  printChunk,
};
