const { Tokenizer } = require("./tokenizer");

const PRECEDENCE = {
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

const RIGHT_ASSOC = new Set(["..", "^"]);
const COMPOUND_ASSIGN = new Set(["+=", "-=", "*=", "/=", "%=", "^=", "//=", "..="]);
const CONTINUE_EXPRESSION_START = new Set(["=", ",", ".", "[", ":", "(", "{"]);

class Parser {
  constructor(source) {
    this.tokenizer = new Tokenizer(source);
    this.current = this.tokenizer.next();
  }

  parse() {
    const body = [];
    while (!this.is("eof")) {
      body.push(this.parseStatement());
    }
    return { type: "Chunk", body };
  }

  is(type, value) {
    if (this.current.type !== type) {
      return false;
    }
    if (value !== undefined) {
      return this.current.value === value;
    }
    return true;
  }

  eat(type, value) {
    if (this.is(type, value)) {
      const token = this.current;
      this.current = this.tokenizer.next();
      return token;
    }
    return null;
  }

  expect(type, value) {
    const tok = this.eat(type, value);
    if (!tok) {
      const got = this.current.value ? `${this.current.type}(${this.current.value})` : this.current.type;
      throw new Error(`Unexpected token ${got}`);
    }
    return tok;
  }

  peek() {
    return this.tokenizer.peek();
  }

  parseStatement() {
    const attributes = this.parseAttributes();

    if (this.is("symbol", "::")) {
      const label = this.parseLabelStatement();
      return this.attachAttributes(label, attributes);
    }
    if (this.is("keyword", "export") && this.peek().type === "keyword" && this.peek().value === "type") {
      const stmt = this.parseTypeStatement(true);
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "type")) {
      const stmt = this.parseTypeStatement(false);
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "local")) {
      const stmt = this.parseLocalStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "function")) {
      const stmt = this.parseFunctionDeclaration(false);
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "if")) {
      const stmt = this.parseIfStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "while")) {
      const stmt = this.parseWhileStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "repeat")) {
      const stmt = this.parseRepeatStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "for")) {
      const stmt = this.parseForStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "do")) {
      const stmt = this.parseDoStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "return")) {
      const stmt = this.parseReturnStatement();
      return this.attachAttributes(stmt, attributes);
    }
    if (this.is("keyword", "break")) {
      this.eat("keyword", "break");
      return this.attachAttributes({ type: "BreakStatement" }, attributes);
    }
    if (this.isContinueStatement()) {
      this.consumeContinueStatement();
      return this.attachAttributes({ type: "ContinueStatement" }, attributes);
    }
    if (this.is("keyword", "goto")) {
      const stmt = this.parseGotoStatement();
      return this.attachAttributes(stmt, attributes);
    }

    const expr = this.parsePrefixExpression();
    if (expr.type === "CallExpression" || expr.type === "MethodCallExpression") {
      return this.attachAttributes({ type: "CallStatement", expression: expr }, attributes);
    }

    const variables = [expr];
    while (this.eat("symbol", ",")) {
      variables.push(this.parsePrefixExpression());
    }

    if (this.is("symbol") && COMPOUND_ASSIGN.has(this.current.value)) {
      if (variables.length !== 1) {
        throw new Error("Compound assignment only supports single target");
      }
      const operator = this.current.value;
      this.current = this.tokenizer.next();
      const value = this.parseExpression();
      return this.attachAttributes({ type: "CompoundAssignmentStatement", operator, variable: variables[0], value }, attributes);
    }

    this.expect("symbol", "=");
    const init = this.parseExpressionList();
    return this.attachAttributes({ type: "AssignmentStatement", variables, init }, attributes);
  }

  isContinueStatement() {
    if (this.is("keyword", "continue")) {
      return true;
    }
    if (!this.is("identifier", "continue")) {
      return false;
    }
    const next = this.peek();
    if (!next || next.type === "eof") {
      return true;
    }
    if (next.type === "symbol") {
      if (CONTINUE_EXPRESSION_START.has(next.value)) {
        return false;
      }
      if (next.value === ";") {
        return true;
      }
    }
    if (next.type === "string" || next.type === "interpString") {
      return false;
    }
    return true;
  }

  consumeContinueStatement() {
    this.current = this.tokenizer.next();
  }

  attachAttributes(node, attributes) {
    if (attributes.length) {
      node.attributes = attributes;
    }
    return node;
  }

  parseAttributes() {
    const attributes = [];
    while (this.is("symbol", "@")) {
      this.eat("symbol", "@");
      if (this.eat("symbol", "[")) {
        if (this.is("symbol", "]")) {
          throw new Error("Attribute list cannot be empty");
        }
        while (!this.is("symbol", "]")) {
          attributes.push(this.parseAttributeEntry());
          if (!this.eat("symbol", ",")) {
            break;
          }
        }
        this.expect("symbol", "]");
        continue;
      }
      attributes.push(this.parseAttributeEntry());
    }
    return attributes;
  }

  parseAttributeEntry() {
    const name = this.parseIdentifier();
    let args = null;
    if (this.eat("symbol", "(")) {
      args = [];
      if (!this.is("symbol", ")")) {
        args.push(...this.parseExpressionList());
      }
      this.expect("symbol", ")");
      if (!args.every(isAttributeLiteral)) {
        throw new Error("Only literal values can be used as attribute arguments");
      }
    }
    return { type: "Attribute", name, arguments: args };
  }

  parseLabelStatement() {
    this.expect("symbol", "::");
    const name = this.parseIdentifier();
    this.expect("symbol", "::");
    return { type: "LabelStatement", name };
  }

  parseGotoStatement() {
    this.expect("keyword", "goto");
    const name = this.parseIdentifier();
    return { type: "GotoStatement", name };
  }

  parseTypeStatement(isExport) {
    if (isExport) {
      this.expect("keyword", "export");
    }
    this.expect("keyword", "type");
    if (this.is("keyword", "function")) {
      return this.parseTypeFunctionStatement(isExport);
    }
    const name = this.parseIdentifier();
    const typeParameters = this.parseTypeParameterList();
    this.expect("symbol", "=");
    const value = this.parseTypeExpression();
    return {
      type: isExport ? "ExportTypeStatement" : "TypeAliasStatement",
      name,
      typeParameters,
      value,
    };
  }

  parseTypeFunctionStatement(isExport) {
    this.expect("keyword", "function");
    const name = this.parseIdentifier();
    const typeParameters = this.parseTypeParameterList();
    this.expect("symbol", "(");
    const { parameters, hasVararg, varargAnnotation } = this.parseFunctionParameters();
    this.expect("symbol", ")");
    let returnTypes = [];
    if (this.eat("symbol", ":")) {
      returnTypes = this.parseTypeExpressionList();
    }
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return {
      type: isExport ? "ExportTypeFunctionStatement" : "TypeFunctionStatement",
      name,
      typeParameters,
      parameters,
      hasVararg,
      varargAnnotation,
      returnTypes,
      body,
    };
  }

  parseLocalStatement() {
    this.expect("keyword", "local");
    if (this.is("keyword", "function")) {
      return this.parseFunctionDeclaration(true);
    }
    if (this.is("keyword", "type")) {
      return this.parseTypeStatement(false);
    }
    const variables = [this.parseTypedIdentifier()];
    while (this.eat("symbol", ",")) {
      variables.push(this.parseTypedIdentifier());
    }
    let init = [];
    if (this.eat("symbol", "=")) {
      init = this.parseExpressionList();
    }
    return { type: "LocalStatement", variables, init };
  }

  parseFunctionName(isLocal) {
    const base = this.parseIdentifier();
    const members = [];
    let method = null;
    while (this.eat("symbol", ".")) {
      members.push(this.parseIdentifier());
    }
    if (this.eat("symbol", ":")) {
      method = this.parseIdentifier();
    }
    if (isLocal && (members.length > 0 || method)) {
      throw new Error("Local function name cannot contain '.' or ':'");
    }
    return { type: "FunctionName", base, members, method };
  }

  parseFunctionParameters() {
    const parameters = [];
    let hasVararg = false;
    let varargAnnotation = null;
    if (!this.is("symbol", ")")) {
      if (this.is("symbol", "...")) {
        hasVararg = true;
        this.eat("symbol", "...");
        if (this.eat("symbol", ":")) {
          varargAnnotation = this.parseTypeExpression();
        }
      } else {
        parameters.push(this.parseTypedIdentifier());
        while (this.eat("symbol", ",")) {
          if (this.is("symbol", "...")) {
            hasVararg = true;
            this.eat("symbol", "...");
            if (this.eat("symbol", ":")) {
              varargAnnotation = this.parseTypeExpression();
            }
            break;
          }
          parameters.push(this.parseTypedIdentifier());
        }
      }
    }
    return { parameters, hasVararg, varargAnnotation };
  }

  parseFunctionDeclaration(isLocal) {
    this.expect("keyword", "function");
    const name = this.parseFunctionName(isLocal);
    const typeParameters = this.parseTypeParameterList();
    this.expect("symbol", "(");
    const { parameters, hasVararg, varargAnnotation } = this.parseFunctionParameters();
    this.expect("symbol", ")");
    let returnType = null;
    if (this.eat("symbol", ":")) {
      returnType = this.parseTypeExpression();
    }
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return {
      type: "FunctionDeclaration",
      name,
      parameters,
      hasVararg,
      varargAnnotation,
      returnType,
      typeParameters,
      isLocal,
      body,
    };
  }

  parseFunctionExpression() {
    this.expect("keyword", "function");
    const typeParameters = this.parseTypeParameterList();
    this.expect("symbol", "(");
    const { parameters, hasVararg, varargAnnotation } = this.parseFunctionParameters();
    this.expect("symbol", ")");
    let returnType = null;
    if (this.eat("symbol", ":")) {
      returnType = this.parseTypeExpression();
    }
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return {
      type: "FunctionExpression",
      parameters,
      hasVararg,
      varargAnnotation,
      returnType,
      typeParameters,
      body,
    };
  }

  parseIfExpression() {
    this.expect("keyword", "if");
    const clauses = [];
    const condition = this.parseExpression();
    this.expect("keyword", "then");
    clauses.push({ condition, value: this.parseExpression() });
    while (this.is("keyword", "elseif")) {
      this.eat("keyword", "elseif");
      const cond = this.parseExpression();
      this.expect("keyword", "then");
      clauses.push({ condition: cond, value: this.parseExpression() });
    }
    this.expect("keyword", "else");
    const elseValue = this.parseExpression();
    return { type: "IfExpression", clauses, elseValue };
  }

  parseIfStatement() {
    this.expect("keyword", "if");
    const clauses = [];
    const condition = this.parseExpression();
    this.expect("keyword", "then");
    clauses.push({ condition, body: this.parseBlock(["elseif", "else", "end"]) });
    while (this.is("keyword", "elseif")) {
      this.eat("keyword", "elseif");
      const cond = this.parseExpression();
      this.expect("keyword", "then");
      clauses.push({ condition: cond, body: this.parseBlock(["elseif", "else", "end"]) });
    }
    let elseBody = null;
    if (this.is("keyword", "else")) {
      this.eat("keyword", "else");
      elseBody = this.parseBlock(["end"]);
    }
    this.expect("keyword", "end");
    return { type: "IfStatement", clauses, elseBody };
  }

  parseWhileStatement() {
    this.expect("keyword", "while");
    const condition = this.parseExpression();
    this.expect("keyword", "do");
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return { type: "WhileStatement", condition, body };
  }

  parseRepeatStatement() {
    this.expect("keyword", "repeat");
    const body = this.parseBlock(["until"]);
    this.expect("keyword", "until");
    const condition = this.parseExpression();
    return { type: "RepeatStatement", condition, body };
  }

  parseForStatement() {
    this.expect("keyword", "for");
    const variables = [this.parseTypedIdentifier()];
    while (this.eat("symbol", ",")) {
      variables.push(this.parseTypedIdentifier());
    }
    if (this.eat("symbol", "=")) {
      if (variables.length !== 1) {
        throw new Error("Numeric for only supports a single variable");
      }
      const start = this.parseExpression();
      this.expect("symbol", ",");
      const end = this.parseExpression();
      let step = null;
      if (this.eat("symbol", ",")) {
        step = this.parseExpression();
      }
      this.expect("keyword", "do");
      const body = this.parseBlock(["end"]);
      this.expect("keyword", "end");
      return { type: "ForNumericStatement", variable: variables[0], start, end, step, body };
    }

    this.expect("keyword", "in");
    const iterators = this.parseExpressionList();
    this.expect("keyword", "do");
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return { type: "ForGenericStatement", variables, iterators, body };
  }

  parseDoStatement() {
    this.expect("keyword", "do");
    const body = this.parseBlock(["end"]);
    this.expect("keyword", "end");
    return { type: "DoStatement", body };
  }

  parseReturnStatement() {
    this.expect("keyword", "return");
    if (
      this.is("keyword", "end") ||
      this.is("keyword", "until") ||
      this.is("keyword", "else") ||
      this.is("keyword", "elseif") ||
      this.is("eof")
    ) {
      return { type: "ReturnStatement", arguments: [] };
    }
    return { type: "ReturnStatement", arguments: this.parseExpressionList() };
  }

  parseBlock(terminators) {
    const body = [];
    while (!this.is("eof")) {
      if (this.is("keyword") && terminators.includes(this.current.value)) {
        break;
      }
      body.push(this.parseStatement());
    }
    return { type: "Block", body };
  }

  parseExpressionList() {
    const expressions = [this.parseExpression()];
    while (this.eat("symbol", ",")) {
      expressions.push(this.parseExpression());
    }
    return expressions;
  }

  parseExpression(minPrec = 0) {
    let expr = this.parseUnary();
    while (this.current.type === "symbol" || this.current.type === "keyword") {
      const op = this.current.value;
      const prec = PRECEDENCE[op];
      if (prec === undefined || prec < minPrec) {
        break;
      }
      this.current = this.tokenizer.next();
      const nextMin = RIGHT_ASSOC.has(op) ? prec : prec + 1;
      const right = this.parseExpression(nextMin);
      expr = { type: "BinaryExpression", operator: op, left: expr, right };
    }
    return expr;
  }

  parseUnary() {
    if (
      this.is("symbol", "-") ||
      this.is("symbol", "~") ||
      this.is("keyword", "not") ||
      this.is("symbol", "#")
    ) {
      const operator = this.current.value;
      this.current = this.tokenizer.next();
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator, argument };
    }
    return this.parseSuffixExpression();
  }

  parsePrefixExpression() {
    return this.parseSuffixExpression();
  }

  parseSuffixExpression() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.eat("symbol", ".")) {
        const id = this.parseIdentifier();
        expr = { type: "MemberExpression", base: expr, indexer: ".", identifier: id };
        continue;
      }
      if (this.eat("symbol", "[")) {
        const index = this.parseExpression();
        this.expect("symbol", "]");
        expr = { type: "IndexExpression", base: expr, index };
        continue;
      }
      if (this.is("symbol", ":")) {
        this.eat("symbol", ":");
        const id = this.parseIdentifier();
        const args = this.parseCallArguments();
        expr = { type: "MethodCallExpression", base: expr, method: id, arguments: args };
        continue;
      }
      if (this.isCallStart()) {
        const args = this.parseCallArguments();
        expr = { type: "CallExpression", base: expr, arguments: args };
        continue;
      }
      if (this.eat("symbol", "::")) {
        const annotation = this.parseTypeExpression();
        expr = { type: "TypeAssertion", expression: expr, annotation };
        continue;
      }
      break;
    }
    return expr;
  }

  isCallStart() {
    return this.is("symbol", "(") || this.is("string") || this.is("symbol", "{") || this.is("interpString");
  }

  parseCallArguments() {
    if (this.eat("symbol", "(")) {
      const args = [];
      if (!this.is("symbol", ")")) {
        args.push(...this.parseExpressionList());
      }
      this.expect("symbol", ")");
      return args;
    }
    if (this.is("string")) {
      const str = this.parseStringLiteral();
      return [str];
    }
    if (this.is("interpString")) {
      throw new Error("Interpolated string call arguments must use parentheses");
    }
    if (this.is("symbol", "{")) {
      return [this.parseTableConstructor()];
    }
    throw new Error("Invalid call arguments");
  }

  parsePrimary() {
    if (this.is("symbol", "@")) {
      const attributes = this.parseAttributes();
      if (!this.is("keyword", "function")) {
        throw new Error("Attributes on expressions must precede a function");
      }
      const expr = this.parseFunctionExpression();
      expr.attributes = attributes;
      return expr;
    }
    if (this.is("identifier")) {
      return this.parseIdentifier();
    }
    if (this.is("number")) {
      const tok = this.current;
      this.current = this.tokenizer.next();
      return { type: "NumericLiteral", value: parseNumericLiteral(tok.value), raw: tok.value };
    }
    if (this.is("string")) {
      return this.parseStringLiteral();
    }
    if (this.is("interpString")) {
      return this.parseInterpolatedString();
    }
    if (this.is("keyword", "nil")) {
      this.eat("keyword", "nil");
      return { type: "NilLiteral" };
    }
    if (this.is("keyword", "true") || this.is("keyword", "false")) {
      const value = this.current.value === "true";
      this.current = this.tokenizer.next();
      return { type: "BooleanLiteral", value };
    }
    if (this.is("symbol", "...")) {
      this.eat("symbol", "...");
      return { type: "VarargLiteral" };
    }
    if (this.is("keyword", "function")) {
      return this.parseFunctionExpression();
    }
    if (this.is("keyword", "if")) {
      return this.parseIfExpression();
    }
    if (this.is("symbol", "{")) {
      return this.parseTableConstructor();
    }
    if (this.eat("symbol", "(")) {
      const expr = this.parseExpression();
      this.expect("symbol", ")");
      return { type: "GroupExpression", expression: expr };
    }
    throw new Error(`Unexpected token ${this.current.type}(${this.current.value})`);
  }

  parseTableConstructor() {
    this.expect("symbol", "{");
    const fields = [];
    while (!this.is("symbol", "}")) {
      if (this.eat("symbol", "[")) {
        const key = this.parseExpression();
        this.expect("symbol", "]");
        this.expect("symbol", "=");
        const value = this.parseExpression();
        fields.push({ type: "TableField", kind: "index", key, value });
      } else if (this.is("identifier") && this.peek().type === "symbol" && this.peek().value === "=") {
        const name = this.parseIdentifier();
        this.expect("symbol", "=");
        const value = this.parseExpression();
        fields.push({ type: "TableField", kind: "name", name, value });
      } else {
        const value = this.parseExpression();
        fields.push({ type: "TableField", kind: "list", value });
      }
      if (!this.eat("symbol", ",")) {
        this.eat("symbol", ";");
      }
    }
    this.expect("symbol", "}");
    return { type: "TableConstructorExpression", fields };
  }

  parseTypedIdentifier() {
    const id = this.parseIdentifier();
    if (this.eat("symbol", ":")) {
      id.annotation = this.parseTypeExpression();
    }
    return id;
  }

  parseTypeParameterList() {
    if (!this.is("symbol", "<")) {
      return [];
    }
    this.expect("symbol", "<");
    const params = [];
    do {
      let isPack = false;
      if (this.eat("symbol", "...")) {
        isPack = true;
      }
      const param = this.parseIdentifier();
      if (isPack) {
        param.isPack = true;
      }
      if (this.eat("symbol", "=")) {
        param.default = this.parseTypeExpression();
      }
      params.push(param);
    } while (this.eat("symbol", ","));
    this.expect("symbol", ">" );
    return params;
  }

  parseTypeExpression() {
    return this.parseTypeUnion();
  }

  parseTypeExpressionList() {
    const types = [this.parseTypeExpression()];
    while (this.eat("symbol", ",")) {
      types.push(this.parseTypeExpression());
    }
    return types;
  }

  parseTypeUnion() {
    let type = this.parseTypeIntersection();
    const types = [type];
    while (this.eat("symbol", "|")) {
      types.push(this.parseTypeIntersection());
    }
    if (types.length > 1) {
      return { type: "UnionType", types };
    }
    return type;
  }

  parseTypeIntersection() {
    let type = this.parseTypePostfix();
    const types = [type];
    while (this.eat("symbol", "&")) {
      types.push(this.parseTypePostfix());
    }
    if (types.length > 1) {
      return { type: "IntersectionType", types };
    }
    return type;
  }

  parseTypePostfix() {
    let type = this.parseTypePrimary();
    while (true) {
      if (this.is("symbol", "<") && type.type === "TypeReference") {
        const args = this.parseTypeArgumentList();
        type.typeArguments = args;
        continue;
      }
      if (this.eat("symbol", "?")) {
        type = { type: "OptionalType", base: type };
        continue;
      }
      if (this.eat("symbol", "...")) {
        type = { type: "TypePack", value: type, postfix: true };
        continue;
      }
      break;
    }
    return type;
  }

  parseTypeArgumentList() {
    this.expect("symbol", "<");
    const args = [this.parseTypeExpression()];
    while (this.eat("symbol", ",")) {
      args.push(this.parseTypeExpression());
    }
    this.expect("symbol", ">" );
    return args;
  }

  parseTypePrimary() {
    if (this.is("symbol", "...")) {
      this.eat("symbol", "...");
      const type = this.parseTypePrimary();
      return { type: "VariadicType", value: type };
    }
    if (this.is("symbol", "<")) {
      const typeParameters = this.parseTypeParameterList();
      if (!this.is("symbol", "(")) {
        throw new Error("Generic function types must be followed by parameter list");
      }
      return this.parseFunctionOrTupleType(typeParameters);
    }
    if (this.is("symbol", "{")) {
      return this.parseTableType();
    }
    if (this.is("symbol", "(")) {
      return this.parseFunctionOrTupleType(null);
    }
    if (this.is("keyword", "typeof")) {
      this.eat("keyword", "typeof");
      const expression = this.parseExpression();
      return { type: "TypeofType", expression };
    }
    if (this.is("string")) {
      const tok = this.expect("string");
      return { type: "TypeLiteral", raw: tok.value };
    }
    if (this.is("number")) {
      const tok = this.expect("number");
      return { type: "TypeLiteral", raw: tok.value };
    }
    if (this.is("keyword", "true") || this.is("keyword", "false") || this.is("keyword", "nil")) {
      const tok = this.current;
      this.current = this.tokenizer.next();
      return { type: "TypeLiteral", raw: tok.value };
    }
    const name = this.parseTypeName();
    return { type: "TypeReference", name, typeArguments: [] };
  }

  parseTypeName() {
    const parts = [this.parseIdentifier()];
    while (this.eat("symbol", ".")) {
      parts.push(this.parseIdentifier());
    }
    return parts;
  }

  parseTableType() {
    this.expect("symbol", "{");
    const fields = [];
    while (!this.is("symbol", "}")) {
      if (this.is("identifier", "read") || this.is("identifier", "write")) {
        const next = this.peek();
        if (next && next.type === "symbol" && next.value === "[") {
          throw new Error("Table access modifier must appear inside indexer brackets");
        }
      }
      const access = this.parseTableAccess();
      if (this.eat("symbol", "[")) {
        let indexAccess = access;
        if (indexAccess && (this.is("identifier", "read") || this.is("identifier", "write"))) {
          throw new Error("Duplicate table access modifier");
        }
        if (!indexAccess && (this.is("identifier", "read") || this.is("identifier", "write"))) {
          indexAccess = this.current.value;
          this.current = this.tokenizer.next();
        }
        const key = this.parseTypeExpression();
        this.expect("symbol", "]");
        this.expect("symbol", ":");
        const value = this.parseTypeExpression();
        fields.push({ type: "TableTypeField", kind: "index", key, value, access: indexAccess });
      } else if (this.is("identifier") && this.peek().type === "symbol" && this.peek().value === ":") {
        const name = this.parseIdentifier();
        this.expect("symbol", ":");
        const value = this.parseTypeExpression();
        fields.push({ type: "TableTypeField", kind: "name", name, value, access });
      } else {
        if (access) {
          throw new Error("Table field access modifier must precede a named or indexer field");
        }
        const value = this.parseTypeExpression();
        fields.push({ type: "TableTypeField", kind: "list", value });
      }
      if (!this.eat("symbol", ",")) {
        this.eat("symbol", ";");
      }
    }
    this.expect("symbol", "}");
    return { type: "TableType", fields };
  }

  parseTableAccess() {
    if (this.is("identifier", "read") || this.is("identifier", "write")) {
      const next = this.peek();
      if (next && next.type === "identifier") {
        const access = this.current.value;
        this.current = this.tokenizer.next();
        return access;
      }
    }
    return null;
  }

  parseFunctionOrTupleType(typeParameters) {
    this.expect("symbol", "(");
    const params = [];
    if (!this.is("symbol", ")")) {
      if (this.is("symbol", "...")) {
        this.eat("symbol", "...");
        const value = this.parseTypeExpression();
        params.push({ type: "TypePack", value });
      } else {
        params.push(this.parseTypeParameter());
        while (this.eat("symbol", ",")) {
          if (this.is("symbol", "...")) {
            this.eat("symbol", "...");
            const value = this.parseTypeExpression();
            params.push({ type: "TypePack", value });
            break;
          }
          params.push(this.parseTypeParameter());
        }
      }
    }
    this.expect("symbol", ")");
    if (this.eat("symbol", "->")) {
      const returnTypes = this.parseTypeExpressionList();
      return { type: "FunctionType", parameters: params, returnTypes, typeParameters };
    }
    if (typeParameters !== null && typeParameters !== undefined) {
      throw new Error("Generic function types must specify return types");
    }
    if (params.length === 1 && params[0].type === "TypeParameter") {
      return { type: "ParenthesizedType", value: params[0].value };
    }
    const items = params.map((param) => (param.type === "TypeParameter" ? param.value : param));
    return { type: "TupleType", items };
  }

  parseTypeParameter() {
    if (this.is("identifier") && this.peek().type === "symbol" && this.peek().value === ":") {
      const name = this.parseIdentifier();
      this.expect("symbol", ":");
      const value = this.parseTypeExpression();
      return { type: "TypeParameter", name, value };
    }
    return { type: "TypeParameter", name: null, value: this.parseTypeExpression() };
  }

  parseIdentifier() {
    const tok = this.expect("identifier");
    return { type: "Identifier", name: tok.value };
  }

  parseStringLiteral() {
    const tok = this.expect("string");
    return { type: "StringLiteral", raw: tok.value };
  }

  parseInterpolatedString() {
    const tok = this.expect("interpString");
    const raw = tok.value;
    if (!raw || raw.length < 2 || raw[0] !== "`" || raw[raw.length - 1] !== "`") {
      return { type: "InterpolatedString", raw };
    }
    const content = raw.slice(1, -1);
    const parts = [];
    let cursor = 0;
    while (cursor < content.length) {
      const next = findInterpolationStart(content, cursor);
      if (next === -1) {
        break;
      }
      const text = content.slice(cursor, next);
      if (text) {
        parts.push({ type: "InterpolatedStringText", raw: text });
      }
      const end = findInterpolationEnd(content, next + 1);
      if (end === -1) {
        return { type: "InterpolatedString", raw };
      }
      const exprSource = content.slice(next + 1, end);
      const expr = parseInterpolationExpression(exprSource);
      if (!expr) {
        return { type: "InterpolatedString", raw };
      }
      parts.push(expr);
      cursor = end + 1;
    }
    const tail = content.slice(cursor);
    if (tail) {
      parts.push({ type: "InterpolatedStringText", raw: tail });
    }
    return { type: "InterpolatedString", parts };
  }
}

