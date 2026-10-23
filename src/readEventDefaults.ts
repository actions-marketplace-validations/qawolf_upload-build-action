export type EventDefaults = {
  branch: string | undefined;
  commitSha: string;
};

type PullRequestPayload = {
  pull_request?: { head: { ref: string; sha: string } };
};

const branchRefPrefix = "refs/heads/";

/**
 * The branch and commit a build came from when the workflow does not say. On a
 * pull request event that is the pull request's head, not the merge commit
 * GitHub checks out.
 */
export function readEventDefaults(context: {
  payload: object;
  ref: string;
  sha: string;
}): EventDefaults {
  const { pull_request: pullRequest } = context.payload as PullRequestPayload;
  if (pullRequest)
    return { branch: pullRequest.head.ref, commitSha: pullRequest.head.sha };

  return {
    branch: context.ref.startsWith(branchRefPrefix)
      ? context.ref.slice(branchRefPrefix.length)
      : undefined,
    commitSha: context.sha,
  };
}
