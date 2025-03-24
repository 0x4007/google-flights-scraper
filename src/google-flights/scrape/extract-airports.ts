import { getText } from "./get-text";

export function extractAirports(flightElement: Element): {
  origin: string | null;
  destination: string | null;
} {
  let origin = null;
  let destination = null;

  // ----- ARIA Label Approach: Look for airport codes in detailed aria-labels -----
  // This is often the most reliable way as it contains the full flight details
  const flightDetailsElements = Array.from(
    flightElement.querySelectorAll("[aria-label*='airport'], [aria-label*='leaves'], [aria-label*='arrives']")
  );

  for (const element of flightDetailsElements) {
    const ariaLabel = element.getAttribute("aria-label") || "";

    // Look for patterns like "leaves [Airport Name] Airport" or "arrives at [Airport]"
    // Airport codes are typically mentioned alongside airport names
    const airportCodeMatches = ariaLabel.match(/\b([A-Z]{3})\b/g);

    if (airportCodeMatches && airportCodeMatches.length >= 2) {
      // The first distinct pair is typically origin → destination
      for (let i = 0; i < airportCodeMatches.length - 1; i++) {
        for (let j = i + 1; j < airportCodeMatches.length; j++) {
          if (airportCodeMatches[i] !== airportCodeMatches[j]) {
            origin = airportCodeMatches[i];
            destination = airportCodeMatches[j];
            break;
          }
        }
        if (origin && destination) break;
      }

      if (origin && destination) break;
    }
  }

  // ----- DOM Structure Approach: Look at specific elements in the DOM -----
  if (!origin || !destination) {
    // Find elements that contain airport codes by their position in the DOM
    // Airport codes are often near duration information
    const durationElements = Array.from(
      flightElement.querySelectorAll("[aria-label*='duration'], div:nth-child(2) > div")
    );

    for (const durElement of durationElements) {
      // Get airport containers near duration info
      const container = durElement.parentElement;
      if (!container) continue;

      // Look for 3-letter codes in the same container
      const possibleAirportElements = Array.from(
        container.querySelectorAll("div, span")
      ).filter(el => {
        const text = el.textContent?.trim() || "";
        return /^[A-Z]{3}$/.test(text);
      });

      // Airport codes are typically paired together in the DOM
      if (possibleAirportElements.length >= 2) {
        // Differentiate between airline codes and airport codes by context
        const airportElements = possibleAirportElements.filter(el => {
          // Check if it's in an airport context
          const parent = el.parentElement;
          if (!parent) return true;

          const parentText = parent.textContent || "";
          const siblingText = Array.from(parent.children)
            .filter(child => child !== el)
            .map(child => child.textContent || "")
            .join(" ");

          // Airlines typically appear with "operated by" or "Airlines"
          const airlineContextWords = ["operated", "Airlines", "Airline", "flight"];
          const isInAirlineContext = airlineContextWords.some(word =>
            parentText.includes(word) || siblingText.includes(word)
          );

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

  // ----- Last Resort Approach: Try from attributes -----
  if (!origin || !destination) {
    // Look for elements with data attributes or other hints
    const elements = Array.from(flightElement.querySelectorAll("*[data-code], *[data-airport]"));

    const airportCodes = elements
      .map(el => el.getAttribute("data-code") || el.getAttribute("data-airport"))
      .filter(code => code && /^[A-Z]{3}$/.test(code)) as string[];

    if (airportCodes.length >= 2) {
      origin = airportCodes[0];
      destination = airportCodes[1];
    }
  }

  return { origin, destination };
}
