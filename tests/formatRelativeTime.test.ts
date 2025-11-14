import { describe, expect, it, vi } from "vitest";

import { formatRelativeTimeFromNow } from "@/lib/datetime";

describe("formatRelativeTimeFromNow", () => {
  it("returns 'maintenant' for same time", () => {
    const now = new Date();
    expect(formatRelativeTimeFromNow(now)).toBe("maintenant");
  });

  it("handles past dates", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatRelativeTimeFromNow(past)).toContain("il y a");
  });

  it("handles future dates", () => {
    const now = new Date();
    vi.setSystemTime(now);
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    expect(formatRelativeTimeFromNow(future)).toContain("dans");
  });
});