function parse(source) {
  const parser = new Parser(source);
  return parser.parse();
}

function isAttributeLiteral(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  switch (node.type) {
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
    case "NilLiteral":
      return true;
    case "TableConstructorExpression":
      return node.fields.every((field) => {
        if (field.kind === "name") {
          return isAttributeLiteral(field.value);
        }
        if (field.kind === "index") {
          return isAttributeLiteral(field.key) && isAttributeLiteral(field.value);
        }
        return isAttributeLiteral(field.value);
      });
    default:
      return false;
  }
}

function parseInterpolationExpression(source) {
  if (!source || !source.trim()) {
    return null;
  }
  const parser = new Parser(source);
  const expr = parser.parseExpression();
  if (parser.current && parser.current.type !== "eof") {
    return null;
  }
  return expr;
}

function parseNumericLiteral(raw) {
  if (typeof raw !== "string") {
    return Number(raw);
  }
  const sanitized = raw.replace(/_/g, "");
  if (/^0[bB][01]/.test(sanitized)) {
    return parseInt(sanitized.slice(2), 2);
  }
  if (/^0[xX]/.test(sanitized)) {
    if (/[pP]/.test(sanitized) || sanitized.includes(".")) {
      return parseHexFloat(sanitized);
    }
    return parseInt(sanitized.slice(2), 16);
  }
  return Number(sanitized);
}

