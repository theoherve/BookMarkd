import { describe, expect, it } from "vitest";

import {
  stripISBN,
  validateISBN13,
  validateISBN10,
  convertISBN10to13,
  normalizeToISBN13,
  isBookBarcode,
} from "@/lib/isbn";

describe("stripISBN", () => {
  it("removes hyphens", () => {
    expect(stripISBN("978-2-07-061275-8")).toBe("9782070612758");
  });

  it("removes spaces", () => {
    expect(stripISBN("978 2 07 061275 8")).toBe("9782070612758");
  });

  it("returns clean ISBN unchanged", () => {
    expect(stripISBN("9782070612758")).toBe("9782070612758");
  });
});

describe("validateISBN13", () => {
  it("validates Le Petit Prince ISBN-13", () => {
    expect(validateISBN13("9782070612758")).toBe(true);
  });

  it("validates with hyphens", () => {
    expect(validateISBN13("978-2-07-061275-8")).toBe(true);
  });

  it("validates a 979 prefix ISBN", () => {
    // 979-10 is a valid French ISBN prefix
    expect(validateISBN13("9791032305690")).toBe(true);
  });

  it("rejects invalid check digit", () => {
    expect(validateISBN13("9782070612759")).toBe(false);
  });

  it("rejects non-book EAN (not 978/979)", () => {
    expect(validateISBN13("5901234123457")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(validateISBN13("978207061275")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(validateISBN13("978207061275X")).toBe(false);
  });
});

describe("validateISBN10", () => {
  it("validates a valid ISBN-10", () => {
    // 2070612759 is actually a valid ISBN-10 (Le Petit Prince)
    expect(validateISBN10("2070612759")).toBe(true);
  });

  it("validates ISBN-10 with X check digit", () => {
    // 080442957X is a well-known valid ISBN-10
    expect(validateISBN10("080442957X")).toBe(true);
  });

  it("validates ISBN-10 with lowercase x", () => {
    expect(validateISBN10("080442957x")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(validateISBN10("12345678")).toBe(false);
  });

  it("rejects invalid check digit", () => {
    expect(validateISBN10("0804429571")).toBe(false);
  });
});

describe("convertISBN10to13", () => {
  it("converts a valid ISBN-10 to ISBN-13", () => {
    // 080442957X → 9780804429573 (check digit recalculated)
    const result = convertISBN10to13("080442957X");
    expect(result).not.toBeNull();
    expect(result).toHaveLength(13);
    expect(result?.startsWith("978")).toBe(true);
    expect(validateISBN13(result!)).toBe(true);
  });

  it("returns null for invalid ISBN-10", () => {
    expect(convertISBN10to13("1234567890")).toBeNull();
  });
});

describe("normalizeToISBN13", () => {
  it("returns ISBN-13 unchanged if valid", () => {
    expect(normalizeToISBN13("9782070612758")).toBe("9782070612758");
  });

  it("strips and validates ISBN-13 with hyphens", () => {
    expect(normalizeToISBN13("978-2-07-061275-8")).toBe("9782070612758");
  });

  it("converts valid ISBN-10 to ISBN-13", () => {
    const result = normalizeToISBN13("080442957X");
    expect(result).not.toBeNull();
    expect(result).toHaveLength(13);
    expect(validateISBN13(result!)).toBe(true);
  });

  it("returns null for invalid input", () => {
    expect(normalizeToISBN13("not-an-isbn")).toBeNull();
    expect(normalizeToISBN13("12345")).toBeNull();
    expect(normalizeToISBN13("")).toBeNull();
  });
});

describe("isBookBarcode", () => {
  it("recognizes 978 barcode as book", () => {
    expect(isBookBarcode("9782070612758")).toBe(true);
  });

  it("recognizes 979 barcode as book", () => {
    expect(isBookBarcode("9791032305690")).toBe(true);
  });

  it("rejects non-book EAN-13", () => {
    expect(isBookBarcode("5901234123457")).toBe(false);
  });

  it("rejects non-13-digit strings", () => {
    expect(isBookBarcode("12345")).toBe(false);
    expect(isBookBarcode("")).toBe(false);
  });
});
