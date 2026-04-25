export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  begin: Position;
  end: Position;
  start?: Position;
}

export interface BaseNode {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
}

export const positionFields = ["line", "column"] as const;
export const locationFields = ["begin", "end"] as const;
export const sourceLocationFields = locationFields;
export const baseNodeFields = ["type", "range", "loc"] as const;
