import { Page } from "puppeteer";

/**
 * Registers all necessary page functions by directly injecting them into the browser context.
 * This approach avoids any potential issues with function conversion and ensures
 * all functions are available with the exact names and implementations needed.
 */
export async function registerPageFunctions(page: Page): Promise<void> {
  // Inject all functions directly as a single script
  await page.evaluateOnNewDocument(`
    // Utility function to get text from an element
    function getText(element) {
      return element?.textContent?.trim() || null;
    }

    // Check if text is non-airline information
    function isNonAirlineText(text) {
      return (
        text.includes("Nonstop") ||
        text.includes("stop") ||
        text.includes("hr") ||
        text.includes("min") ||
        text.includes("Self transfer") ||
        text.includes("Separate tickets") ||
        text.includes("multiple airlines") ||
        text.includes("Missed connections") ||
        text.includes("Price unavailable") ||
        text.includes("Departure") ||
        text.includes("Unknown emissions") ||
        /\\d{1,2}:\\d{2}/.test(text) || // Skip times
        /^\\d{1,2}/.test(text) ||     // Skip numbers
        /[A-Z]{3}/.test(text) ||  // Airport codes often have 3 capital letters
        text.length < 2 ||         // Skip very short text
        text.includes("+") ||
        text.includes("%")
      );
    }

    // Add airline name to array avoiding duplicates
    function addAirlineName(airlines, name) {
      if (name && !isNonAirlineText(name) && !airlines.includes(name)) {
        airlines.push(name);
      }
    }

    // Find flight elements within a container
    function findFlightElements(container) {
      return Array.from(container.querySelectorAll("li")).filter(li => {
        const hasPriceElement =
          li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
          li.querySelector('span[aria-label*="US dollars"]') !== null ||
          li.textContent?.includes("$");

        const hasDuration = Array.from(li.querySelectorAll("div")).some(
          div => /^\\d+\\s*hr/.test(div.textContent?.trim() || "")
        );

        const isNotButton =
          !li.querySelector('button[aria-label*="more flights"]') &&
          !li.textContent?.includes("View more flights");

        return hasPriceElement && hasDuration && isNotButton;
      });
    }

    // Extract airline names from a flight element
    function extractAirlineNames(flightElement) {
      const airlines = [];

      // Method 1: Look for airline logos and text
      const airlineElements = flightElement.querySelectorAll(
        'img[alt*="Airlines"], img[alt*="Air"], ' +
        'div > span:not([aria-label]), div > div > span:not([aria-label])'
      );

      for (const el of Array.from(airlineElements)) {
        let text = "";

        // Check for image alt text first
        if (el.tagName === "IMG") {
          text = el.getAttribute("alt") || "";
        } else {
          text = el.textContent?.trim() || "";
        }

        // Skip non-airline text
        if (!text || isNonAirlineText(text)) continue;

        // Clean and add the airline name
        addAirlineName(airlines, text.trim());
      }

      // Method 2: Check aria-labels for airline information
      const elementsWithAriaLabel = flightElement.querySelectorAll('[aria-label*="Airlines"], [aria-label*="flight with"]');

      for (const el of Array.from(elementsWithAriaLabel)) {
        const ariaLabel = el.getAttribute("aria-label") || "";

        // Extract airline from "flight with X Airlines" pattern
        const airlineMatch = ariaLabel.match(/flight with ([^,.]+?)(?:\\.|and|,|$)/i);
        if (airlineMatch && airlineMatch[1]) {
          addAirlineName(airlines, airlineMatch[1].trim());
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
        .filter(el => /^\\d{1,2}:\\d{2}\\s*(?:AM|PM)$/.test(el.textContent?.trim() || ""))
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
        if (/^\\d+\\s*hr(\\s*\\d+\\s*min)?$/.test(text)) {
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

        const stopsMatch = text.match(/^(\\d+)\\s+stop/);
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
        const priceMatch = ariaLabel.match(/(\\d+)\\s+US dollars/);
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1], 10);
        } else {
          // Try from text content
          const text = priceElement.textContent?.trim() || "";
          const dollarMatch = text.match(/\\$(\\d+)/);
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

    // Find flight containers and process all flights within them
    function findFlightContainers() {
      const flightData = [];
      const flightSections = new Map();
      let foundAnyFlights = false;

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
            \`Found \${flightElements.length} flights near header "\${headerText}" (isTop: \${isTopSection})\`
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
            \`Found \${flightElements.length} flights using direct page search\`
          );
        }
      }

      // Extra debug info
      console.debug(
        \`Total flight sections found: \${flightSections.size}\`,
        Array.from(flightSections.entries()).map(
          ([el, { isTopSection, elements }]) => ({
            role: el.getAttribute("role"),
            isTop: isTopSection,
            count: elements.length,
          })
        )
      );

      // Process each flight using the modular extraction functions
      for (const [_, { isTopSection, elements }] of flightSections.entries()) {
        for (const flightElement of elements) {
          try {
            // Extract all details from the flight element using our modular approach
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
    }
  `);
}

/**
 * Helper to execute a function in the page context
 * This allows us to keep the main scraping code clean
 */
export async function evaluatePageFunction<T>(
  page: Page,
  functionName: string,
  ...args: unknown[]
): Promise<T> {
  return page.evaluate(
    (fnName, ...fnArgs) => {
      try {
        // Execute the named function with the provided arguments
        // @ts-expect-error - We're calling functions that are defined in the page context
        return window[fnName](...fnArgs);
      } catch (error) {
        console.error(`Error calling ${fnName}:`, error);
        throw error;
      }
    },
    functionName,
    ...args
  );
}
