/**
 * Returns a string function for extracting airline names from a flight element
 */
export function extractAirlineNamesFunction(): string {
  return `
    function extractAirlineNames(flightElement) {
      const airlines = [];

      // Method 1: Look for airline logos and text
      const airlineElements = flightElement.querySelectorAll(
        'img[alt*="Airlines"], img[alt*="Air"], ' +
        'div > span:not([aria-label]), div > div > span:not([aria-label])'
      );

      for (const el of Array.from(airlineElements)) {
        let text = "";

        // Check for image alt text first
        if (el.tagName === "IMG") {
          text = el.getAttribute("alt") || "";
        } else {
          text = el.textContent?.trim() || "";
        }

        // Skip non-airline text
        if (!text || isNonAirlineText(text)) continue;

        // Clean and add the airline name
        addAirlineName(airlines, text.trim());
      }

      // Method 2: Check aria-labels for airline information
      const elementsWithAriaLabel = flightElement.querySelectorAll('[aria-label*="Airlines"], [aria-label*="flight with"]');

      for (const el of Array.from(elementsWithAriaLabel)) {
        const ariaLabel = el.getAttribute("aria-label") || "";

        // Extract airline from "flight with X Airlines" pattern
        const airlineMatch = ariaLabel.match(/flight with ([^,.]+?)(?:\\.|\\sand|,|$)/i);
        if (airlineMatch && airlineMatch[1]) {
          addAirlineName(airlines, airlineMatch[1].trim());
        }
      }

      return airlines;
    }
  `;
}
