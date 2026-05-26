import { afterEach, describe, expect, it, vi } from "vitest";

import { getCookie } from "./createCookie";

describe("getCookie", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a secure http-only cookie with the expected expiration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T10:00:00.000Z"));

    expect(getCookie("accessToken", "token-value", 60 * 60 * 1000)).toBe(
      "accessToken=token-value;HttpOnly; Secure; SameSite=Strict;Expires=Thu, 14 May 2026 11:00:00 GMT;",
    );
  });
});
