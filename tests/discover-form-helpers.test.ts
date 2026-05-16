import { describe, expect, it } from "vitest";

import {
  isDiscoverActionsFormDirty,
  toggleArrayMember,
} from "@/features/discover/form-helpers";

describe("isDiscoverActionsFormDirty", () => {
  it("returns false when all fields are at default", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 0,
        reviewContent: "",
        recommendIds: [],
      }),
    ).toBe(false);
  });

  it("returns true when rating is set", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 3,
        reviewContent: "",
        recommendIds: [],
      }),
    ).toBe(true);
  });

  it("returns true when review content has actual text", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 0,
        reviewContent: "Super livre",
        recommendIds: [],
      }),
    ).toBe(true);
  });

  it("returns false when review content is only whitespace", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 0,
        reviewContent: "   \n  \t  ",
        recommendIds: [],
      }),
    ).toBe(false);
  });

  it("returns true when at least one user is selected for recommendation", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 0,
        reviewContent: "",
        recommendIds: ["user-1"],
      }),
    ).toBe(true);
  });

  it("returns true when multiple signals are set", () => {
    expect(
      isDiscoverActionsFormDirty({
        rating: 5,
        reviewContent: "great",
        recommendIds: ["a", "b"],
      }),
    ).toBe(true);
  });
});

describe("toggleArrayMember", () => {
  it("adds the value when absent", () => {
    expect(toggleArrayMember(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("removes the value when present", () => {
    expect(toggleArrayMember(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("does not mutate the original array", () => {
    const original = ["a", "b"];
    toggleArrayMember(original, "c");
    expect(original).toEqual(["a", "b"]);
  });

  it("works with numbers", () => {
    expect(toggleArrayMember([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("returns a new array reference even on remove", () => {
    const original = ["x"];
    const result = toggleArrayMember(original, "x");
    expect(result).not.toBe(original);
    expect(result).toEqual([]);
  });

  it("handles empty array (add)", () => {
    expect(toggleArrayMember<string>([], "first")).toEqual(["first"]);
  });
});
