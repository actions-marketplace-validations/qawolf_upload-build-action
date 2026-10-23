import { readEventDefaults } from "./readEventDefaults.js";

describe("readEventDefaults", () => {
  it("reads the head of a pull request, not the merge commit GitHub checks out", () => {
    expect(
      readEventDefaults({
        payload: { pull_request: { head: { ref: "feature/x", sha: "head" } } },
        ref: "refs/pull/42/merge",
        sha: "merge",
      }),
    ).toEqual({ branch: "feature/x", commitSha: "head" });
  });

  it("reads the branch and commit of a push", () => {
    expect(
      readEventDefaults({ payload: {}, ref: "refs/heads/main", sha: "abc" }),
    ).toEqual({ branch: "main", commitSha: "abc" });
  });

  it("has no branch for a tag", () => {
    expect(
      readEventDefaults({ payload: {}, ref: "refs/tags/v1.0.0", sha: "abc" }),
    ).toEqual({ branch: undefined, commitSha: "abc" });
  });
});
