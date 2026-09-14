"use strict";
// @ts-nocheck
const { makeDiagnosticErrorFromNode } = require("./diagnostics");
const { normalizeLegacyNodeShape } = require("./compat");
let COMPACT = false;
function printChunk(ast, options = {}) {
    ast = normalizeLegacyNodeShape(ast);
    const sourceMap = Boolean(options.sourceMap);
    const compact = Boolean(options.compact) && !sourceMap;
    const previousCompact = COMPACT;
    COMPACT = compact;
    try {
        if (compact) {
            return printBlockInline(ast.body);
        }
        const out = [];
        const tracker = sourceMap ? { entries: [], currentLine: 0 } : null;
        printBlock(ast.body, out, 0, tracker);
        const result = out.join("\n");
        if (sourceMap) {
            return {
                code: result,
                mappings: tracker.entries,
            };
        }
        return result;
    }
    finally {
        COMPACT = previousCompact;
    }
}
const KEYWORDS = new Set([
    "and",
    "break",
    "class",
    "const",
    "do",
    "declare",
    "else",
    "elseif",
    "end",
    "export",
    "extends",
    "false",
    "for",
    "function",
    "goto",
    "if",
    "in",
    "local",
    "nil",
    "not",
    "or",
    "repeat",
    "return",
    "then",
    "true",
    "type",
    "typeof",
    "until",
    "while",
]);
function isValidIdentifier(name) {
    return typeof name === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !KEYWORDS.has(name);
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
function getFunctionBodyStatements(fn) {
    if (!fn || !fn.body) {
        return [];
    }
    if (Array.isArray(fn.body)) {
        return fn.body;
    }
    if (Array.isArray(fn.body.body)) {
        return fn.body.body;
    }
    return [];
}
function getFunctionParameters(fn) {
    return Array.isArray(fn.parameters) ? fn.parameters : [];
}
function printFunctionDeclarationName(fn) {
    if (fn.name) {
        return printFunctionName(fn.name);
    }
    if (fn.identifier) {
        return printIdentifier(fn.identifier);
    }
    throw makeDiagnosticErrorFromNode("Function declaration is missing a name", fn);
}
function printFunctionValue(fn) {
    const params = getFunctionParameters(fn).map(printTypedIdentifier).join(", ");
    const args = buildVarargParams(params, fn.hasVararg, fn.varargAnnotation);
    const typeParams = printTypeParameters(fn.typeParameters);
    const returnType = fn.returnType ? `: ${printType(fn.returnType)}` : "";
    const attrPrefix = fn.attributes && fn.attributes.length
        ? `${fn.attributes.map(printAttribute).join(" ")} `
        : "";
    const body = getFunctionBodyStatements(fn);
    if (COMPACT) {
        const bodyText = printBlockInline(body);
        return `${attrPrefix}function${typeParams}(${args})${returnType}${bodyText ? ` ${bodyText} ` : " "}end`;
    }
    const lines = [`${attrPrefix}function${typeParams}(${args})${returnType}`];
    printBlock(body, lines, 1, createNestedTracker(null, 1));
    lines.push("end");
    return lines.join("\n");
}
function countLines(text) {
    if (!text) {
        return 1;
    }
    let count = 1;
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === "\n") {
            count += 1;
        }
    }
    return count;
}
function createNestedTracker(tracker, startLine) {
    if (!tracker) {
        return null;
    }
    return {
        entries: tracker.entries,
        currentLine: startLine,
    };
}
function recordStatementMapping(stmt, indent, tracker) {
    recordNodeMapping(stmt, tracker ? tracker.currentLine : 0, indent * 2, tracker);
}
function recordNodeMapping(node, generatedLine, generatedColumn, tracker) {
    if (!tracker || !node || !node.loc || !node.loc.start) {
        return;
    }
    tracker.entries.push({
        generatedLine,
        generatedColumn,
        sourceLine: Math.max(0, node.loc.start.line - 1),
        sourceColumn: Math.max(0, node.loc.start.column - 1),
    });
}
function printExpressionListTracked(expressions, tracker, generatedLine, startColumn) {
    let column = startColumn;
    return expressions.map((expr, index) => {
        recordNodeMapping(expr, generatedLine, column, tracker);
        const text = printExpression(expr);
        column += text.length;
        if (index < expressions.length - 1) {
            column += 2;
        }
        return text;
    }).join(", ");
}
function printBlock(body, out, indent, tracker = null) {
    for (let idx = 0; idx < body.length; idx += 1) {
        const stmt = body[idx];
        if (stmt.leadingComments && stmt.leadingComments.length) {
            for (const c of stmt.leadingComments) {
                out.push(`${"  ".repeat(indent)}-- ${c}`);
                if (tracker) tracker.currentLine += 1;
            }
        }
        if (stmt.comment) {
            out.push(`${"  ".repeat(indent)}-- ${stmt.comment}`);
            if (tracker) tracker.currentLine += 1;
        }
        if (stmt.attributes && stmt.attributes.length) {
            for (const attr of stmt.attributes) {
                out.push(`${"  ".repeat(indent)}${printAttribute(attr)}`);
                if (tracker) {
                    tracker.currentLine += 1;
                }
            }
        }
        recordStatementMapping(stmt, indent, tracker);
        const text = printStatement(stmt, indent, false, tracker);
        let prefix = "";
        if (idx > 0 && (text.startsWith("(") || text.startsWith("[") || text.startsWith("`"))) {
            prefix = ";";
        }
        out.push(`${"  ".repeat(indent)}${prefix}${text}`);
        if (tracker) {
            tracker.currentLine += countLines(text);
        }
    }
}
function printAttribute(attr) {
    if (attr.type === "AttributeList") {
        return `@[${attr.attributes.map(printAttributeListEntry).join(", ")}]`;
    }
    return printAttributeEntry(attr);
}
function printAttributeListEntry(attr) {
    const name = printIdentifier(attr.name);
    if (!attr.arguments || !attr.arguments.length) {
        return `${name}`;
    }
    if (attr.argumentStyle === "bare" && attr.arguments.length === 1) {
        return `${name} ${printExpression(attr.arguments[0])}`;
    }
    return `${name}(${attr.arguments.map((arg) => printExpression(arg)).join(", ")})`;
}
function printAttributeEntry(attr) {
    const name = printIdentifier(attr.name);
    if (!attr.arguments || !attr.arguments.length) {
        return `@${name}`;
    }
    if (attr.argumentStyle === "bare" && attr.arguments.length === 1) {
        return `@${name} ${printExpression(attr.arguments[0])}`;
    }
    return `@${name}(${attr.arguments.map((arg) => printExpression(arg)).join(", ")})`;
}
function printStatement(stmt, indent, compact, tracker = null) {
    switch (stmt.type) {
        case "LocalStatement": {
            const exportPrefix = stmt.exported ? "export " : "";
            const kind = stmt.isConst ? "const" : "local";
            const names = stmt.variables.map(printTypedIdentifier).join(", ");
            let init = "";
            if (stmt.init && stmt.init.length) {
                const startColumn = indent * 2 + `${exportPrefix}${kind} ${names} = `.length;
                init = ` = ${printExpressionListTracked(stmt.init, tracker, tracker ? tracker.currentLine : 0, startColumn)}`;
            }
            return `${exportPrefix}${kind} ${names}${init}`;
        }
        case "AssignmentStatement": {
            const line = tracker ? tracker.currentLine : 0;
            const left = printExpressionListTracked(stmt.variables, tracker, line, indent * 2);
            const right = printExpressionListTracked(stmt.init, tracker, line, indent * 2 + left.length + 3);
            return `${left} = ${right}`;
        }
        case "CompoundAssignmentStatement": {
            const line = tracker ? tracker.currentLine : 0;
            recordNodeMapping(stmt.variable, line, indent * 2, tracker);
            const variable = printExpression(stmt.variable);
            const valueColumn = indent * 2 + variable.length + stmt.operator.length + 2;
            recordNodeMapping(stmt.value, line, valueColumn, tracker);
            return `${variable} ${stmt.operator} ${printExpression(stmt.value)}`;
        }
        case "CallStatement":
            recordNodeMapping(stmt.expression, tracker ? tracker.currentLine : 0, indent * 2, tracker);
            return printExpression(stmt.expression);
        case "FunctionDeclaration": {
            const exportPrefix = stmt.exported ? "export " : "";
            const params = getFunctionParameters(stmt).map(printTypedIdentifier).join(", ");
            const header = stmt.isLocal ? (stmt.isConst ? "const function" : "local function") : (stmt.isConst ? "const function" : "function");
            const name = printFunctionDeclarationName(stmt);
            const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
            const typeParams = printTypeParameters(stmt.typeParameters);
            const returnType = stmt.returnType ? `: ${printType(stmt.returnType)}` : "";
            const body = getFunctionBodyStatements(stmt);
            if (compact) {
                const inlineBody = printBlockInline(body);
                const bodyText = inlineBody ? ` ${inlineBody} ` : " ";
                return `${exportPrefix}${header} ${name}${typeParams}(${args})${returnType}${bodyText}end`;
            }
            const lines = [`${exportPrefix}${header} ${name}${typeParams}(${args})${returnType}`];
            printBlock(body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
            lines.push(`${"  ".repeat(indent)}end`);
            return lines.join("\n" + "  ".repeat(indent));
        }
        case "FunctionExpression": {
            const params = getFunctionParameters(stmt).map(printTypedIdentifier).join(", ");
            const args = buildVarargParams(params, stmt.hasVararg, stmt.varargAnnotation);
            const typeParams = printTypeParameters(stmt.typeParameters);
            const returnType = stmt.returnType ? `: ${printType(stmt.returnType)}` : "";
            const body = getFunctionBodyStatements(stmt);
            if (compact) {
                const inlineBody = printBlockInline(body);
                const bodyText = inlineBody ? ` ${inlineBody} ` : " ";
                return `function${typeParams}(${args})${returnType}${bodyText}end`;
            }
            const lines = [`function${typeParams}(${args})${returnType}`];
            printBlock(body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
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
            const nestedTracker = createNestedTracker(tracker, tracker ? tracker.currentLine : 0);
            stmt.clauses.forEach((clause, idx) => {
                const head = idx === 0 ? "if" : "elseif";
                lines.push(`${head} ${printExpression(clause.condition)} then`);
                if (nestedTracker) {
                    nestedTracker.currentLine += 1;
                }
                printBlock(clause.body.body, lines, indent + 1, nestedTracker);
            });
            if (stmt.elseBody) {
                lines.push(`${"  ".repeat(indent)}else`);
                if (nestedTracker) {
                    nestedTracker.currentLine += 1;
                }
                printBlock(stmt.elseBody.body, lines, indent + 1, nestedTracker);
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
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
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
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
            lines.push(`${"  ".repeat(indent)}until ${printExpression(stmt.condition)}`);
            return lines.join("\n" + "  ".repeat(indent));
        }
        case "ForNumericStatement": {
            const line = tracker ? tracker.currentLine : 0;
            const prefix = `for ${printTypedIdentifier(stmt.variable)} = `;
            recordNodeMapping(stmt.start, line, indent * 2 + prefix.length, tracker);
            const startText = printExpression(stmt.start);
            const endColumn = indent * 2 + prefix.length + startText.length + 2;
            recordNodeMapping(stmt.end, line, endColumn, tracker);
            const parts = [
                `${prefix}${startText}, ${printExpression(stmt.end)}`,
            ];
            if (stmt.step) {
                const stepColumn = indent * 2 + parts.join("").length + 2;
                recordNodeMapping(stmt.step, line, stepColumn, tracker);
                parts.push(`, ${printExpression(stmt.step)}`);
            }
            if (compact) {
                const body = printBlockInline(stmt.body.body);
                const bodyText = body ? ` ${body} ` : " ";
                return `${parts.join("")} do${bodyText}end`;
            }
            const lines = [parts.join("") + " do"];
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
            lines.push(`${"  ".repeat(indent)}end`);
            return lines.join("\n" + "  ".repeat(indent));
        }
        case "ForGenericStatement": {
            const vars = stmt.variables.map(printTypedIdentifier).join(", ");
            const iter = printExpressionListTracked(stmt.iterators, tracker, tracker ? tracker.currentLine : 0, indent * 2 + `for ${vars} in `.length);
            if (compact) {
                const body = printBlockInline(stmt.body.body);
                const bodyText = body ? ` ${body} ` : " ";
                return `for ${vars} in ${iter} do${bodyText}end`;
            }
            const lines = [`for ${vars} in ${iter} do`];
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
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
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
            lines.push(`${"  ".repeat(indent)}end`);
            return lines.join("\n" + "  ".repeat(indent));
        }
        case "ReturnStatement":
            return stmt.arguments.length
                ? `return ${printExpressionListTracked(stmt.arguments, tracker, tracker ? tracker.currentLine : 0, indent * 2 + 7)}`
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
            printBlock(stmt.body.body, lines, indent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
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
        case "DeclareGlobalStatement":
            return stmt.annotation
                ? `declare global ${printIdentifier(stmt.name)}: ${printType(stmt.annotation)}`
                : `declare global ${printIdentifier(stmt.name)}`;
        case "DeclareClassStatement": {
            const superStr = stmt.superName ? ` < ${printIdentifier(stmt.superName)}` : "";
            const props = (stmt.properties || []).map((p) => {
                if (p.type === "DeclareFunctionStatement") {
                    const params = p.parameters.map(printTypedIdentifier).join(", ");
                    const args = buildVarargParams(params, p.hasVararg, p.varargAnnotation);
                    const typeParams = printTypeParameters(p.typeParameters);
                    const returnType = p.returnType ? `: ${printType(p.returnType)}` : "";
                    const name = printFunctionName(p.name);
                    return `  function ${name}${typeParams}(${args})${returnType}`;
                }
                return `  ${printIdentifier(p.name)}: ${printType(p.annotation)}`;
            }).join("\n");
            return `declare class ${printIdentifier(stmt.name)}${superStr}\n${props}\nend`;
        }
        case "ClassStatement": {
            const exportPrefix = stmt.exported ? "export " : "";
            const superStr = stmt.superName ? ` extends ${printIdentifier(stmt.superName)}` : "";
            const lines = [`${exportPrefix}class ${printIdentifier(stmt.name)}${superStr}`];
            const bodyIndent = indent + 1;
            for (const member of stmt.members) {
                const isPublic = member.isPublic ? "public " : "";
                if (member.type === "ClassMethod") {
                    const fn = member.func;
                    const params = getFunctionParameters(fn).map(printTypedIdentifier).join(", ");
                    const args = buildVarargParams(params, fn.hasVararg, fn.varargAnnotation);
                    const typeParams = printTypeParameters(fn.typeParameters);
                    const returnType = fn.returnType ? `: ${printType(fn.returnType)}` : "";
                    const body = getFunctionBodyStatements(fn);
                    lines.push(`${"  ".repeat(bodyIndent)}${isPublic}function ${printIdentifier(member.name)}${typeParams}(${args})${returnType}`);
                    printBlock(body, lines, bodyIndent + 1, createNestedTracker(tracker, (tracker ? tracker.currentLine : 0) + 1));
                    lines.push(`${"  ".repeat(bodyIndent)}end`);
                } else {
                    const annot = member.annotation ? `: ${printType(member.annotation)}` : "";
                    lines.push(`${"  ".repeat(bodyIndent)}${isPublic}${printIdentifier(member.name)}${annot}`);
                }
            }
            lines.push(`${"  ".repeat(indent)}end`);
            return lines.join("\n");
        }
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
        case "TypeInstantiation":
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
    if ((expr.type === "FunctionExpression" || expr.type === "TableConstructorExpression") && parentPrec >= POSTFIX_PRECEDENCE) {
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
            if (expr.raw) {
                result = expr.raw;
                break;
            }
            if (expr.value === Infinity) {
                result = "1e500";
                break;
            }
            if (expr.value === -Infinity) {
                result = "-1e500";
                break;
            }
            if (Number.isNaN(expr.value)) {
                result = "0/0";
                break;
            }
            if (expr.suffix === "i") {
                result = `${expr.value}i`;
                break;
            }
            result = String(expr.value);
            break;
        case "StringLiteral":
            result = expr.raw !== undefined ? expr.raw : JSON.stringify(expr.value);
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
            result = `${printExpression(expr.left, exprPrec, expr.operator, "left")} ${expr.operator} ${printExpression(expr.right, exprPrec, expr.operator, "right")}`;
            break;
        case "TypeAssertion":
            result = `${printExpression(expr.expression, POSTFIX_PRECEDENCE)} :: ${printType(expr.annotation)}`;
            break;
        case "TypeInstantiation":
            result = `${printExpression(expr.expression, POSTFIX_PRECEDENCE)}<<${expr.typeArguments.map(printType).join(", ")}>>`;
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
        case "CallExpression": {
            const typeArgs = expr.typeArguments && expr.typeArguments.length
                ? `<<${expr.typeArguments.map(printType).join(", ")}>>`
                : "";
            result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}${typeArgs}(${expr.arguments
                .map((arg) => printExpression(arg))
                .join(", ")})`;
            break;
        }
        case "MethodCallExpression": {
            const typeArgs = expr.typeArguments && expr.typeArguments.length
                ? `<<${expr.typeArguments.map(printType).join(", ")}>>`
                : "";
            result = `${printExpression(expr.base, POSTFIX_PRECEDENCE)}:${printIdentifier(expr.method)}${typeArgs}(${expr.arguments
                .map((arg) => printExpression(arg))
                .join(", ")})`;
            break;
        }
        case "FunctionExpression":
            result = printFunctionValue(expr);
            break;
        case "FunctionDeclaration":
            result = printFunctionValue(expr);
            break;
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
        const raw = field.name || field.key;
        const idName = raw?.name || (typeof raw === "string" ? raw : null);
        if (idName && isValidIdentifier(idName)) {
            return `${idName} = ${printExpression(field.value)}`;
        }
        if (idName) {
            return `[${JSON.stringify(idName)}] = ${printExpression(field.value)}`;
        }
    }
    if (field.kind === "index" || field.key) {
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
            return type.types.map((t) => (t.type === "IntersectionType" || t.type === "FunctionType" ? `(${printType(t)})` : printType(t))).join(" | ");
        case "IntersectionType":
            return type.types.map((t) => (t.type === "UnionType" || t.type === "FunctionType" ? `(${printType(t)})` : printType(t))).join(" & ");
        case "OptionalType":
            return `${printType(type.base)}?`;
        case "VariadicType":
            return `...${printType(type.value)}`;
        case "TypeLiteral":
            return type.raw !== undefined ? type.raw : (typeof type.value === "string" ? JSON.stringify(type.value) : String(type.value));
        case "TypeofType":
            return `typeof ${printExpression(type.expression)}`;
        case "FunctionType": {
            const params = type.parameters.map(printTypeParameter).join(", ");
            const typeParams = printTypeParameters(type.typeParameters);
            let returns = "";
            if (!type.returnTypes || type.returnTypes.length === 0) {
                returns = "()";
            } else if (type.returnTypes.length === 1 && type.returnTypes[0].type !== "TypePack" && type.returnTypes[0].type !== "TupleType") {
                const ret = printType(type.returnTypes[0]);
                returns = type.returnTypes[0].type === "FunctionType" ? `(${ret})` : ret;
            } else {
                returns = `(${type.returnTypes.map(printType).join(", ")})`;
            }
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
        return `${access}[${printType(field.key)}]: ${printType(field.value)}`;
    }
    return `${access}${printType(field.value)}`;
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
