import type { BaseNode } from "./nodes";

export interface ValidateOptions {
  checkSemantics?: boolean;
  throw?: boolean;
}

const validateImpl = require("./validate-impl") as {
  validate: (ast: BaseNode, options?: ValidateOptions) => string[];
};

export const validate = validateImpl.validate;
