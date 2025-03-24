/**
 * Returns a string function for checking if text is non-airline information
 */
export function isNonAirlineTextFunction(): string {
  return `
    function isNonAirlineText(text) {
      return (
        text.includes("Nonstop") ||
        text.includes("stop") ||
        text.includes("hr") ||
        text.includes("min") ||
        text.includes("Self transfer") ||
        text.includes("Separate tickets") ||
        text.includes("multiple airlines") ||
        text.includes("Missed connections") ||
        text.includes("Price unavailable") ||
        text.includes("Departure") ||
        text.includes("Unknown emissions") ||
        /\\d{1,2}:\\d{2}/.test(text) || // Skip times
        /^\\d{1,2}/.test(text) ||     // Skip numbers
        /[A-Z]{3}/.test(text) ||  // Airport codes often have 3 capital letters
        text.length < 2 ||         // Skip very short text
        text.includes("+") ||
        text.includes("%")
      );
    }
  `;
}
