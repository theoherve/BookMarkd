import { describe, expect, it } from "vitest";

import {
  AwardsYearGuardError,
  assertYearAllowed,
} from "@/features/awards/server/aggregate";
import { MIN_AWARDS_YEAR } from "@/features/awards/types";

describe("assertYearAllowed", () => {
  it("rejects years before MIN_AWARDS_YEAR", () => {
    expect(() => assertYearAllowed(2025)).toThrow(AwardsYearGuardError);
    expect(() => assertYearAllowed(2024)).toThrow(AwardsYearGuardError);
  });

  it("accepts MIN_AWARDS_YEAR and beyond", () => {
    expect(() => assertYearAllowed(MIN_AWARDS_YEAR)).not.toThrow();
    expect(() => assertYearAllowed(MIN_AWARDS_YEAR + 5)).not.toThrow();
  });
});