function parseHexFloat(raw) {
  const match = /^0[xX]([0-9a-fA-F]*)(?:\.([0-9a-fA-F]*))?(?:[pP]([+-]?\d+))?$/.exec(raw);
  if (!match) {
    return Number(raw);
  }
  const intPart = match[1] || "";
  const fracPart = match[2] || "";
  const exponent = match[3] ? parseInt(match[3], 10) : 0;
  const intValue = intPart ? parseInt(intPart, 16) : 0;
  let fracValue = 0;
  for (let i = 0; i < fracPart.length; i += 1) {
    const digit = parseInt(fracPart[i], 16);
    if (Number.isNaN(digit)) {
      break;
    }
    fracValue += digit / Math.pow(16, i + 1);
  }
  return (intValue + fracValue) * Math.pow(2, exponent);
}

function findInterpolationStart(source, start) {
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "{") {
      if (source[i + 1] === "{") {
        throw new Error("Interpolated string cannot contain '{{'");
      }
      return i;
    }
    i += 1;
  }
  return -1;
}

function readLongBracket(source, index) {
  if (source[index] !== "[") {
    return null;
  }
  let i = index + 1;
  let eqCount = 0;
  while (source[i] === "=") {
    eqCount += 1;
    i += 1;
  }
  if (source[i] !== "[") {
    return null;
  }
  return {
    openLength: i - index + 1,
    close: `]${"=".repeat(eqCount)}]`,
  };
}

function skipString(source, index, quote) {
  let i = index + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i += 1;
  }
  return source.length;
}

function findInterpolationEnd(source, start) {
  let depth = 1;
  let i = start;
  let long = null;
  while (i < source.length) {
    if (long) {
      if (source.startsWith(long.close, i)) {
        i += long.close.length;
        long = null;
        continue;
      }
      i += 1;
      continue;
    }

    const ch = source[i];
    if (ch === "'" || ch === "\"" || ch === "`") {
      i = skipString(source, i, ch);
      continue;
    }
    if (ch === "-" && source[i + 1] === "-") {
      const longComment = readLongBracket(source, i + 2);
      if (longComment) {
        long = longComment;
        i += 2 + longComment.openLength;
        continue;
      }
      i += 2;
      while (i < source.length && source[i] !== "\n" && source[i] !== "\r") {
        i += 1;
      }
      continue;
    }
    if (ch === "[") {
      const longString = readLongBracket(source, i);
      if (longString) {
        long = longString;
        i += longString.openLength;
        continue;
      }
    }

    if (ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

module.exports = {
  parse,
  Parser,
};
