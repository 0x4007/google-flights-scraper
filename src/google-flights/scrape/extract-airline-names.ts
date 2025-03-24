import { addAirlineName } from "./add-airline-name";
import { getText } from "./get-text";
import { isNonAirlineText } from "./is-non-airline-text";

export function extractAirlineNames(flightElement: Element): string[] {
  const airlines: string[] = [];

  // Known airline names for matching
  const KNOWN_AIRLINES = [
    "Korean Air", "Asiana Airlines", "Japan Airlines", "All Nippon Airways",
    "ANA", "JAL", "KAL", "KLM", "Delta", "United", "American"
  ];

  // Patterns that clearly indicate non-airlines
  const NON_AIRLINE_PATTERNS = [
    /International Airport/i,
    /Airport/i,
    /^[A-Z]{3}$/,       // 3-letter airport codes
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
      if (isValidAirlineName(airline)) {
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
    if (altText && isValidAirlineName(altText)) {
      addAirlineName(airlines, altText);
    }
  }

  // Method 3: Look for airline name text directly (common proper noun patterns)
  const potentialAirlineElements = Array.from(
    flightElement.querySelectorAll("div > span, div > div > span, div[role='text']")
  );

  for (const el of potentialAirlineElements) {
    const text = getText(el);
    if (!text || text.length < 2) continue;

    // Check if known airline or matches airline patterns
    const isKnownAirline = KNOWN_AIRLINES.some(airline =>
      text.includes(airline) ||
      airline.includes(text)
    );

    const matchesAirlinePattern =
      /Airlines$/.test(text) ||
      /Airways$/.test(text) ||
      (text.includes("Air") && /^[A-Z][a-z]/.test(text)) ||
      /^[A-Z][a-z]+ Air$/.test(text);

    // Check if it's not a common non-airline pattern
    const isNotNonAirline = !NON_AIRLINE_PATTERNS.some(pattern => pattern.test(text));

    if ((isKnownAirline || matchesAirlinePattern) && isNotNonAirline) {
      addAirlineName(airlines, text);
    }
  }

  // Remove any duplicates and non-airlines that might have slipped through
  return cleanAirlineList(airlines);
}

// Extract airline name from a text pattern (e.g., "flight with X Airlines")
function extractAirlineFromPattern(text: string, pattern: RegExp): string[] {
  const matches = [];
  let match;

  // Use exec with a loop to find all matches
  while ((match = pattern.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 1) {
      matches.push(match[1].trim());
    }

    // Avoid infinite loops with zero-width matches
    if (match.index === pattern.lastIndex) {
      pattern.lastIndex++;
    }
  }

  return matches;
}

// Validate if a text is a legitimate airline name
function isValidAirlineName(text: string): boolean {
  if (!text || text.length < 2) return false;

  // Exclude obvious non-airline text patterns
  if (isNonAirlineText(text)) return false;

  // Exclude airport and date patterns
  if (/International Airport/.test(text) ||
      /Airport/.test(text) ||
      /\d{1,2}\/\d{1,2}/.test(text) ||
      /[A-Z][a-z]{2},\s[A-Z][a-z]{2}/.test(text)) { // Matches date patterns like "Mon, Apr"
    return false;
  }

  // Match common airline name patterns
  return (
    /Airlines$/.test(text) ||
    /Airways$/.test(text) ||
    /^[A-Z][a-z]+ Air$/.test(text) ||
    /Korean Air/.test(text) ||
    /Asiana/.test(text) ||
    /Japan Airlines/.test(text) ||
    /All Nippon/.test(text) ||
    /ANA/.test(text) ||
    /JAL/.test(text) ||
    /Delta/.test(text) ||
    /United/.test(text) ||
    /American/.test(text)
  );
}

// Clean the airline list to remove spurious matches
function cleanAirlineList(airlines: string[]): string[] {
  if (airlines.length === 0) return [];

  // Known airport names to filter out
  const airportPatterns = [
    /International Airport/i,
    /^Incheon/i,
    /^Narita/i,
    /^Haneda/i,
    /^Gimpo/i,
    /Airport$/i
  ];

  // Date patterns to filter out
  const datePatterns = [
    /^[A-Z][a-z]{2},\s[A-Z][a-z]{2}/i,  // "Mon, Apr"
    /^[A-Z][a-z]{2}\s\d{1,2}$/i,        // "Apr 1"
    /^\d{1,2}\/\d{1,2}$/i                // "4/1"
  ];

  // Filter out unwanted patterns
  return airlines
    .filter(name => {
      // Filter out airport names
      const isAirport = airportPatterns.some(pattern => pattern.test(name));
      if (isAirport) return false;

      // Filter out dates
      const isDate = datePatterns.some(pattern => pattern.test(name));
      if (isDate) return false;

      return true;
    })
    // Ensure uniqueness
    .filter((name, index, self) => self.indexOf(name) === index);
}
