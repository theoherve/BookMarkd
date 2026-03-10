/**
 * ISBN validation and conversion utilities.
 * Supports ISBN-13 (EAN-13 barcodes starting with 978/979) and ISBN-10.
 */

/** Strip hyphens, spaces, and whitespace from an ISBN string. */
export const stripISBN = (isbn: string): string => {
  return isbn.replace(/[\s-]/g, "");
};

/** Validate an ISBN-13 string (13 digits, valid check digit, starts with 978 or 979). */
export const validateISBN13 = (isbn: string): boolean => {
  const stripped = stripISBN(isbn);

  if (!/^\d{13}$/.test(stripped)) {
    return false;
  }

  if (!stripped.startsWith("978") && !stripped.startsWith("979")) {
    return false;
  }

  // Check digit validation (alternating weights 1 and 3)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(stripped[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(stripped[12], 10);
};

/** Validate an ISBN-10 string (9 digits + check digit which can be 0-9 or X). */
export const validateISBN10 = (isbn: string): boolean => {
  const stripped = stripISBN(isbn);

  if (!/^\d{9}[\dXx]$/.test(stripped)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(stripped[i], 10) * (10 - i);
  }

  const lastChar = stripped[9].toUpperCase();
  const checkValue = lastChar === "X" ? 10 : parseInt(lastChar, 10);
  sum += checkValue;

  return sum % 11 === 0;
};

/** Convert an ISBN-10 to ISBN-13. Returns null if the input is not a valid ISBN-10. */
export const convertISBN10to13 = (isbn10: string): string | null => {
  const stripped = stripISBN(isbn10);

  if (!validateISBN10(stripped)) {
    return null;
  }

  // Take first 9 digits, prepend 978
  const base = "978" + stripped.slice(0, 9);

  // Calculate ISBN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit;
};

/** Validate any ISBN (10 or 13) and return the normalized ISBN-13. Returns null if invalid. */
export const normalizeToISBN13 = (isbn: string): string | null => {
  const stripped = stripISBN(isbn);

  if (stripped.length === 13 && validateISBN13(stripped)) {
    return stripped;
  }

  if (stripped.length === 10 && validateISBN10(stripped)) {
    return convertISBN10to13(stripped);
  }

  return null;
};

/** Check if a scanned EAN-13 barcode is a book ISBN (starts with 978 or 979). */
export const isBookBarcode = (ean13: string): boolean => {
  const stripped = stripISBN(ean13);
  return (
    /^\d{13}$/.test(stripped) &&
    (stripped.startsWith("978") || stripped.startsWith("979"))
  );
};
