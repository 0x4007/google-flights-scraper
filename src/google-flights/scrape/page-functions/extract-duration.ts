/**
 * Returns a string function for extracting flight duration
 */
export function extractDurationFunction(): string {
  return `
    function extractDuration(flightElement) {
      // Look for duration pattern (e.g., "2 hr 30 min")
      for (const el of Array.from(flightElement.querySelectorAll("div, span"))) {
        const text = el.textContent?.trim() || "";
        if (/^\\d+\\s*hr(\\s*\\d+\\s*min)?$/.test(text)) {
          return text;
        }
      }

      return null;
    }
  `;
}
