export function parseGeminiError(error: any): string {
  if (!error) return "An unknown error occurred.";

  // Handle string errors
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      return parseGeminiError(parsed);
    } catch {
      return error;
    }
  }

  // Handle object errors (from Gemini SDK)
  const message = error.message || "";
  
  // High Demand (503)
  if (message.includes("503") || message.includes("high demand") || message.includes("UNAVAILABLE")) {
    return "The AI model is currently experiencing high demand. Please wait a few seconds and try again.";
  }

  // Rate Limit (429)
  if (message.includes("429") || message.includes("rate limit") || message.includes("RESOURCE_EXHAUSTED")) {
    return "You've reached the free tier limit. Please wait a minute before trying again.";
  }

  // Invalid API Key (401/400)
  if (message.includes("API key") || message.includes("INVALID_ARGUMENT") || message.includes("401") || message.includes("400")) {
    if (message.includes("API key not valid")) {
       return "The API key you provided is invalid. Please check your settings and try again.";
    }
    return "There's an issue with your API key configuration. Please verify it in settings.";
  }

  // Safety/Content filtering
  if (message.includes("SAFETY") || message.includes("blocked")) {
    return "The document content was flagged by safety filters. Please ensure the PDF is a standard financial statement.";
  }

  // Network/Connection
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
    return "Network connection error. Please check your internet and try again.";
  }

  // Generic fallback
  return error.message || "An unexpected error occurred during processing. Please try again.";
}
