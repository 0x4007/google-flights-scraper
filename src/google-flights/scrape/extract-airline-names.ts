import { addAirlineName } from "./add-airline-name";
import { getText } from "./get-text";
import { isNonAirlineText } from "./is-non-airline-text";

export function extractAirlineNames(flightElement: Element): string[] {
  const airlineNames: string[] = [];

  // Method 1: Extract from ARIA labels that typically contain full flight details
  const flightInfoElements = Array.from(
    flightElement.querySelectorAll("[aria-label*='flight'], [aria-label*='Airlines'], [aria-label*='operated by']")
  );

  for (const element of flightInfoElements) {
    const ariaLabel = element.getAttribute("aria-label") || "";

    // Common patterns for airline mentions in aria-labels
    extractAirlinesFromText(ariaLabel, airlineNames);
  }

  // Method 2: Look for airline logo images with alt text
  const airlineImages = Array.from(
    flightElement.querySelectorAll("img[alt*='Airlines'], img[alt*='Air'], img[alt*='Airways']")
  );

  for (const img of airlineImages) {
    const altText = img.getAttribute("alt");
    if (altText && !isNonAirlineText(altText)) {
      addAirlineName(airlineNames, altText.trim());
    }
  }

  // Method 3: Look for specific div/span patterns that typically contain airline names
  // These are typically short text fragments with airline names
  const potentialAirlineElements = [
    // Specific selectors based on common Google Flights DOM patterns
    ...Array.from(flightElement.querySelectorAll("div > span:not([aria-label])")),
    ...Array.from(flightElement.querySelectorAll("div > div > span:not([aria-label])")),
    // Add more common patterns here as needed
  ];

  for (const el of potentialAirlineElements) {
    const text = getText(el);
    if (!text || isNonAirlineText(text)) continue;

    // Check for common airline name patterns
    const isLikelyAirlineName =
      text.includes("Airlines") ||
      text.includes("Airways") ||
      text.includes("Air ") ||
      /^[A-Z][a-z]/.test(text) || // Proper noun pattern (e.g., "Delta", "United")
      /^[A-Z]{2}$/.test(text);    // Two-letter airline code

    if (isLikelyAirlineName) {
      addAirlineName(airlineNames, text.trim());
    }
  }

  // Method 4: Check for operated by/codeshare patterns
  const operatedByElements = Array.from(
    flightElement.querySelectorAll("*")
  ).filter(el => {
    const text = el.textContent || "";
    return text.includes("operated by") || text.includes("Operated by");
  });

  for (const el of operatedByElements) {
    const text = el.textContent || "";
    const match = text.match(/operated by\s+([^,;.]+)/i);
    if (match && match[1]) {
      addAirlineName(airlineNames, match[1].trim());
    }
  }

  return airlineNames;
}

// Helper to extract airline names from aria-label text
function extractAirlinesFromText(text: string, airlineNames: string[]): void {
  // Common patterns for airlines in aria labels

  // Pattern 1: "flight with [Airline Name]"
  const flightWithMatches = text.match(/flight with ([^,.]+?)(?:\.|\sand|,|$)/i);
  if (flightWithMatches && flightWithMatches[1]) {
    addAirlineName(airlineNames, flightWithMatches[1].trim());
  }

  // Pattern 2: "operated by [Airline Name]"
  const operatedByMatches = text.match(/operated by ([^,.]+?)(?:\.|\sand|,|$)/i);
  if (operatedByMatches && operatedByMatches[1]) {
    addAirlineName(airlineNames, operatedByMatches[1].trim());
  }

  // Pattern 3: Look for known airline name patterns
  const airlinePatterns = [
    /\b([A-Z][a-z]+ Airlines)\b/,
    /\b([A-Z][a-z]+ Airways)\b/,
    /\b(Air [A-Z][a-z]+)\b/
  ];

  for (const pattern of airlinePatterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      addAirlineName(airlineNames, matches[1].trim());
    }
  }
}
