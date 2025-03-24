// @ts-nocheck - Browser context code contains many implicit any types that we can't easily fix



import { Page } from "puppeteer";
import { FlightData } from "../../types";
import { captureDOMStructure } from "../../utils/capture-dom";
import { registerPageFunctions } from "./browser-function-utils";
import { findPriceElements } from "./findPriceElements";
import { formatFlightRoute } from "./format-flight-route";
import { formatFlightTimings } from "./format-flight-timings";

/**
 * Main function to scrape flight prices and details from the Google Flights results page.
 * This uses modular browser functions that are injected into the page context.
 */
export async function scrapeFlightPrices(page: Page): Promise<FlightData[]> {
  console.info("Scraping flight prices and details from results page");

  try {
    // Register helper functions in the page context
    await registerPageFunctions(page);

    console.debug("Setting up to capture flight data");

    // Strategy 1: Wait for price elements to appear on the page ($ or "US dollars")
    console.debug("Waiting for price elements to appear on the page...");
    try {
      await page.waitForFunction(
        findPriceElements(),
        { timeout: 15000 }
      );

      console.debug("Price elements found, proceeding with scraping");
      // Capture DOM structure specifically focused on price elements
      await captureDOMStructure(page, "price-elements-found");
    } catch (err) {
      console.warn(
        "Timeout waiting for price elements, will try alternative approaches:",
        err
      );
    }

    // Capture the structure of the flights container before extraction
    console.debug("Capturing flight container structure before detailed extraction");
    await captureDOMStructure(page, "flight-container-before-extraction");

    // Extract flight data directly with a single evaluate call
    // This ensures all the code runs in one context without any cross-context function calls
    const flights = await page.evaluate((): FlightData[] => {
      try {
        const flightData = [];
        const flightSections = new Map();
        let foundAnyFlights = false;

        // Find flight elements within a container
        function findFlightElements(container) {
          return Array.from(container.querySelectorAll("li")).filter(li => {
            const hasPriceElement =
              li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
              li.querySelector('span[aria-label*="US dollars"]') !== null ||
              li.textContent?.includes("$");

            const hasDuration = Array.from(li.querySelectorAll("div")).some(
              div => /^\d+\s*hr/.test(div.textContent?.trim() || "")
            );

            const isNotButton =
              !li.querySelector('button[aria-label*="more flights"]') &&
              !li.textContent?.includes("View more flights");

            return hasPriceElement && hasDuration && isNotButton;
          });
        }

        // Utility function to get text content
        function getText(element) {
          return element?.textContent?.trim() || null;
        }

        // Check if text is non-airline information
        function isNonAirlineText(text) {
          if (!text) return true;

          // Clean up the text first
          const cleanText = text.trim();
          if (cleanText.length < 2) return true;

          // Check for date patterns (like "Tue, Apr 1")
          if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/.test(cleanText)) {
            return true;
          }

          // Check for airport names and keywords
          if (
            cleanText.includes("International Airport") ||
            cleanText.includes("Airport") ||
            cleanText.includes("Terminal") ||
            cleanText.includes("Nonstop") ||
            cleanText.includes("stop") ||
            cleanText.includes("hr") ||
            cleanText.includes("min") ||
            cleanText.includes("Self transfer") ||
            cleanText.includes("Separate tickets") ||
            cleanText.includes("multiple airlines") ||
            cleanText.includes("Missed connections") ||
            cleanText.includes("Price unavailable") ||
            cleanText.includes("Departure") ||
            cleanText.includes("Unknown emissions") ||
            /\d{1,2}:\d{2}/.test(cleanText) || // Skip times
            /^\d{1,2}/.test(cleanText) ||     // Skip numbers
            /^[A-Z]{3}$/.test(cleanText) ||  // Airport codes often have 3 capital letters
            cleanText.includes("+") ||
            cleanText.includes("%")
          ) {
            return true;
          }

          return false;
        }

        // Add airline name to array avoiding duplicates
        function addAirlineName(airlines, name) {
          if (name && !isNonAirlineText(name) && !airlines.includes(name)) {
            airlines.push(name);
          }
        }

        // Extract airline names from a flight element
        function extractAirlineNames(flightElement) {
          const airlines = [];

          // Most reliable method: Find airline logo images
          const airlineImages = flightElement.querySelectorAll('img[alt*="Airlines"], img[alt*="Air"]');

          for (const img of Array.from(airlineImages)) {
            const altText = img.getAttribute("alt") || "";
            if (altText && !isNonAirlineText(altText)) {
              addAirlineName(airlines, altText.trim());
            }
          }

          // If we found airlines from logos, return them
          if (airlines.length > 0) {
            return airlines;
          }

          // Fallback method: Look for airline text in aria-labels
          const elementsWithAriaLabel = flightElement.querySelectorAll('[aria-label*="Airlines"], [aria-label*="flight with"], [aria-label*="operated by"]');

          for (const el of Array.from(elementsWithAriaLabel)) {
            const ariaLabel = el.getAttribute("aria-label") || "";

            // Common patterns in aria-labels
            const patterns = [
              /flight with ([^,.]+?)(?:\.|and|,|$)/i,
              /operated by ([^,.]+?)(?:\.|and|,|$)/i,
              /([^,.]+? Airlines)(?:\.|and|,|$)/i
            ];

            for (const pattern of patterns) {
              const match = ariaLabel.match(pattern);
              if (match && match[1] && !isNonAirlineText(match[1])) {
                addAirlineName(airlines, match[1].trim());
              }
            }
          }

          // Last resort: Check for text nodes that might contain airline names
          if (airlines.length === 0) {
            const potentialAirlineTexts = Array.from(flightElement.querySelectorAll('div > span:not([aria-label])'))
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 2 && !isNonAirlineText(text));

            for (const text of potentialAirlineTexts) {
              if (text && (text.includes("Airlines") || text.includes("Air "))) {
                addAirlineName(airlines, text);
              }
            }
          }

          return airlines;
        }

        // Extract booking caution information
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

        // Extract departure and arrival times
        function extractTimes(flightElement) {
          let departureTime = null;
          let arrivalTime = null;

          // Look for elements with time patterns (12:30 PM)
          const timeElements = Array.from(flightElement.querySelectorAll("div, span"))
            .filter(el => /^\d{1,2}:\d{2}\s*(?:AM|PM)$/.test(el.textContent?.trim() || ""))
            .map(el => el.textContent?.trim() || "");

          if (timeElements.length >= 2) {
            departureTime = timeElements[0];
            arrivalTime = timeElements[1];
          } else if (timeElements.length === 1) {
            departureTime = timeElements[0];
          }

          return { departureTime, arrivalTime };
        }

        // Extract flight duration
        function extractDuration(flightElement) {
          // Look for duration pattern (e.g., "2 hr 30 min")
          for (const el of Array.from(flightElement.querySelectorAll("div, span"))) {
            const text = el.textContent?.trim() || "";
            if (/^\d+\s*hr(\s*\d+\s*min)?$/.test(text)) {
              return text;
            }
          }

          return null;
        }

        // Extract number of stops
        function extractStops(flightElement) {
          for (const el of Array.from(flightElement.querySelectorAll("div, span"))) {
            const text = el.textContent?.trim() || "";

            if (text === "Nonstop") {
              return 0;
            }

            const stopsMatch = text.match(/^(\d+)\s+stop/);
            if (stopsMatch && stopsMatch[1]) {
              return parseInt(stopsMatch[1], 10);
            }
          }

          return -1; // Unknown number of stops
        }

        // Extract origin and destination airports
        function extractAirports(flightElement) {
          let origin = null;
          let destination = null;

          // Known airline codes to filter out (to prevent confusion with airport codes)
          const airlineCodes = ["JAL", "ANA", "KAL", "AAL", "DAL"];

          // Method 1: Try to find codes in aria-labels (most reliable)
          const flightDetailsElements = Array.from(
            flightElement.querySelectorAll("[aria-label*='airport'], [aria-label*='leaves'], [aria-label*='arrives']")
          );

          for (const element of flightDetailsElements) {
            const ariaLabel = element.getAttribute("aria-label") || "";
            // Look for specific patterns like "leaves ICN airport" or "arrives at NRT"
            const leavePattern = /leaves\s+([A-Z]{3})\s+airport/i;
            const arrivePattern = /arrives\s+at\s+([A-Z]{3})/i;

            const leaveMatch = ariaLabel.match(leavePattern);
            const arriveMatch = ariaLabel.match(arrivePattern);

            if (leaveMatch && leaveMatch[1]) {
              origin = leaveMatch[1];
            }

            if (arriveMatch && arriveMatch[1]) {
              destination = arriveMatch[1];
            }

            // If both found, we're done
            if (origin && destination) break;

            // Fallback to general airport code extraction
            if (!origin || !destination) {
              const airportCodes = ariaLabel.match(/\b([A-Z]{3})\b/g);

              if (airportCodes && airportCodes.length >= 2) {
                // Filter out airline codes
                const filteredCodes = airportCodes.filter(code => !airlineCodes.includes(code));

                if (filteredCodes.length >= 2) {
                  origin = filteredCodes[0];
                  destination = filteredCodes[1];
                  break;
                }
              }
            }
          }

          // Method 2: Look for elements with single airport codes in sequence
          if (!origin || !destination) {
            const codeElements = Array.from(
              flightElement.querySelectorAll("div, span")
            ).filter(el => {
              const text = el.textContent?.trim() || "";
              return /^[A-Z]{3}$/.test(text) && !airlineCodes.includes(text);
            });

            // First and last airport codes in the sequence (to handle connections)
            if (codeElements.length >= 2) {
              origin = getText(codeElements[0]);
              destination = getText(codeElements[codeElements.length - 1]);
            }
          }

          // Validate: ensure origin and destination are valid airport codes
          // and they're not the same airport (which would be invalid)
          if (origin && destination) {
            // Make sure they're actually airport codes and not airline codes
            if (airlineCodes.includes(origin)) origin = null;
            if (airlineCodes.includes(destination)) destination = null;

            // Ensure origin and destination are different
            if (origin && destination && origin === destination) {
              // This indicates a likely extraction error
              // Use other airport codes if available
              const allAirportCodes = Array.from(
                flightElement.querySelectorAll("div, span")
              )
                .map(el => el.textContent?.trim())
                .filter(text => text && /^[A-Z]{3}$/.test(text) && !airlineCodes.includes(text));

              // If we have multiple distinct codes, use the first and last
              const uniqueCodes = [...new Set(allAirportCodes)];
              if (uniqueCodes.length >= 2) {
                origin = uniqueCodes[0];
                destination = uniqueCodes[uniqueCodes.length - 1];
              }
            }
          }

          return { origin, destination };
        }

        // Extract details from a flight element
        function extractFlightDetails(flightElement) {
          // Skip "View more flights" button if present
          if (flightElement.querySelector('button[aria-label*="View more flights"]')) {
            return null;
          }

          // Extract price
          const priceElement = flightElement.querySelector(
            'span[data-gs][aria-label*="US dollars"], span[aria-label*="US dollars"]'
          );

          let price = 0;
          if (priceElement) {
            // Try to get price from aria-label first
            const ariaLabel = priceElement.getAttribute("aria-label") || "";
            const priceMatch = ariaLabel.match(/(\d+)\s+US dollars/);
            if (priceMatch && priceMatch[1]) {
              price = parseInt(priceMatch[1], 10);
            } else {
              // Try from text content
              const text = priceElement.textContent?.trim() || "";
              const dollarMatch = text.match(/\$(\d+)/);
              if (dollarMatch && dollarMatch[1]) {
                price = parseInt(dollarMatch[1], 10);
              }
            }
          }

          // Skip if no price found
          if (price <= 0) return null;

          // -------- Extract Airlines --------
          const airlines = extractAirlineNames(flightElement);

          // -------- Extract Booking Caution --------
          const bookingCaution = extractBookingCaution(flightElement);

          // -------- Extract Times --------
          const { departureTime, arrivalTime } = extractTimes(flightElement);

          // -------- Extract Duration --------
          const duration = extractDuration(flightElement);

          // -------- Extract Stops --------
          const stops = extractStops(flightElement);

          // -------- Extract Airport Codes --------
          const { origin, destination } = extractAirports(flightElement);

          return {
            price,
            airlines,
            bookingCaution,
            departureTime,
            arrivalTime,
            duration,
            stops,
            origin,
            destination,
            isTopFlight: false // Will be set by the caller
          };
        }

        // Try to find flights by section headers first (Best flights, Cheapest, etc.)
        const headers = Array.from(document.querySelectorAll("h3"));

        for (const header of headers) {
          const headerText = header.textContent || "";
          const isTopSection = headerText.includes("Top departing flights") ||
                             headerText.includes("Best departing flights");

          const region = header.closest('[role="region"]') || header.parentElement;

          if (!region) continue;

          const container = isTopSection
            ? region.querySelector('[role="tabpanel"]') || region
            : region;

          // Find all flight list items in this container
          const flightElements = findFlightElements(container);

          if (flightElements.length > 0) {
            flightSections.set(container, {
              isTopSection,
              elements: flightElements,
            });
            foundAnyFlights = true;
            console.debug(
              `Found ${flightElements.length} flights near header "${headerText}" (isTop: ${isTopSection})`
            );
          }
        }

        // If no flights found by headers, try a more general approach
        if (!foundAnyFlights) {
          console.debug("No flights found by headers, trying direct search");
          const flightElements = findFlightElements(document.body);

          if (flightElements.length > 0) {
            flightSections.set(document.body, {
              isTopSection: false, // Can't determine if they're top flights
              elements: flightElements,
            });
            console.debug(
              `Found ${flightElements.length} flights using direct page search`
            );
          }
        }

        // Extra debug info
        console.debug(
          `Total flight sections found: ${flightSections.size}`,
          Array.from(flightSections.entries()).map(
            ([el, { isTopSection, elements }]) => ({
              role: el.getAttribute("role"),
              isTop: isTopSection,
              count: elements.length,
            })
          )
        );

        // Process each flight using the extraction functions
        for (const [_, { isTopSection, elements }] of flightSections.entries()) {
          for (const flightElement of elements) {
            try {
              // Extract all details from the flight element
              const flightDetails = extractFlightDetails(flightElement);

              if (flightDetails) {
                // Mark whether this is a top flight or not
                flightDetails.isTopFlight = isTopSection;
                flightData.push(flightDetails);
              }
            } catch (error) {
              console.warn("Error extracting flight details:", error);
            }
          }
        }

        return flightData;
      } catch (error) {
        console.error("Error in flight data extraction:", error);
        return [];
      }
    });

    // Capture DOM specific to airline information
    console.debug("Capturing airline element details");
    await captureDOMStructure(page, "after-flight-extraction");

    console.info(`Found ${flights.length} flights in total`);

    // Helper function to check if a string is an airport name or date
    function isAirportOrDate(text: string): boolean {
      if (!text) return true;

      // Check for date patterns
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/.test(text)) {
        return true;
      }

      // Check for airport names
      if (
        text.includes("International Airport") ||
        text.includes("Airport") ||
        text.includes("Terminal") ||
        /^[A-Z]{3}$/.test(text) // Airport codes
      ) {
        return true;
      }

      return false;
    }

    // Function to remove duplicate flights based on key properties
    function deduplicateFlights(flights: FlightData[]): FlightData[] {
      // Create a map to track seen flights based on key identifiers
      const seen = new Map();
      const uniqueFlights: FlightData[] = [];

      for (const flight of flights) {
        // Create a unique key based on important flight properties
        const key = `${flight.price}-${flight.origin}-${flight.destination}-${flight.departureTime}-${flight.arrivalTime}-${flight.duration}`;

        // If we haven't seen this flight before, add it to our result
        if (!seen.has(key)) {
          seen.set(key, true);
          uniqueFlights.push(flight);
        }
      }

      return uniqueFlights;
    }

    // Post-process flight data to enhance and clean results
    let processedFlights = flights.map((flight) => {
      // Clean up airlines array to ensure it only contains actual airlines
      const cleanedAirlines = Array.isArray(flight.airlines)
        ? flight.airlines.filter(airline => airline && !isAirportOrDate(airline))
        : [];

      // Generate formatted display strings for routes and timings
      return {
        ...flight,
        airlines: cleanedAirlines,
        formattedRoute: formatFlightRoute({...flight, airlines: cleanedAirlines}),
        formattedTimings: formatFlightTimings(flight),
        formattedPrice: `$${flight.price}`,
      };
    });

    // Remove duplicate flights by comparing key properties
    processedFlights = deduplicateFlights(processedFlights);

    console.info(`Found ${processedFlights.length} unique flights after deduplication`);
    return processedFlights;
  } catch (error) {
    console.error(
      `Error scraping flight prices: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}
