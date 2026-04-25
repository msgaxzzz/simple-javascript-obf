export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  begin: Position;
  end: Position;
  start?: Position;
}

export interface DiagnosticTokenShape {
  type: string;
  value: string | null;
}

export interface DiagnosticShape {
  message: string;
  expected?: string[] | null;
  token?: DiagnosticTokenShape | null;
  location?: SourceLocation | null;
  range?: [number, number] | null;
  loc?: SourceLocation | null;
}

export const diagnosticFields = ["message", "expected", "token", "location", "range"] as const;
export const diagnosticTokenFields = ["type", "value", "location"] as const;
export const fields = diagnosticFields;
export const tokenFields = diagnosticTokenFields;
