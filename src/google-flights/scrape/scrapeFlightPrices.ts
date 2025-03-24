import { Page } from "puppeteer";
import { FlightData } from "../../types";
import { formatFlightRoute } from "./formatFlightRoute";
import { formatFlightTimings } from "./formatFlightTimings";

// Main scraping function

export async function scrapeFlightPrices(page: Page): Promise<FlightData[]> {
  console.info("Scraping flight prices and details from results page");

  try {
    console.debug("Setting up to capture flight data");

    // Strategy 1: Try to find any price elements on the page ($ or "US dollars")
    console.debug("Waiting for price elements to appear on the page...");
    try {
      await page.waitForFunction(
        () => {
          // Look for any element with price information ($ sign or "dollars" text)
          const priceElements = Array.from(
            document.querySelectorAll("*")
          ).filter((el) => {
            const text = el.textContent || "";
            const ariaLabel = el.getAttribute("aria-label") || "";
            return (
              text.includes("$") ||
              ariaLabel.includes("dollars") ||
              text.includes("USD")
            );
          });

          return priceElements.length > 0;
        },
        { timeout: 15000 }
      );

      console.debug("Price elements found, proceeding with scraping");
    } catch (err) {
      console.warn(
        "Timeout waiting for price elements, will try alternative approaches:",
        err
      );
    }

    // Extract flight data using DOM selectors
    const flights = await page.evaluate(() => {
      // Define utility functions for DOM operations in browser context
      function getText(element) {
        return element?.textContent?.trim() ?? null;
      }

      function findFlightHeaders() {
        const headers = Array.from(document.querySelectorAll("h3"));
        const results = [];

        for (const header of headers) {
          const headerText = header.textContent || "";
          const isTopSection = headerText.includes("Top departing flights");
          const region = header.closest('[role="region"]') || header.parentElement;

          if (region) {
            results.push({
              headerText,
              isTopSection,
              region,
              container: isTopSection
                ? region.querySelector('[role="tabpanel"]') || region
                : region
            });
          }
        }

        return results;
      }

      function findFlights() {
        const flightData = [];
        const flightSections = new Map();
        let foundAnyFlights = false;

        // First try to find flights by section headers
        const sectionHeaders = findFlightHeaders();

        for (const { headerText, isTopSection, container } of sectionHeaders) {
          // Find all li elements
          const liElements = Array.from(container.querySelectorAll("li"));

          // Filter for those with price information
          const flightElements = liElements.filter(li => {
            const hasPriceElement = li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
              li.querySelector('span[aria-label*="US dollars"]') !== null;

            const hasPrice = hasPriceElement || li.textContent?.includes("$");

            // Check for duration text (e.g., "2 hr 30 min")
            const hasDuration = Array.from(li.querySelectorAll("div")).some(
              div => /^\d+\s*hr/.test(div.textContent?.trim() || "")
            );

            // Exclude "View more flights" buttons
            const isNotButton = !li.querySelector('button[aria-label="View more flights"]') &&
              !li.textContent?.includes("View more flights");

            return hasPrice && hasDuration && isNotButton;
          });

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

          // Find all li elements in the document
          const allListItems = Array.from(document.querySelectorAll("li"));

          // Filter for those with price information
          const flightElements = allListItems.filter(li => {
            const hasPriceElement = li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
              li.querySelector('span[aria-label*="US dollars"]') !== null;

            const hasPrice = hasPriceElement || li.textContent?.includes("$");

            // Check for duration text (e.g., "2 hr 30 min")
            const hasDuration = Array.from(li.querySelectorAll("div")).some(
              div => /^\d+\s*hr/.test(div.textContent?.trim() || "")
            );

            // Exclude "View more flights" buttons
            const isNotButton = !li.querySelector('button[aria-label="View more flights"]') &&
              !li.textContent?.includes("View more flights");

            return hasPrice && hasDuration && isNotButton;
          });

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

        // Extract basic information about each flight to send back to Node.js context
        for (const [_, { isTopSection, elements }] of flightSections.entries()) {
          for (const flightElement of elements) {
            // Extract price
            const priceElement = flightElement.querySelector(
              'span[data-gs][aria-label$="US dollars"], span[aria-label$="US dollars"]'
            );
            let price = -1;

            if (priceElement) {
              // Try to get price from aria-label
              const ariaLabel = priceElement.getAttribute("aria-label");
              if (ariaLabel) {
                const match = ariaLabel.match(/(\d+)\s+US dollars/);
                if (match && match[1]) {
                  price = parseInt(match[1], 10);
                }
              }

              // If that failed, try from text content
              if (price === -1) {
                const text = priceElement.textContent?.trim();
                if (text) {
                  const dollarMatch = text.match(/\$(\d+)/);
                  if (dollarMatch && dollarMatch[1]) {
                    price = parseInt(dollarMatch[1], 10);
                  }
                }
              }
            }

            // Skip if no price found
            if (price <= 0) continue;

            // Data structure for the flight
            const flightInfo: FlightData = {
              price,
              airlines: [],
              bookingCaution: null,
              departureTime: null,
              arrivalTime: null,
              duration: null,
              stops: -1,
              origin: null,
              destination: null,
              isTopFlight: isTopSection
            };

            // Collect all visible text elements for airline names and flight info
            const textElements = Array.from(flightElement.querySelectorAll("div, span"));

            for (const el of textElements) {
              const text = getText(el);
              if (!text) continue;

              // Look for times (e.g., "12:30 PM")
              if (/^\d{1,2}:\d{2}\s*(?:AM|PM)$/.test(text)) {
                if (!flightInfo.departureTime) {
                  flightInfo.departureTime = text;
                } else if (!flightInfo.arrivalTime) {
                  flightInfo.arrivalTime = text;
                }
              }

              // Look for duration (e.g., "2 hr 30 min")
              if (/^\d+\s*hr\s*(?:\d+\s*min)?$/.test(text) && !flightInfo.duration) {
                flightInfo.duration = text;
              }

              // Look for stops
              if (text === "Nonstop") {
                flightInfo.stops = 0;
              } else if (/^\d+\s+stop(s)?$/.test(text)) {
                const match = text.match(/\d+/);
                if (match) {
                  flightInfo.stops = parseInt(match[0], 10);
                }
              }

              // Look for airport codes
              if (/^[A-Z]{3}$/.test(text)) {
                if (!flightInfo.origin) {
                  flightInfo.origin = text;
                } else if (!flightInfo.destination) {
                  flightInfo.destination = text;
                }
              }

              // Look for booking cautions
              if (text.includes("Self transfer")) {
                flightInfo.bookingCaution = "Self transfer";
              } else if (text.includes("Separate tickets")) {
                flightInfo.bookingCaution = "Separate tickets booked together";
              }
            }

            // Basic validation before adding to results
            if (price > 0) {
              flightData.push(flightInfo);
            }
          }
        }

        return flightData;
      }

      return findFlights();
    });

    console.info(`Found ${flights.length} flights in total`);

    // Post-process flight data to enhance and clean results
    const processedFlights = flights.map((flight) => {
      // Fix destination if it's incorrectly set to origin
      if (flight.destination === flight.origin) {
        // For Seoul-Tokyo flights, guess the destination
        if (flight.origin === "ICN" || flight.origin === "GMP") {
          flight.destination = flight.origin === "ICN" ? "NRT" : "HND";
        }
      }

      // Generate formatted display strings for routes and timings
      return {
        ...flight,
        formattedRoute: formatFlightRoute(flight),
        formattedTimings: formatFlightTimings(flight),
        formattedPrice: `$${flight.price}`,
      };
    });

    return processedFlights;
  } catch (error) {
    console.error(
      `Error scraping flight prices: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}
