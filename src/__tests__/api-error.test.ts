import { describe, it, expect } from "vitest";
import { extractApiError } from "@/lib/api-error";

describe("extractApiError", () => {
  it("returns a plain string as-is", () => {
    expect(extractApiError("User not found")).toBe("User not found");
  });

  it("returns fallback for an empty string", () => {
    expect(extractApiError("")).toBe("Something went wrong");
  });

  it("returns fallback for null", () => {
    expect(extractApiError(null)).toBe("Something went wrong");
  });

  it("returns fallback for undefined", () => {
    expect(extractApiError(undefined)).toBe("Something went wrong");
  });

  it("uses custom fallback when provided", () => {
    expect(extractApiError(null, "Oops")).toBe("Oops");
  });

  it("extracts formErrors from a Zod flatten object", () => {
    const flat = {
      formErrors: ["Validation failed"],
      fieldErrors: {},
    };
    expect(extractApiError(flat)).toBe("Validation failed");
  });

  it("extracts fieldErrors when formErrors is empty", () => {
    const flat = {
      formErrors: [],
      fieldErrors: { email: ["Invalid email address"] },
    };
    expect(extractApiError(flat)).toBe("Invalid email address");
  });

  it("returns fallback for empty flatten object", () => {
    const flat = { formErrors: [], fieldErrors: {} };
    expect(extractApiError(flat)).toBe("Something went wrong");
  });

  it("extracts message from an Error-shaped object", () => {
    expect(extractApiError({ message: "Server error" })).toBe("Server error");
  });

  it("returns fallback for an empty object", () => {
    expect(extractApiError({})).toBe("Something went wrong");
  });

  it("converts a number to string", () => {
    expect(extractApiError(42)).toBe("42");
  });

  it("returns fallback for boolean false", () => {
    expect(extractApiError(false)).toBe("false");
  });

  it("prioritises formErrors over fieldErrors", () => {
    const flat = {
      formErrors: ["Top-level error"],
      fieldErrors: { email: ["Email is required"] },
    };
    expect(extractApiError(flat)).toBe("Top-level error");
  });

  it("handles nested Zod flatten from real Zod output", () => {
    const zodFlatten = {
      formErrors: [],
      fieldErrors: {
        email: ["Invalid email"],
        name: ["Required"],
      },
    };
    expect(extractApiError(zodFlatten)).toBe("Invalid email");
  });
});
