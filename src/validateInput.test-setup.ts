import { jest } from "@jest/globals";

export const defaultInputs: Record<string, string> = {
  "base-environment": "",
  branch: "",
  "commit-sha": "",
  environment: "",
  "environment-id": "",
  "ephemeral-environment": "",
  "input-file-path": "app/app-release.apk",
  "qawolf-api-key": "test-api-key",
  "qawolf-base-url": "",
  "workspace-id": "",
};

export const mockGetInput = jest.fn<(name: string) => string>();

export const mockActionsCore = {
  getInput: mockGetInput,
};

export function mockInputs(overrides: Record<string, string> = {}) {
  mockGetInput.mockImplementation(
    (name) => overrides[name] ?? defaultInputs[name] ?? "",
  );
}
