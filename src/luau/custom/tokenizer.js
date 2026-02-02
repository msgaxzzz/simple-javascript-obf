const KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "export",
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

const MULTI_SYMBOLS = [
  "...",
  "->",
  "==",
  "~=",
  "<=",
  ">=",
  "//=",
  "..=",
  "..",
  "//",
  "<<",
  ">>",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "^=",
  "::",
];

class Tokenizer {
  constructor(source) {
    this.source = source;
    this.length = source.length;
    this.index = 0;
    this.line = 1;
    this.column = 1;
    this.peeked = null;
  }

  peek() {
    if (!this.peeked) {
      this.peeked = this.next();
    }
    return this.peeked;
  }

  next() {
    if (this.peeked) {
      const tok = this.peeked;
      this.peeked = null;
      return tok;
    }
    this.skipWhitespace();
    if (this.index >= this.length) {
      return { type: "eof", value: "", line: this.line, column: this.column };
    }

    const ch = this.source[this.index];

    if (this.isIdentifierStart(ch)) {
      return this.readIdentifier();
    }
    if (this.isDigit(ch)) {
      return this.readNumber();
    }
    if (ch === "\"" || ch === "'") {
      return this.readQuotedString();
    }
    if (ch === "`") {
      return this.readInterpolatedString();
    }
    if (ch === "[") {
      const long = this.readLongString();
      if (long) {
        return long;
      }
    }
    if (ch === "-" && this.source[this.index + 1] === "-") {
      this.readComment();
      return this.next();
    }

    return this.readSymbol();
  }

  skipWhitespace() {
    while (this.index < this.length) {
      const ch = this.source[this.index];
      if (ch === " " || ch === "\t" || ch === "\v" || ch === "\f") {
        this.advance(1);
        continue;
      }
      if (ch === "\r") {
        if (this.source[this.index + 1] === "\n") {
          this.advance(2);
        } else {
          this.advance(1);
        }
        this.line += 1;
        this.column = 1;
        continue;
      }
      if (ch === "\n") {
        this.advance(1);
        this.line += 1;
        this.column = 1;
        continue;
      }
      break;
    }
  }

  advance(count) {
    this.index += count;
    this.column += count;
  }

  isIdentifierStart(ch) {
    return /[A-Za-z_]/.test(ch);
  }

  isIdentifierPart(ch) {
    return /[A-Za-z0-9_]/.test(ch);
  }

  isDigit(ch) {
    return /[0-9]/.test(ch);
  }

  isHexDigit(ch) {
    return /[0-9a-fA-F]/.test(ch);
  }

  isBinaryDigit(ch) {
    return ch === "0" || ch === "1";
  }

  readIdentifier() {
    const start = this.index;
    const line = this.line;
    const column = this.column;
    this.advance(1);
    while (this.index < this.length && this.isIdentifierPart(this.source[this.index])) {
      this.advance(1);
    }
    const value = this.source.slice(start, this.index);
    if (KEYWORDS.has(value)) {
      return { type: "keyword", value, line, column };
    }
    return { type: "identifier", value, line, column };
  }

