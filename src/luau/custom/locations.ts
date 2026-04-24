export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface BaseNode {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
}

export const positionFields = ["line", "column"] as const;
export const sourceLocationFields = ["start", "end"] as const;
export const baseNodeFields = ["type", "range", "loc"] as const;
