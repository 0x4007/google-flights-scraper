import { Page } from "puppeteer";
import { FlightData } from "../../types";

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
            document.querySelectorAll("*"),
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
        { timeout: 15000 },
      );

      console.debug("Price elements found, proceeding with scraping");
    } catch (err) {
      console.warn(
        "Timeout waiting for price elements, will try alternative approaches:",
        err,
      );
    }

    // Extract flight data using DOM selectors
    const flights = await page.evaluate(() => {
      const flightData: FlightData[] = [];

      // Helper function to extract price from aria-label
      function extractPrice(element: Element | null): number {
        if (!element) return -1;

        // First try using aria-label
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) {
          // Extract price from aria-label containing "US dollars"
          // This matches formats like "386 US dollars" or "From 386 US dollars round trip total"
          const match = ariaLabel.match(/(\d+)\s+US dollars/);
          if (match && match[1]) {
            const price = parseInt(match[1], 10);
            if (!isNaN(price)) {
              return price;
            }
          }
        }

        // Fallback: try to extract from text content if aria-label doesn't work
        const text = element.textContent?.trim();
        if (text) {
          // Match "$XXX" format
          const dollarMatch = text.match(/\$(\d+)/);
          if (dollarMatch && dollarMatch[1]) {
            const price = parseInt(dollarMatch[1], 10);
            if (!isNaN(price)) {
              return price;
            }
          }

          // If no dollar sign, try just matching digits
          const digitMatch = text.match(/^(\d+)$/);
          if (digitMatch && digitMatch[1]) {
            const price = parseInt(digitMatch[1], 10);
            if (!isNaN(price)) {
              return price;
            }
          }
        }

        return -1;
      }

      // Helper function to extract text content safely
      function getText(element: Element | null): null | string {
        return element?.textContent?.trim() ?? null;
      }

      // Helper functions to extract specific flight details
      function extractBookingCaution(flightElement: Element): string | null {
        const bookingCautionElements = flightElement.querySelectorAll("span");
        for (const el of Array.from(bookingCautionElements)) {
          const text = getText(el);
          if (!text) continue;

          if (text.includes("Self transfer")) {
            return "Self transfer";
          }
          if (text.includes("Separate tickets")) {
            return "Separate tickets booked together";
          }
        }
        return null;
      }

      function isNonAirlineText(text: string): boolean {
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
          /^[A-Z]{3}/.test(text) || // Skip airport codes (3 uppercase letters)
          text.includes("International Airport") ||
          text.includes("Airport") ||
          text.includes("Wed,") ||
          text.includes("Thu,") ||
          text.includes("Fri,") ||
          text.includes("Sat,") ||
          text.includes("Sun,") ||
          text.includes("Mon,") ||
          text.includes("Tue,") ||
          /\d{4}/.test(text) || // Skip years
          /\d{1,2}:\d{2}/.test(text)
        ); // Skip times
      }

      function splitConcatenatedNames(text: string): string[] {
        if (!text) return [];

        // First handle comma-separated parts
        if (text.includes(",")) {
          return text
            .split(",")
            .map((part) => part.trim())
            .flatMap((part) => splitConcatenatedNames(part))
            .filter(Boolean);
        }

        // Look for camelCase patterns (lowercase followed by uppercase)
        const splitPoints: number[] = [];
        for (let i = 0; i < text.length - 1; i++) {
          // Check if current char is lowercase and next char is uppercase
          if (/[a-z]/.test(text[i]) && /[A-Z]/.test(text[i + 1])) {
            splitPoints.push(i + 1);
          }
        }

        // If no split points found, return the original text
        if (splitPoints.length === 0) {
          return [text];
        }

        // Split the text at the identified points
        const result: string[] = [];
        let startIndex = 0;

        for (const splitPoint of splitPoints) {
          const part = text.substring(startIndex, splitPoint).trim();
          if (part) result.push(part);
          startIndex = splitPoint;
        }

        // Add the last part
        const lastPart = text.substring(startIndex).trim();
        if (lastPart) result.push(lastPart);

        return result;
      }

      function addAirlineName(airlineNames: string[], text: string): void {
        if (!text) return;

        // Split any concatenated names and add each one if not already in the list
        const names = splitConcatenatedNames(text);
        for (const name of names) {
          if (name && !airlineNames.includes(name)) {
            airlineNames.push(name);
          }
        }
      }

      function extractAirlineNames(flightElement: Element): string[] {
        const airlineNames: string[] = [];
        const airlineElements = flightElement.querySelectorAll(
          "div > div > span:not([aria-label]), div > span:not([aria-label])",
        );

        for (const el of Array.from(airlineElements)) {
          const text = getText(el);
          if (!text || isNonAirlineText(text)) continue;

          // Clean up and add the airline name
          const cleanedText = text.trim();
          addAirlineName(airlineNames, cleanedText);
        }

        return airlineNames;
      }

      function extractAirlineInfo(flightElement: Element): {
        airlines: string[];
        bookingCaution: null | string;
      } {
        // Extract booking type
        const bookingCaution = extractBookingCaution(flightElement);

        // Extract airline names
        const airlineNames = extractAirlineNames(flightElement);

        // Process collected airline names - ensure uniqueness
        const uniqueAirlines = [...new Set(airlineNames)];

        return {
          airlines: uniqueAirlines.length > 0 ? uniqueAirlines : [],
          bookingCaution,
        };
      }

      function extractTimes(flightElement: Element): {
        departureTime: null | string;
        arrivalTime: null | string;
      } {
        // Find time span elements that match expected format
        const times = Array.from(flightElement.querySelectorAll("div"))
          .filter((el) => {
            const text = getText(el);
            return text && /^\d{1,2}:\d{2}\s*(?:AM|PM)/.test(text);
          })
          .map((el) => getText(el));

        // Generally, departure time comes first, arrival time second
        const departureTime = times[0] || null;
        const arrivalTime = times[1] || null;

        return { departureTime, arrivalTime };
      }

      function extractDuration(flightElement: Element): null | string {
        // Look for text matching pattern "X hr Y min"
        const durationDiv = Array.from(
          flightElement.querySelectorAll("div"),
        ).find((div) => {
          const text = getText(div);
          return text && /^\d+\s*hr\s*(?:\d+\s*min)?$/.test(text);
        });

        return durationDiv ? getText(durationDiv) : null;
      }

      function extractStops(flightElement: Element): number {
        // First try with aria-label approach (traditional)
        const stopsElement = flightElement.querySelector(
          'span[aria-label="Nonstop flight."], span[aria-label$="stop flight."]',
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
          (div) => getText(div)?.trim() === "Nonstop",
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

      // Parse time details from aria-label
      function extractTimeDetails(element: Element | null): {
        time: string;
        date: string;
        fullTimestamp: string;
        nextDay?: boolean;
      } | undefined {
        if (!element) return undefined;

        // Get aria-label which contains full timestamp info
        const ariaLabel = element.getAttribute("aria-label") || "";
        if (!ariaLabel) {
          // Fallback to text content if aria-label is not available
          const text = getText(element);
          if (!text) return undefined;

          // Check for +1 indicator for next day
          const nextDay = text.includes("+1");
          // Basic extraction from text content
          return {
            time: text.replace("+1", "").trim(),
            date: "",
            fullTimestamp: text,
            nextDay: nextDay,
          };
        }

        // Parse time string (e.g., "6:30 PM")
        const timeMatch = ariaLabel.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/);
        const time = timeMatch ? timeMatch[1] : "";

        // Parse date string (e.g., "Mon, Mar 31")
        const dateMatch = ariaLabel.match(/(on\s+)([^,]+,\s+[^,]+)/);
        const date = dateMatch ? dateMatch[2] : "";

        // Check for next day indicator
        const nextDay = ariaLabel.includes("+1") ||
                        element.textContent?.includes("+1") ||
                        false;

        return {
          time,
          date,
          fullTimestamp: ariaLabel,
          nextDay,
        };
      }

      // Parse duration into minutes for easier comparison
      function parseDurationToMinutes(durationText: string | null): number | undefined {
        if (!durationText) return undefined;

        // Match formats like "2 hr 30 min" or "2 hr"
        const hourMatch = durationText.match(/(\d+)\s*hr/);
        const minMatch = durationText.match(/(\d+)\s*min/);

        const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;

        return hours * 60 + minutes;
      }

      // Extract emissions data
      function extractEmissions(flightElement: Element): {
        value: number;
        unit: string;
        comparison?: string;
        comparisonValue?: number;
      } | undefined {
        // Look for emissions data in div elements with specific text patterns
        const emissionsDiv = Array.from(flightElement.querySelectorAll("div"))
          .find((div) => {
            const text = getText(div);
            return text && /^\d+\s*kg\s*CO2e$/.test(text);
          });

        if (!emissionsDiv) return undefined;

        // Extract value and unit
        const emissionsText = getText(emissionsDiv);
        if (!emissionsText) return undefined;

        const valueMatch = emissionsText.match(/(\d+)/);
        const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;
        const unit = "kg CO2e";

        // Look for comparison text (e.g., "-6% emissions")
        // Find all divs with aria-hidden="true" that might contain emissions info
        let comparison = undefined;
        let comparisonValue = undefined;

        const emissionsDivs = Array.from(flightElement.querySelectorAll('div[aria-hidden="true"]'))
          .filter(div => div.textContent?.includes("emissions"));

        if (emissionsDivs.length > 0) {
          const comparisonText = emissionsDivs[0]?.textContent?.trim();

          if (comparisonText) {
            comparison = comparisonText;
            const percentMatch = comparisonText.match(/([+-]?\d+)%/);
            if (percentMatch) {
              comparisonValue = parseInt(percentMatch[1], 10);
            }
          }
        }

        return {
          value,
          unit,
          comparison,
          comparisonValue,
        };
      }

      // Extract layover information
      function extractLayovers(flightElement: Element, stops: number): Array<{
        airport: string;
        airportFullName?: string;
        duration: string;
        durationMinutes?: number;
        overnight?: boolean;
        airportChange?: boolean;
      }> | undefined {
        if (stops <= 0) return undefined;

        const layovers = [];

        // Look for layover elements
        const layoverElements = Array.from(
          flightElement.querySelectorAll('div[aria-label*="Layover"]')
        );

        if (layoverElements.length === 0) {
          // Alternative approach using div elements with layover duration patterns
          const layoverDivs = Array.from(flightElement.querySelectorAll("div"))
            .filter(div => {
              const text = getText(div);
              return text && /^\d+\s*hr\s*\d+\s*min\s*[A-Z]{3}$/.test(text);
            });

          for (const div of layoverDivs) {
            const text = getText(div) || "";
            const durationMatch = text.match(/(\d+\s*hr\s*\d+\s*min)/);
            const airportMatch = text.match(/([A-Z]{3})$/);

            if (durationMatch && airportMatch) {
              const duration = durationMatch[1];
              const airport = airportMatch[1];
              const durationMinutes = parseDurationToMinutes(duration);

              layovers.push({
                airport,
                duration,
                durationMinutes,
              });
            }
          }
        } else {
          // Process actual layover elements
          for (const layoverEl of layoverElements) {
            const ariaLabel = layoverEl.getAttribute("aria-label") || "";
            const text = getText(layoverEl) || "";

            // Extract airport code
            const airportMatch = ariaLabel.match(/(?:in|at)\s+([A-Z]{3})/) ||
                                text.match(/([A-Z]{3})$/);
            const airport = airportMatch ? airportMatch[1] : "";

            // Extract duration
            const durationMatch = ariaLabel.match(/(\d+\s*hr\s*\d+\s*min)/) ||
                                  ariaLabel.match(/(\d+\s*hr)/) ||
                                  text.match(/(\d+\s*hr\s*\d+\s*min)/) ||
                                  text.match(/(\d+\s*hr)/);
            const duration = durationMatch ? durationMatch[1] : "";
            const durationMinutes = parseDurationToMinutes(duration);

            // Check for overnight or airport change
            const overnight = ariaLabel.includes("overnight") ||
                              layoverEl.querySelector('svg[aria-hidden="true"]') !== null;
            const airportChange = ariaLabel.includes("Change of airport") ||
                                  text.includes("Change of airport");

            // Extract airport full name if available
            let airportFullName;
            const airportNameElements = layoverEl.querySelectorAll('span[jsname="bN97Pc"]');
            for (const el of Array.from(airportNameElements)) {
              if (el.textContent?.includes("Airport")) {
                airportFullName = el.textContent.trim();
                break;
              }
            }

            layovers.push({
              airport,
              airportFullName,
              duration,
              durationMinutes,
              overnight,
              airportChange,
            });
          }
        }

        return layovers.length > 0 ? layovers : undefined;
      }

      // Extract flight numbers
      function extractFlightNumbers(flightElement: Element): string[] | undefined {
        const flightNumbers: string[] = [];

        // Look for elements with flight number patterns (e.g., "OZ106", "JL92")
        const possibleFlightNumberElements = Array.from(
          flightElement.querySelectorAll('span, div')
        ).filter(el => {
          const text = getText(el);
          // Match patterns like "OZ106", "JL92", etc.
          return text && /^[A-Z]{2}\d{1,4}$/.test(text);
        });

        for (const el of possibleFlightNumberElements) {
          const flightNumber = getText(el);
          if (flightNumber && !flightNumbers.includes(flightNumber)) {
            flightNumbers.push(flightNumber);
          }
        }

        // Also try data-gs attribute which sometimes contains flight numbers
        const dataGsElements = flightElement.querySelectorAll('[data-gs]');
        for (const el of Array.from(dataGsElements)) {
          const dataGs = el.getAttribute('data-gs') || '';
          const flightNumberMatch = dataGs.match(/([A-Z]{2}\d{1,4})/g);
          if (flightNumberMatch) {
            for (const num of flightNumberMatch) {
              if (!flightNumbers.includes(num)) {
                flightNumbers.push(num);
              }
            }
          }
        }

        return flightNumbers.length > 0 ? flightNumbers : undefined;
      }

      // Extract operating carriers
      function extractOperatingCarriers(flightElement: Element): string[] | undefined {
        const operatingCarriers: string[] = [];

        // Look for "Operated by" text
        const operatedByElements = Array.from(
          flightElement.querySelectorAll('span, div')
        ).filter(el => {
          const text = getText(el);
          return text && text.includes("Operated by");
        });

        for (const el of operatedByElements) {
          const text = getText(el);
          if (!text) continue;

          // Extract carrier name after "Operated by"
          const match = text.match(/Operated by\s+(.+)$/);
          if (match && match[1]) {
            operatingCarriers.push(match[1].trim());
          }
        }

        return operatingCarriers.length > 0 ? operatingCarriers : undefined;
      }

      function extractAirports(flightElement: Element): {
        origin: string | null;
        destination: string | null;
        originDetails?: {
          code: string;
          fullName: string;
        };
        destinationDetails?: {
          code: string;
          fullName: string;
        };
      } {
        // Look for airport codes in div elements
        const airportDivs = Array.from(
          flightElement.querySelectorAll("div > div"),
        ).filter((div) => /^[A-Z]{3}$/.test(div.textContent?.trim() || ""));

        let origin = null;
        let destination = null;
        let originDetails = undefined;
        let destinationDetails = undefined;

        if (airportDivs.length >= 2) {
          origin = getText(airportDivs[0]);
          destination = getText(airportDivs[1]);

          // Try to extract airport full names
          for (let i = 0; i < airportDivs.length; i++) {
            const div = airportDivs[i];
            const code = getText(div);
            if (!code) continue;

            // Try to find associated tooltip/popup with airport name
            const tooltipEl = div.querySelector('span[jsname="bN97Pc"]') ||
                             div.closest('span[jscontroller]')?.querySelector('div[jsname="bN97Pc"]');

            const fullName = tooltipEl?.textContent?.trim() || "";

            if (code && fullName) {
              if (i === 0) {
                originDetails = { code, fullName };
              } else if (i === 1) {
                destinationDetails = { code, fullName };
              }
            }
          }
        }

        return {
          origin,
          destination,
          originDetails,
          destinationDetails
        };
      }

      // Main function to extract flight details
      function extractFlightDetails(flightElement: Element): FlightData | null {
        // Skip "View more flights" button if present
        if (
          flightElement.querySelector('button[aria-label="View more flights"]')
        ) {
          return null;
        }

        // Extract price
        const priceElement = flightElement.querySelector(
          'span[data-gs][aria-label$="US dollars"], span[aria-label$="US dollars"]',
        );
        const price = extractPrice(priceElement);

        // Skip if no price found
        if (price === 0) return null;

        // Extract basic details
        const { airlines, bookingCaution } = extractAirlineInfo(flightElement);
        const { departureTime, arrivalTime } = extractTimes(flightElement);
        const duration = extractDuration(flightElement);
        const stops = extractStops(flightElement);
        const airportInfo = extractAirports(flightElement);
        const { origin, destination, originDetails, destinationDetails } = airportInfo;

        // Extract enhanced metadata
        // Find time elements for more detailed extraction
        const timeElements = Array.from(flightElement.querySelectorAll("div"))
          .filter((el) => {
            const text = getText(el);
            return text && /^\d{1,2}:\d{2}\s*(?:AM|PM)/.test(text);
          });

        // Process departure time details
        const departureTimeElement = timeElements[0] || null;
        const departureTimeDetails = departureTimeElement ?
          extractTimeDetails(departureTimeElement) : undefined;

        // Process arrival time details
        const arrivalTimeElement = timeElements[1] || null;
        const arrivalTimeDetails = arrivalTimeElement ?
          extractTimeDetails(arrivalTimeElement) : undefined;

        // Parse duration to minutes
        const durationMinutes = parseDurationToMinutes(duration);

        // Extract emissions data
        const emissions = extractEmissions(flightElement);

        // Extract layover information for flights with stops
        const layovers = stops > 0 ? extractLayovers(flightElement, stops) : undefined;

        // Extract flight numbers
        const flightNumbers: string[] = extractFlightNumbers(flightElement) || [];

        // Extract operating carriers
        const operatingCarriers: string[] = extractOperatingCarriers(flightElement) || [];

        return {
          // Basic flight data
          price,
          airlines,
          bookingCaution,
          departureTime,
          arrivalTime,
          duration,
          stops,
          origin,
          destination,
          isTopFlight: false, // Will be set by the caller

          // Enhanced metadata
          departureTimeDetails,
          arrivalTimeDetails,
          durationMinutes,
          originDetails,
          destinationDetails,
          emissions,
          layovers,
          flightNumbers: flightNumbers.length > 0 ? flightNumbers : undefined,
          operatingCarriers: operatingCarriers.length > 0 ? operatingCarriers : undefined,
        };
      }

      // Process flight elements in a section
      function processFlightElements(
        elements: Element[],
        isTopFlight: boolean,
      ) {
        elements.forEach((flightElement) => {
          const flightDetails = extractFlightDetails(flightElement);
          if (flightDetails) {
            flightDetails.isTopFlight = isTopFlight;
            flightData.push(flightDetails);
          }
        });
      }

      // Process all flights by section
      const flightSections = new Map();

      // Helper function to identify flight list items
      function findFlightElements(container: Element | Document): Element[] {
        // First use standard selectors and then filter
        let elements = Array.from(container.querySelectorAll('li')).filter(li => {
          return li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
                 li.querySelector('span[aria-label*="US dollars"]') !== null;
        });

        // If nothing found, try broader approach
        if (elements.length === 0) {
          // Find li elements with price tags inside
          elements = Array.from(container.querySelectorAll("li")).filter(
            (li) => {
              // Look for price patterns
              const hasPrice =
                li.textContent?.includes("$") ||
                !!li.querySelector('span[aria-label*="dollars"]');

              // Verify it's a flight by checking for flight-related content
              const hasDuration = Array.from(li.querySelectorAll("div")).some(
                (div) => /^\d+\s*hr/.test(div.textContent?.trim() || ""),
              );

              return hasPrice && hasDuration;
            },
          );
        }

        // Filter out any "View more flights" buttons or other non-flight items
        return elements.filter(
          (el) =>
            !el.querySelector('button[aria-label="View more flights"]') &&
            !el.textContent?.includes("View more flights"),
        );
      }

      // Try to find flights by section headers
      const headers = Array.from(document.querySelectorAll("h3"));
      let foundAnyFlights = false;

      // Check for headers like "Top departing flights" or "Other departing flights"
      for (const header of headers) {
        const headerText = header.textContent || "";
        const isTopSection = headerText.includes("Top departing flights");

        // Look for flight elements in the header's region
        const region =
          header.closest('[role="region"]') || header.parentElement;

        if (region) {
          // For top flights, look for tabpanel
          const container = isTopSection
            ? region.querySelector('[role="tabpanel"]') || region
            : region;

          const flightElements = findFlightElements(container);

          if (flightElements.length > 0) {
            flightSections.set(container, {
              isTopSection,
              elements: flightElements,
            });
            foundAnyFlights = true;
            console.debug(
              `Found ${flightElements.length} flights near header "${headerText}" (isTop: ${isTopSection})`,
            );
          }
        }
      }

      // If no flights found by headers, try a more general approach
      if (!foundAnyFlights) {
        console.debug("No flights found by headers, trying direct search");

        // Try to find any flight elements in the whole page
        const allFlightElements = findFlightElements(document);

        if (allFlightElements.length > 0) {
          flightSections.set(document.body, {
            isTopSection: false, // Can't determine if they're top flights
            elements: allFlightElements,
          });
          console.debug(
            `Found ${allFlightElements.length} flights using direct page search`,
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
          }),
        ),
      );

      // Process flights by section
      flightSections.forEach(({ isTopSection, elements }, _) => {
        processFlightElements(elements, isTopSection);
      });

      // Remove duplicate flights by creating a unique ID for each flight and filtering
      const flightIdMap = new Map<string, FlightData>();

      for (const flight of flightData) {
        // Create a unique ID based on flight details
        const flightId = `${flight.price}-${flight.departureTime}-${flight.arrivalTime}-${flight.duration}`;

        // If this is a top flight or we haven't seen this flight before, keep it
        if (flight.isTopFlight || !flightIdMap.has(flightId)) {
          flightIdMap.set(flightId, flight);
        }
      }

      // Return only unique flights
      return Array.from(flightIdMap.values());
    });

    // Log results
    if (flights.length > 0) {
      const topFlights = flights.filter((f) => f.isTopFlight);
      const otherFlights = flights.filter((f) => !f.isTopFlight);

      console.info(
        `Found ${flights.length} flights (${topFlights.length} top flights, ${otherFlights.length} other flights)`,
      );

      // Return all flight data
      return flights;
    }

    console.warn("No flights found on the page");
    return [];
  } catch (error) {
    console.error(
      `Error scraping flight prices: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }
}

export function extractPricesFromFlightData(
  flightData: FlightData[],
): number[] {
  return flightData.map((flight) => flight.price);
}
