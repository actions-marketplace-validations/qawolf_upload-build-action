import type { UploadBuildParams } from "@qawolf/ci-sdk";

import { optionalInput } from "./optionalInput.js";

/**
 * Answers the environment the build goes on, or undefined for a build that
 * only runs created with it install.
 */
export function resolveEnvironment():
  | UploadBuildParams["environment"]
  | { error: string } {
  const name = optionalInput("environment");
  const id = optionalInput("environment-id");
  const ephemeral = optionalInput("ephemeral-environment") === "true";
  const baseEphemeralEnvironment = optionalInput("base-environment");

  if (name && id) {
    return {
      error: "'environment' and 'environment-id' are mutually exclusive",
    };
  }
  if (!name) {
    if (ephemeral || baseEphemeralEnvironment) {
      return {
        error:
          "'ephemeral-environment' and 'base-environment' inputs require 'environment'",
      };
    }
    return id ? { id } : undefined;
  }
  if (baseEphemeralEnvironment && !ephemeral) {
    return {
      error:
        "'base-environment' input is only valid when 'ephemeral-environment' is true",
    };
  }
  return ephemeral
    ? { baseEphemeralEnvironment, ephemeral: true, name }
    : { name };
}
