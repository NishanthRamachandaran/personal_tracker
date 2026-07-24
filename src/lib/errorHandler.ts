export function handleApplicationError(error: unknown, context: string = "Operation"): string {
  // Privately log full error stack/traceback for debugging
  console.error(`[SEC_LOG][${context}] Internal Diagnostic Details:`, error);

  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const rawMessage = typeof error === "string" ? error : (error as any)?.message || String(error);

  // Strip out SQL codes, database schemas, stack traces, and internal paths
  if (rawMessage.includes("duplicate key") || rawMessage.includes("unique constraint")) {
    return "An entry for this date already exists.";
  }

  if (rawMessage.includes("violates foreign key constraint") || rawMessage.includes("relation")) {
    return "Invalid reference item. Please refresh and try again.";
  }

  if (rawMessage.includes("JWT") || rawMessage.includes("auth") || rawMessage.includes("session")) {
    return "Your session has expired. Please sign in again.";
  }

  if (rawMessage.includes("fetch") || rawMessage.includes("network") || rawMessage.includes("Failed to fetch")) {
    return "Network connection issue. Please check your internet connection.";
  }

  if (rawMessage.includes("rate limit") || rawMessage.includes("too many requests")) {
    return "Too many requests. Please wait a moment before trying again.";
  }

  // Generic sanitized fallback
  return "Unable to complete request. Please try again later.";
}
