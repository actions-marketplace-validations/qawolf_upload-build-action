# Upload build to QA Wolf

## Introduction

This action uploads an Android `.apk` or `.aab`, or an iOS `.ipa` build to QA Wolf and registers it, so runs can install it. QA Wolf reads the app ID, version and build number from the file. This action uses [the `@qawolf/ci-sdk`
package](https://www.npmjs.com/package/@qawolf/ci-sdk).

A build goes on an environment when you pass `environment` or `environment-id`: runs there install it from now on, until a newer build of the same app and platform arrives. Without either, only runs created with the build install it.

## Inputs

### `qawolf-api-key`

**Required**. The QA Wolf API key, which you can find on the application's workspace settings page.

### `input-file-path`

**Required**. The path to the `.apk`, `.aab` or `.ipa` file to upload, at most 500 MB. Must exist at this location on the file system.

### `workspace-id`

The id of the QA Wolf workspace to upload into. Required when the API key belongs to an organization or a user rather than a single workspace.

### `environment`

The name or alias of the QA Wolf environment whose runs install the build. Creates the environment when none matches. Mutually exclusive with `environment-id`.

### `environment-id`

The id of an existing QA Wolf environment whose runs install the build. Never creates an environment. Mutually exclusive with `environment`.

### `ephemeral-environment`

Set to `true` when `environment` names an ephemeral environment that QA Wolf should create for this build, such as a pull request's. Requires `environment`.

### `base-environment`

The name or alias of the environment a created ephemeral environment copies from. Only valid with `ephemeral-environment`.

### `branch`

The git branch the build came from, shown with the build. Extracted from the event when omitted: a pull request's head branch, or the pushed branch.

### `commit-sha`

The SHA of the commit the build came from, shown with the build. Extracted from the event when omitted: a pull request's head commit, or the pushed commit.

### `qawolf-base-url`

The base URL of the QA Wolf API. Defaults to `https://app.qawolf.com`.

## Outputs

### `build-id`

The id of the build QA Wolf created.

### `app-id`

The package name (Android) or bundle ID (iOS) QA Wolf read from the file. A flow launches the app with `launch({ app: { id } })`.

### `platform`

The platform the build runs on: `android` or `ios`.

### `version`

The `versionName` (Android) or `CFBundleShortVersionString` (iOS) of the build. Empty when the file has none.

### `build-number`

The `versionCode` (Android) or `CFBundleVersion` (iOS) of the build. Empty when the file has none.

### Usage Example

```yml
name: Upload Build
on: push
jobs:
  upload-build:
    runs-on: ubuntu-latest
    steps:
      ....
      - name: Upload Build
        id: upload-build
        uses: qawolf/upload-build-action@v1
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          workspace-id: "${{ vars.QAWOLF_WORKSPACE_ID }}"
          input-file-path: "app/build/outputs/apk/release/app-release.apk"
          environment: "staging"
      - name: Print the build
        run: echo "${{ steps.upload-build.outputs.build-id }} ${{ steps.upload-build.outputs.app-id }} ${{ steps.upload-build.outputs.version }} ${{ steps.upload-build.outputs.build-number }}"
      ....
```

### Usage on a Pull Request

Upload the build of a pull request to its own ephemeral environment, copied from `staging`:

```yml
- name: Upload Build
  uses: qawolf/upload-build-action@v1
  with:
    qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
    input-file-path: "app/build/outputs/apk/release/app-release.apk"
    environment: "pr-${{ github.event.pull_request.number }}"
    ephemeral-environment: "true"
    base-environment: "staging"
```

Use the same environment name in the `qawolf/notify-qawolf-on-deploy-action` step that reports the deployment, so the runs it starts install this build.
