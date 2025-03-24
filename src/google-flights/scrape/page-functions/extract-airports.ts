/**
 * Returns a string function for extracting origin and destination airports
 */
export function extractAirportsFunction(): string {
  return `
    function extractAirports(flightElement) {
      let origin = null;
      let destination = null;

      // Method 1: Try to find codes in aria-labels
      const flightDetailsElements = Array.from(
        flightElement.querySelectorAll("[aria-label*='airport'], [aria-label*='leaves'], [aria-label*='arrives']")
      );

      for (const element of flightDetailsElements) {
        const ariaLabel = element.getAttribute("aria-label") || "";
        const airportCodes = ariaLabel.match(/\\b([A-Z]{3})\\b/g);

        if (airportCodes && airportCodes.length >= 2) {
          origin = airportCodes[0];
          destination = airportCodes[1];
          break;
        }
      }

      // Method 2: Look for airport codes near duration
      if (!origin || !destination) {
        const durationElements = Array.from(
          flightElement.querySelectorAll("div, span")
        ).filter(el => /^\\d+\\s*hr/.test(el.textContent?.trim() || ""));

        for (const durElement of durationElements) {
          // Find nearby code elements
          const parentContainer = durElement.parentElement;
          if (!parentContainer) continue;

          const possibleAirportElements = Array.from(
            parentContainer.querySelectorAll("div, span")
          ).filter(el => {
            const text = el.textContent?.trim() || "";
            return /^[A-Z]{3}$/.test(text);
          });

          if (possibleAirportElements.length >= 2) {
            // Check for airline context
            const airportElements = possibleAirportElements.filter(el => {
              const parent = el.parentElement;
              if (!parent) return true;

              const parentText = parent.textContent || "";
              const isInAirlineContext =
                parentText.includes("Airlines") ||
                parentText.includes("operated by");

              return !isInAirlineContext;
            });

            if (airportElements.length >= 2) {
              origin = getText(airportElements[0]);
              destination = getText(airportElements[1]);
              break;
            }
          }
        }
      }

      // Method 3: Direct search for airport codes
      if (!origin || !destination) {
        const codeElements = Array.from(
          flightElement.querySelectorAll("div, span")
        ).filter(el => {
          const text = el.textContent?.trim() || "";
          return /^[A-Z]{3}$/.test(text);
        });

        if (codeElements.length >= 2) {
          origin = getText(codeElements[0]);
          destination = getText(codeElements[1]);
        }
      }

      return { origin, destination };
    }
  `;
}
