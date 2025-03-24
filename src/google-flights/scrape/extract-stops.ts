import { getText } from "./get-text";


export function extractStops(flightElement: Element): number {
  // First try with aria-label approach (traditional)
  const stopsElement = flightElement.querySelector(
    'span[aria-label="Nonstop flight."], span[aria-label$="stop flight."]'
  );
  if (stopsElement) {
    const stopsText = stopsElement.getAttribute("aria-label") ?? null;
    if (stopsText) {
      if (stopsText.includes("Nonstop")) return 0;

      // Extract number from "X stop flight"
      const parts = stopsText.split(" ");
      for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i + 1] === "stop" || parts[i + 1] === "stops") {
          const numStops = parseInt(parts[i], 10);
          if (!isNaN(numStops)) {
            return numStops;
          }
        }
      }
    }
  }

  // Fallback: search for text patterns like "Nonstop" or "1 stop" in div elements
  const divElements = Array.from(flightElement.querySelectorAll("div"));

  // First check for "Nonstop"
  const nonstopDiv = divElements.find(
    (div) => getText(div)?.trim() === "Nonstop"
  );
  if (nonstopDiv) return 0;

  // Then check for "X stop(s)" pattern
  for (const div of divElements) {
    const text = getText(div);
    if (!text) continue;

    // Check for "1 stop", "2 stops", etc.
    if (/^\d+\s+stop(s)?$/.test(text)) {
      const numStops = parseInt(text.match(/\d+/)?.[0] || "-1", 10);
      if (!isNaN(numStops)) {
        return numStops;
      }
    }

    // Also check for "1 stop in XXX" format
    if (/^\d+\s+stop\s+in\s+[A-Z]{3}$/.test(text)) {
      const numStops = parseInt(text.match(/\d+/)?.[0] || "-1", 10);
      if (!isNaN(numStops)) {
        return numStops;
      }
    }
  }

  return -1;
}
