import { jest } from "@jest/globals";

import { mockActionsCore, mockInputs } from "./validateInput.test-setup.js";

jest.unstable_mockModule("@actions/core", () => mockActionsCore);

const { validateInput } = await import("./validateInput.js");

const eventDefaults = { branch: "feature/login", commitSha: "event-sha" };

describe("validateInput", () => {
  it("takes the file and the branch and commit of the event when nothing else is set", () => {
    mockInputs();

    expect(validateInput(eventDefaults)).toEqual({
      apiKey: "test-api-key",
      isValid: true,
      qawolfBaseUrl: "https://app.qawolf.com",
      upload: {
        branch: "feature/login",
        commitSha: "event-sha",
        environment: undefined,
        filePath: "app/app-release.apk",
        workspaceId: undefined,
      },
    });
  });

  it("prefers the branch, commit and workspace inputs to the event", () => {
    mockInputs({
      branch: "release/1.2",
      "commit-sha": "input-sha",
      "workspace-id": "workspace-1",
    });

    const result = validateInput(eventDefaults);

    if (!result.isValid) throw Error(result.error);
    expect(result.upload).toMatchObject({
      branch: "release/1.2",
      commitSha: "input-sha",
      workspaceId: "workspace-1",
    });
  });

  it("leaves the branch out when the event has none", () => {
    mockInputs();

    const result = validateInput({ branch: undefined, commitSha: "sha" });

    if (!result.isValid) throw Error(result.error);
    expect(result.upload.branch).toBeUndefined();
  });

  it("calls the QA Wolf API at the given base URL", () => {
    mockInputs({ "qawolf-base-url": "https://staging.qawolf.app" });

    const result = validateInput(eventDefaults);

    if (!result.isValid) throw Error(result.error);
    expect(result.qawolfBaseUrl).toEqual("https://staging.qawolf.app");
  });

  it("puts the build on a named environment", () => {
    mockInputs({ environment: "staging" });

    const result = validateInput(eventDefaults);

    if (!result.isValid) throw Error(result.error);
    expect(result.upload.environment).toEqual({ name: "staging" });
  });

  it("puts the build on an ephemeral environment copied from a base", () => {
    mockInputs({
      "base-environment": "staging",
      environment: "pr-42",
      "ephemeral-environment": "true",
    });

    const result = validateInput(eventDefaults);

    if (!result.isValid) throw Error(result.error);
    expect(result.upload.environment).toEqual({
      baseEphemeralEnvironment: "staging",
      ephemeral: true,
      name: "pr-42",
    });
  });

  it("puts the build on an existing environment by id", () => {
    mockInputs({ "environment-id": "env_123" });

    const result = validateInput(eventDefaults);

    if (!result.isValid) throw Error(result.error);
    expect(result.upload.environment).toEqual({ id: "env_123" });
  });

  it.each([
    [
      "an environment name and an id",
      { environment: "staging", "environment-id": "env_123" },
      "'environment' and 'environment-id' are mutually exclusive",
    ],
    [
      "a base environment without ephemeral-environment",
      { "base-environment": "staging", environment: "pr-42" },
      "'base-environment' input is only valid when 'ephemeral-environment' is true",
    ],
    [
      "ephemeral-environment without an environment name",
      { "ephemeral-environment": "true" },
      "'ephemeral-environment' and 'base-environment' inputs require 'environment'",
    ],
    [
      "a base URL that is not a URL",
      { "qawolf-base-url": "app.qawolf.com" },
      "'qawolf-base-url' input must be a valid URL",
    ],
  ])("rejects %s", (_description, inputs, error) => {
    mockInputs(inputs);

    expect(validateInput(eventDefaults)).toEqual({ error, isValid: false });
  });
});
