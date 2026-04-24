export interface NodeContracts {
  rootType: string;
  nodeTypes: readonly string[];
  sharedNodeFields: readonly string[];
}

export interface LocationContracts {
  positionFields: readonly string[];
  sourceLocationFields: readonly string[];
  baseNodeFields: readonly string[];
}

export interface DiagnosticContracts {
  fields: readonly string[];
  tokenFields: readonly string[];
}

export interface CustomAstTypeMetadata {
  nodes: NodeContracts;
  locations: LocationContracts;
  diagnosticTypes: DiagnosticContracts;
}

export const contractKeys = ["nodes", "locations", "diagnosticTypes"] as const;
