import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password utils", () => {
  it("hashes and verifies a valid password", () => {
    const passwordHash = hashPassword("correct-password");

    expect(passwordHash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    expect(verifyPassword("correct-password", passwordHash)).toBe(true);
  });

  it("rejects invalid passwords and malformed hashes", () => {
    const passwordHash = hashPassword("correct-password");

    expect(verifyPassword("wrong-password", passwordHash)).toBe(false);
    expect(verifyPassword("correct-password", "not-a-valid-hash")).toBe(false);
  });
});
