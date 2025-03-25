import airportCodes from "airport-codes";

interface AirportResult {
  origin: string | null;
  destination: string | null;
}

export function extractAirports(flightElement: Element): AirportResult {
  let origin: string | null = null;
  let destination: string | null = null;

  // ----- ARIA Label Approach: Look for airport codes in detailed aria-labels -----
  const flightDetailsElements = Array.from(
    flightElement.querySelectorAll(
      "[aria-label*='airport'], [aria-label*='leaves'], [aria-label*='arrives']",
    ),
  );

  for (const element of flightDetailsElements) {
    const ariaLabel = element.getAttribute("aria-label") || "";
    const airportCodeMatches = ariaLabel.match(/\b([A-Z]{3})\b/g);

    if (airportCodeMatches && airportCodeMatches.length >= 2) {
      // Filter to only valid IATA codes using airport-codes package
      const validCodes = airportCodeMatches.filter((code) => {
        try {
          const airport = airportCodes.findWhere({ iata: code });
          return airport && airport.get("iata") === code;
        } catch {
          return false;
        }
      });

      if (validCodes.length >= 2) {
        [origin, destination] = validCodes;
        break;
      }
    }
  }

  // ----- DOM Structure Approach: Look for specific airport mentions -----
  if (!origin || !destination) {
    const airportMentionsElements = Array.from(
      flightElement.querySelectorAll("[aria-label*='International Airport']"),
    );

    for (const element of airportMentionsElements) {
      const ariaLabel = element.getAttribute("aria-label") || "";
      const airportMatches = ariaLabel.match(
        /([A-Za-z\s]+)(?:International Airport|Airport).*?\b([A-Z]{3})\b/g,
      );

      if (airportMatches) {
        const codes = airportMatches
          .map((match) => {
            const code = match.match(/\b([A-Z]{3})\b/)?.[1];
            if (code) {
              try {
                const airport = airportCodes.findWhere({ iata: code });
                return airport ? code : null;
              } catch {
                return null;
              }
            }
            return null;
          })
          .filter((code): code is string => code !== null);

        if (codes.length >= 2) {
          [origin, destination] = codes;
          break;
        }
      }
    }
  }

  // ----- Direct Text Content Approach -----
  if (!origin || !destination) {
    const codes = extractAllAirportCodes(flightElement).filter((code) => {
      try {
        const airport = airportCodes.findWhere({ iata: code });
        return airport && airport.get("iata") === code;
      } catch {
        return false;
      }
    });

    if (codes.length >= 2) {
      [origin, destination] = codes;
    }
  }

  // If still no valid airports found, look for city names and map to airports
  if (!origin || !destination) {
    const { origin: mappedOrigin, destination: mappedDestination } =
      findAirportsByCityNames(flightElement);
    if (mappedOrigin) origin = mappedOrigin;
    if (mappedDestination) destination = mappedDestination;
  }

  return { origin, destination };
}

// Helper function to extract all possible airport codes from the flight element
function extractAllAirportCodes(flightElement: Element): string[] {
  return Array.from(flightElement.querySelectorAll("div, span"))
    .map((el) => {
      const text = el.textContent?.trim() || "";
      const match = text.match(/^[A-Z]{3}$/);
      return match ? text : null;
    })
    .filter((code): code is string => code !== null);
}

// Helper function to find airports by city names
function findAirportsByCityNames(flightElement: Element): AirportResult {
  const text = flightElement.textContent || "";
  let origin: string | null = null;
  let destination: string | null = null;

  // Extract potential city names from the text
  const words = text.split(/[\s,.-]+/);
  const potentialCities = words.filter(
    (word) => word.length > 2 && /^[A-Z][a-z]+$/.test(word),
  );

  for (const city of potentialCities) {
    try {
      // Find all airports for this city
      const cityAirports = airportCodes.findAll({ city: city });

      if (cityAirports && cityAirports.length > 0) {
        // Sort airports by size/importance (using type as a proxy)
        const mainAirport = cityAirports.sort((a, b) => {
          const typeA = a.get("type") || "";
          const typeB = b.get("type") || "";
          // Prefer large_airport over medium_airport over small_airport
          return typeB.localeCompare(typeA);
        })[0];

        const code = mainAirport.get("iata");
        if (code) {
          if (!origin) {
            origin = code;
          } else if (!destination) {
            destination = code;
            break; // We have both airports, no need to continue
          }
        }
      }
    } catch {
      // Skip if airport lookup fails
      continue;
    }
  }

  return { origin, destination };
}
