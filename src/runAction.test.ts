import { jest } from "@jest/globals";

import type { UploadBuildParams } from "@qawolf/ci-sdk";

import type { Dependencies } from "./runAction.js";
import { runAction } from "./runAction.js";

const upload: UploadBuildParams = { filePath: "app-release.apk" };

const build = {
  appId: "com.example.howl",
  createdAt: "2026-01-01T00:00:00.000Z",
  fileName: "app-release.apk",
  id: "abcdefghijklmnopqrstuvwxobld",
  platform: "android",
  url: "https://app.qawolf.com/acme/builds",
} as const;

function makeDependencies(
  result: Awaited<ReturnType<Dependencies["uploadBuild"]>>,
) {
  return {
    uploadBuild: jest.fn<Dependencies["uploadBuild"]>(async () => result),
  };
}

describe("runAction", () => {
  it("uploads the build and answers it", async () => {
    const deps = makeDependencies({ build, outcome: "uploaded" });

    await expect(runAction(upload, deps)).resolves.toEqual({
      build,
      outcome: "uploaded",
    });
    expect(deps.uploadBuild).toHaveBeenCalledWith(upload);
  });

  it.each([
    [
      "an unreadable file",
      { filePath: "app-release.apk", outcome: "file-unreadable" },
      "'app-release.apk' is not a readable file.",
    ],
    [
      "a refusal to sign the upload",
      {
        failedStep: "request-upload",
        message: "A build is an .apk, .aab or .ipa file.",
        outcome: "invalid-request",
      },
      "QA Wolf refused to sign the upload (invalid-request): A build is an .apk, .aab or .ipa file..",
    ],
    [
      "a rejected upload",
      { buildId: "bld", httpStatus: 403, outcome: "upload-rejected" },
      "Storage refused the upload of build bld with HTTP status 403.",
    ],
    [
      "a refusal to create the build",
      {
        buildId: "bld",
        failedStep: "create",
        message: "The file is not an app",
        outcome: "invalid-request",
      },
      "QA Wolf refused to create the build (invalid-request): The file is not an app.",
    ],
    [
      "a server error",
      {
        buildId: "bld",
        failedStep: "create",
        httpStatus: 503,
        outcome: "server-error",
      },
      "QA Wolf answered the request to create the build with HTTP status 503.",
    ],
    [
      "a failed connection to storage",
      { buildId: "bld", outcome: "upload-network-error" },
      "Failed to upload build bld: the connection to storage failed.",
    ],
    [
      "a network error",
      { failedStep: "request-upload", outcome: "network-error" },
      "Failed to reach the QA Wolf API while asking it to sign the upload.",
    ],
  ] as const)("fails on %s", async (_description, result, message) => {
    const deps = makeDependencies(result);

    await expect(runAction(upload, deps)).resolves.toEqual({
      message,
      outcome: "failed",
    });
  });
});