  readNumber() {
    const start = this.index;
    const line = this.line;
    const column = this.column;
    const first = this.source[this.index];
    const next = this.source[this.index + 1];

    if (first === "0" && (next === "x" || next === "X")) {
      this.advance(2);
      let sawDot = false;
      while (this.index < this.length) {
        const ch = this.source[this.index];
        if (this.isHexDigit(ch) || ch === "_") {
          this.advance(1);
          continue;
        }
        if (ch === "." && !sawDot && this.isHexDigit(this.source[this.index + 1] || "")) {
          sawDot = true;
          this.advance(1);
          continue;
        }
        if (ch === "p" || ch === "P") {
          this.advance(1);
          if (this.source[this.index] === "+" || this.source[this.index] === "-") {
            this.advance(1);
          }
          while (this.index < this.length) {
            const expCh = this.source[this.index];
            if (this.isDigit(expCh) || expCh === "_") {
              this.advance(1);
              continue;
            }
            break;
          }
          break;
        }
        break;
      }
      const value = this.source.slice(start, this.index);
      return { type: "number", value, line, column };
    }

    if (first === "0" && (next === "b" || next === "B")) {
      this.advance(2);
      while (this.index < this.length) {
        const ch = this.source[this.index];
        if (this.isBinaryDigit(ch) || ch === "_") {
          this.advance(1);
          continue;
        }
        break;
      }
      const value = this.source.slice(start, this.index);
      return { type: "number", value, line, column };
    }

    while (this.index < this.length) {
      const ch = this.source[this.index];
      if (this.isDigit(ch) || ch === "_") {
        this.advance(1);
        continue;
      }
      break;
    }
    if (this.source[this.index] === "." && this.isDigit(this.source[this.index + 1])) {
      this.advance(1);
      while (this.index < this.length) {
        const ch = this.source[this.index];
        if (this.isDigit(ch) || ch === "_") {
          this.advance(1);
          continue;
        }
        break;
      }
    }
    if (this.source[this.index] === "e" || this.source[this.index] === "E") {
      const expNext = this.source[this.index + 1];
      if (this.isDigit(expNext) || expNext === "+" || expNext === "-") {
        this.advance(1);
        if (this.source[this.index] === "+" || this.source[this.index] === "-") {
          this.advance(1);
        }
        while (this.index < this.length) {
          const ch = this.source[this.index];
          if (this.isDigit(ch) || ch === "_") {
            this.advance(1);
            continue;
          }
          break;
        }
      }
    }
    const value = this.source.slice(start, this.index);
    return { type: "number", value, line, column };
  }

  readQuotedString() {
    const quote = this.source[this.index];
    const line = this.line;
    const column = this.column;
    let i = this.index + 1;
    while (i < this.length) {
      const ch = this.source[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === quote) {
        i += 1;
        break;
      }
      if (ch === "\n" || ch === "\r") {
        break;
      }
      i += 1;
    }
    const raw = this.source.slice(this.index, i);
    this.advance(i - this.index);
    return { type: "string", value: raw, line, column };
  }

  readInterpolatedString() {
    const line = this.line;
    const column = this.column;
    let i = this.index + 1;
    while (i < this.length) {
      const ch = this.source[i];
      if (ch === "\\\\") {
        i += 2;
        continue;
      }
      if (ch === "`") {
        i += 1;
        break;
      }
      if (ch === "\n" || ch === "\r") {
        break;
      }
      i += 1;
    }
    const raw = this.source.slice(this.index, i);
    this.advance(i - this.index);
    return { type: "interpString", value: raw, line, column };
  }

  readLongString() {
    const line = this.line;
    const column = this.column;
    let i = this.index + 1;
    let equalsCount = 0;
    while (this.source[i] === "=") {
      equalsCount += 1;
      i += 1;
    }
    if (this.source[i] !== "[") {
      return null;
    }
    i += 1;
    const close = `]${"=".repeat(equalsCount)}]`;
    const end = this.source.indexOf(close, i);
    if (end === -1) {
      return null;
    }
    const raw = this.source.slice(this.index, end + close.length);
    this.advance(end + close.length - this.index);
    return { type: "string", value: raw, line, column };
  }

  readComment() {
    this.advance(2);
    if (this.source[this.index] === "[") {
      const long = this.readLongString();
      if (long) {
        return;
      }
    }
    while (this.index < this.length && this.source[this.index] !== "\n") {
      this.advance(1);
    }
  }

  readSymbol() {
    const line = this.line;
    const column = this.column;
    for (const symbol of MULTI_SYMBOLS) {
      if (this.source.startsWith(symbol, this.index)) {
        this.advance(symbol.length);
        return { type: "symbol", value: symbol, line, column };
      }
    }
    const value = this.source[this.index];
    this.advance(1);
    return { type: "symbol", value, line, column };
  }
}

module.exports = {
  Tokenizer,
};
