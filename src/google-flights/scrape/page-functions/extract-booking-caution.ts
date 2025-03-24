/**
 * Returns a string function for extracting booking caution information
 */
export function extractBookingCautionFunction(): string {
  return `
    function extractBookingCaution(flightElement) {
      const cautionTexts = ["Self transfer", "Separate tickets", "Multiple airlines"];

      for (const el of Array.from(flightElement.querySelectorAll("div, span"))) {
        const text = el.textContent?.trim() || "";

        for (const cautionType of cautionTexts) {
          if (text.includes(cautionType)) {
            return cautionType === "Multiple airlines"
              ? "Multiple airlines, separate tickets"
              : cautionType;
          }
        }
      }

      return null;
    }
  `;
}
