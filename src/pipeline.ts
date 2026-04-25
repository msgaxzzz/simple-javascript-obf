import type * as BabelTypes from "@babel/types";

export interface PipelineOptions {
  seed?: string;
  timing?: boolean;
  vm: {
    enabled: boolean;
  };
  cff: boolean;
  strings: boolean;
  dead: boolean;
  antiHook?: {
    enabled?: boolean;
  };
  rename: boolean;
  renameOptions: {
    reserved: string[];
  };
}

export interface PipelineContextInput {
  t: typeof BabelTypes;
  traverse: unknown;
  options: PipelineOptions;
}

export type PipelinePlugin = (ast: unknown) => void;

const pipelineImpl = require("./pipeline-impl") as {
  buildPipeline: (input: PipelineContextInput) => PipelinePlugin[];
};

export const buildPipeline = pipelineImpl.buildPipeline;
