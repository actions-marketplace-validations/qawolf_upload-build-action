import type {
  UploadBuildParams,
  UploadBuildResult,
  UploadedBuild,
} from "@qawolf/ci-sdk";

export type Dependencies = {
  uploadBuild: (params: UploadBuildParams) => Promise<UploadBuildResult>;
};

export type ActionOutcome =
  | { build: UploadedBuild; outcome: "uploaded" }
  | { message: string; outcome: "failed" };

function describeFailure(
  result: Exclude<UploadBuildResult, { outcome: "uploaded" }>,
): string {
  switch (result.outcome) {
    case "conflict":
    case "invalid-request":
    case "not-found":
    case "unauthorized": {
      const message = result.message ? `: ${result.message}` : "";
      return `QA Wolf refused to ${describeStep(result.failedStep)} (${result.outcome})${message}.`;
    }
    case "file-unreadable":
      return `'${result.filePath}' is not a readable file.`;
    case "invalid-response-body":
      return `QA Wolf answered the request to ${describeStep(result.failedStep)} with a body this action does not understand. Update the action.`;
    case "network-error":
      return `Failed to reach the QA Wolf API while asking it to ${describeStep(result.failedStep)}.`;
    case "server-error":
    case "unexpected-status": {
      const message =
        "message" in result && result.message ? `: ${result.message}` : "";
      return `QA Wolf answered the request to ${describeStep(result.failedStep)} with HTTP status ${result.httpStatus}${message}.`;
    }
    case "upload-network-error":
      return `Failed to upload build ${result.buildId}: the connection to storage failed.`;
    case "upload-rejected":
      return `Storage refused the upload of build ${result.buildId} with HTTP status ${result.httpStatus}.`;
  }
}

function describeStep(step: "create" | "request-upload"): string {
  return step === "create" ? "create the build" : "sign the upload";
}

export async function runAction(
  upload: UploadBuildParams,
  deps: Dependencies,
): Promise<ActionOutcome> {
  const result = await deps.uploadBuild(upload);
  if (result.outcome !== "uploaded")
    return { message: describeFailure(result), outcome: "failed" };
  return { build: result.build, outcome: "uploaded" };
}
