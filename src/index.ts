import * as core from "@actions/core";
import * as github from "@actions/github";

import { makeQaWolfSdk } from "@qawolf/ci-sdk";
import { coreLogDriver, stringifyUnknown } from "@qawolf/ci-utils";

import packageJson from "../package.json" with { type: "json" };

import { readEventDefaults } from "./readEventDefaults.js";
import { runAction } from "./runAction.js";
import { validateInput } from "./validateInput.js";

async function runGitHubAction() {
  core.debug("Validating input.");
  const validationResult = validateInput(readEventDefaults(github.context));
  if (!validationResult.isValid) {
    core.setFailed(`Action input is invalid: ${validationResult.error}`);
    return;
  }
  const { apiKey, qawolfBaseUrl, upload } = validationResult;
  const { uploadBuild } = makeQaWolfSdk(
    {
      apiKey,
      serviceBase: qawolfBaseUrl,
      userAgent: `upload-build-action/${packageJson.version}`,
    },
    { log: coreLogDriver },
  );

  core.info(`Beginning upload of ${upload.filePath}.`);
  const outcome = await runAction(upload, { uploadBuild });
  if (outcome.outcome === "failed") {
    core.setFailed(outcome.message);
    return;
  }

  const { build } = outcome;
  core.setOutput("build-id", build.id);
  core.setOutput("app-id", build.appId);
  core.setOutput("platform", build.platform);
  core.setOutput("version", build.version ?? "");
  core.setOutput("build-number", build.buildNumber ?? "");
  core.info(`Successfully uploaded build ${build.id}: ${build.url}`);
}

runGitHubAction().catch((error) => {
  core.setFailed(
    `Action failed with reason: ${stringifyUnknown(error) ?? "Unknown error"}`,
  );
});
