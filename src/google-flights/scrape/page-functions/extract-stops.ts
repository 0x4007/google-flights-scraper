/**
 * Returns a string function for extracting the number of stops
 */
export function extractStopsFunction(): string {
  return `
    function extractStops(flightElement) {
      for (const el of Array.from(flightElement.querySelectorAll("div, span"))) {
        const text = el.textContent?.trim() || "";

        if (text === "Nonstop") {
          return 0;
        }

        const stopsMatch = text.match(/^(\\d+)\\s+stop/);
        if (stopsMatch && stopsMatch[1]) {
          return parseInt(stopsMatch[1], 10);
        }
      }

      return -1; // Unknown number of stops
    }
  `;
}
