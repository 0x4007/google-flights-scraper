import { addAirlineName } from "./add-airline-name";
import { getText } from "./get-text";
import { isNonAirlineText } from "./is-non-airline-text";

export function extractAirlineNames(flightElement: Element): string[] {
  const airlines: string[] = [];

  // Patterns that clearly indicate non-airlines (keeping only essential patterns)
  const NON_AIRLINE_PATTERNS = [
    /International Airport/i,
    /Airport/i,
    /\d{1,2}:\d{2}/,    // Time format
    /(\d{1,2}|[A-Za-z]+),\s+[A-Za-z]+\s+\d{1,2}/,  // Date formats (e.g., "Tue, Apr 1")
    /\d+ min/,
    /\d+ hr/
  ];

  // Method 1: Extract airlines from aria-labels that mention "operated by" or "with"
  const flightDetailsElements = Array.from(
    flightElement.querySelectorAll("[aria-label*='flight with'], [aria-label*='operated by']")
  );

  for (const element of flightDetailsElements) {
    const ariaLabel = element.getAttribute("aria-label") || "";

    // Extract airlines from "flight with X" or "operated by X" patterns
    const airlineMatches = [
      ...extractAirlineFromPattern(ariaLabel, /flight with ([^,.;]+?)(?=[,.;]|$)/i),
      ...extractAirlineFromPattern(ariaLabel, /operated by ([^,.;]+?)(?=[,.;]|$)/i)
    ];

    for (const airline of airlineMatches) {
      if (!isNonAirlineText(airline)) {
        addAirlineName(airlines, airline);
      }
    }
  }

  // Method 2: Check for specific airline logo images
  const airlineImages = Array.from(
    flightElement.querySelectorAll("img[alt*='Airlines'], img[alt*='Air']")
  );

  for (const img of airlineImages) {
    const altText = img.getAttribute("alt") || "";
    if (altText && !isNonAirlineText(altText)) {
      addAirlineName(airlines, altText);
    }
  }

  // Method 3: Extract airline information from the DOM structure
  // First, look for the elements that typically contain airline information
  // These are usually after time information in the flight card

  // Look for elements after time displays (which usually contain airline info)
  const timeElements = Array.from(
    flightElement.querySelectorAll("[aria-label*='Departure time'], [aria-label*='Arrival time']")
  );

  for (const timeEl of timeElements) {
    // Find the parent divs that might contain airline info
    let currentEl = timeEl.parentElement;
    while (currentEl && currentEl !== flightElement) {
      // Look for adjacent sibling elements that might contain airline info
      const siblingElements = currentEl.nextElementSibling;
      if (siblingElements) {
        const spans = siblingElements.querySelectorAll("span");
        for (const span of Array.from(spans)) {
          const text = getText(span);
          if (text && !isNonAirlineText(text)) {
            addAirlineName(airlines, text);
          }
        }
      }
      currentEl = currentEl.parentElement;
    }
  }

  // Broader search for potential airline elements in appropriate DOM positions
  const potentialAirlineElements = Array.from(
    flightElement.querySelectorAll("div > span, div > div > span, div[role='text']")
  );

  for (const el of potentialAirlineElements) {
    const text = getText(el);
    if (!text || text.length < 1) continue;

    // If text is not a non-airline pattern, consider it a potential airline name
    // This more permissive approach will catch airlines like "ITA"
    const isNotNonAirline = !NON_AIRLINE_PATTERNS.some(pattern => pattern.test(text));
    const isCommonAirlinePattern =
      /Airlines$/.test(text) ||
      /Airways$/.test(text) ||
      text.includes("Air");

    if ((isCommonAirlinePattern || text.length >= 2) && isNotNonAirline && !isNonAirlineText(text)) {
      addAirlineName(airlines, text);
    }
  }

  // Method 4: Extract from specific flight card structure based on DOM analysis
  // Look for the airline div that's specifically in the flight details section
  const flightDetailSections = Array.from(
    flightElement.querySelectorAll("div[aria-label*='Total duration']")
  );

  for (const section of flightDetailSections) {
    // The airline name is often in a sibling or nearby element
    const parentElement = section.parentElement;
    if (parentElement) {
      // Look through siblings for potential airline names
      const siblings = Array.from(parentElement.children);
      for (const sibling of siblings) {
        const airlineElements = sibling.querySelectorAll("span");
        for (const airlineEl of Array.from(airlineElements)) {
          const text = getText(airlineEl);
          if (text && !isNonAirlineText(text) && text.length >= 2) {
            addAirlineName(airlines, text);
          }
        }
      }
    }
  }

  // Remove any duplicates and non-airlines that might have slipped through
  return cleanAirlineList(airlines);
}

// Extract airline name from a text pattern (e.g., "flight with X Airlines")
function extractAirlineFromPattern(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let match;

  // Use exec with a loop to find all matches
  while ((match = pattern.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      matches.push(match[1].trim());
    }

    // Avoid infinite loops with zero-width matches
    if (match.index === pattern.lastIndex) {
      pattern.lastIndex++;
    }
  }

  return matches;
}

// Clean the airline list to remove spurious matches and duplicates
function cleanAirlineList(airlines: string[]): string[] {
  if (airlines.length === 0) return [];

  // Essential patterns to filter out non-airlines (minimized)
  const nonAirlinePatterns = [
    /International Airport/i,
    /Airport$/i,
    /\d{1,2}\/\d{1,2}/,  // Date patterns like 4/1
    /^[A-Z][a-z]{2},\s[A-Z][a-z]{2}/i,  // "Mon, Apr"
    /baggage/i,
    /connection/i,
    /transfer/i,
    /emissions/i
  ];

  // Filter out unwanted patterns and ensure uniqueness
  return airlines
    .filter(name => {
      // Skip empty or very short strings unless they're known airline codes
      if (!name || (name.length < 2 && !/^[A-Z]{3}$/.test(name))) return false;

      // Filter out obvious non-airlines
      return !nonAirlinePatterns.some(pattern => pattern.test(name)) && !isNonAirlineText(name);
    })
    // Ensure uniqueness while preserving order
    .filter((name, index, self) => self.indexOf(name) === index);
}
