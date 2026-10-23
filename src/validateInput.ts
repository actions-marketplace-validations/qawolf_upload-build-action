import * as core from "@actions/core";

import type { UploadBuildParams } from "@qawolf/ci-sdk";

import { optionalInput } from "./optionalInput.js";
import type { EventDefaults } from "./readEventDefaults.js";
import { resolveEnvironment } from "./resolveEnvironment.js";

export type ValidatedInput = {
  apiKey: string;
  qawolfBaseUrl: string;
  upload: UploadBuildParams;
};

const defaultQawolfBaseUrl = "https://app.qawolf.com";

export type ValidationResult =
  | ({ isValid: true } & ValidatedInput)
  | { error: string; isValid: false };

function invalid(error: string): ValidationResult {
  return { error, isValid: false };
}

export function validateInput(eventDefaults: EventDefaults): ValidationResult {
  const apiKey = core.getInput("qawolf-api-key", { required: true });
  const filePath = core.getInput("input-file-path", { required: true });

  const environment = resolveEnvironment();
  if (environment && "error" in environment) return invalid(environment.error);

  const qawolfBaseUrl =
    optionalInput("qawolf-base-url") ?? defaultQawolfBaseUrl;
  if (!URL.canParse(qawolfBaseUrl))
    return invalid("'qawolf-base-url' input must be a valid URL");

  return {
    apiKey,
    isValid: true,
    qawolfBaseUrl,
    upload: {
      branch: optionalInput("branch") ?? eventDefaults.branch,
      commitSha: optionalInput("commit-sha") ?? eventDefaults.commitSha,
      environment,
      filePath,
      workspaceId: optionalInput("workspace-id"),
    },
  };
}
