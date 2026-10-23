import * as core from "@actions/core";

// `getInput` answers an empty string for an input the workflow did not set.
export function optionalInput(name: string): string | undefined {
  return core.getInput(name).trim() || undefined;
}
