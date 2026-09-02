/**
 * Extracts a human-readable error message from an API error payload.
 *
 * Handles:
 *  - plain strings
 *  - Zod `flatten()` shaped objects ({ formErrors, fieldErrors })
 *  - generic objects (JSON-stringified as fallback)
 *  - nullish / non-string primitives
 */
export function extractApiError(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    return error || fallback;
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // Zod flatten shape: { formErrors: string[], fieldErrors: Record<string, string[]> }
    if (Array.isArray(obj.formErrors) && obj.formErrors.length > 0) {
      return String(obj.formErrors[0]);
    }

    if (obj.fieldErrors && typeof obj.fieldErrors === "object") {
      const fieldErrs = obj.fieldErrors as Record<string, unknown>;
      for (const key of Object.keys(fieldErrs)) {
        const arr = fieldErrs[key];
        if (Array.isArray(arr) && arr.length > 0) {
          return String(arr[0]);
        }
      }
    }

    // { message: "..." } shape (e.g. Error instances serialised to JSON)
    if (typeof obj.message === "string" && obj.message) {
      return obj.message;
    }

    return fallback;
  }

  return String(error) || fallback;
}
