export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface DiagnosticTokenShape {
  type: string;
  value: string | null;
}

export interface DiagnosticShape {
  message: string;
  expected?: string[] | null;
  token?: DiagnosticTokenShape | null;
  range?: [number, number] | null;
  loc?: SourceLocation | null;
}

export const fields = ["message", "expected", "token", "loc", "range"] as const;
export const tokenFields = ["type", "value"] as const;
