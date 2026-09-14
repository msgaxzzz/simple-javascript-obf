const diagnostics = require("./diagnostics");
const nodes = require("./nodes");
const locations = require("./locations");

export interface NodeContracts {
  rootType: string;
  nodeTypes: readonly string[];
  sharedNodeFields: readonly string[];
}

export interface LocationContracts {
  positionFields: readonly string[];
  locationFields: readonly string[];
  sourceLocationFields?: readonly string[];
  baseNodeFields: readonly string[];
}

export interface DiagnosticContracts {
  diagnosticFields: readonly string[];
  diagnosticTokenFields: readonly string[];
  fields?: readonly string[];
  tokenFields?: readonly string[];
}

export interface CustomAstTypeMetadata {
  nodes: NodeContracts;
  locations: LocationContracts;
  diagnosticTypes: DiagnosticContracts;
}

export const contractKeys = ["nodes", "locations", "diagnosticTypes"] as const;
export const diagnosticTypes = diagnostics.diagnosticTypes;
export { nodes, locations };
