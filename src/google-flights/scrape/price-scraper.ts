import { Page } from "puppeteer";

interface FlightData {
  price: number;
  airlines: string[]; // Changed from airline/airlineDetails to a single array property
  bookingCaution: null | string;
  departureTime: null | string;
  arrivalTime: null | string;
  duration: null | string;
  stops: number;
  origin: null | string;
  destination: null | string;
  isTopFlight: boolean;
}

export async function scrapeFlightPrices(page: Page): Promise<FlightData[]> {
  console.info("Scraping flight prices and details from results page");

  try {
    // Wait for results to load
console.debug("Waiting for flight results to load");
    await page.waitForSelector("body", { timeout: 10000 });

    // Extract flight data using DOM selectors
    const flights = await page.evaluate(() => {
      const flightData: FlightData[] = [];

      // Helper function to extract price from aria-label
      function extractPrice(element: Element | null): number {
        if (!element) return -1;
        const ariaLabel = element.getAttribute("aria-label");
        if (!ariaLabel) return -1;

        // Extract price from aria-label like "250 US dollars"
        // Using a simple approach to avoid regex backtracking issues
        const parts = ariaLabel.split(" ");
        for (let i = 0; i < parts.length - 2; i++) {
          if (parts[i + 1] === "US" && parts[i + 2] === "dollars") {
            const price = parseInt(parts[i], 10);
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
        const airlineElements = flightElement.querySelectorAll("div > div > div > div > div > span:not([aria-label])");

        for (const el of Array.from(airlineElements)) {
          const text = getText(el);
          if (!text || isNonAirlineText(text)) continue;

          // Clean up and add the airline name
          const cleanedText = text.trim();
          addAirlineName(airlineNames, cleanedText);
        }

        return airlineNames;
      }

      function extractAirlineInfo(flightElement: Element): { airlines: string[]; bookingCaution: null | string } {
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

      function extractTimes(flightElement: Element): { departureTime: null | string; arrivalTime: null | string } {
        // Look for departure time
        const departureTimeElement = flightElement.querySelector('span[aria-label^="Departure time"]');
        const departureTime = departureTimeElement ? getText(departureTimeElement) : null;

        // Look for arrival time separately
        const arrivalTimeElement = flightElement.querySelector('span[aria-label^="Arrival time"]');
        const arrivalTime = arrivalTimeElement ? getText(arrivalTimeElement) : null;

        return { departureTime, arrivalTime };
      }

      function extractDuration(flightElement: Element): null | string {
        const durationElement = flightElement.querySelector('div[aria-label^="Total duration"]');
        return durationElement ? (durationElement.getAttribute("aria-label")?.replace("Total duration ", "") ?? null) : null;
      }

      function extractStops(flightElement: Element): number {
        const stopsElement = flightElement.querySelector('span[aria-label="Nonstop flight."], span[aria-label$="stop flight."]');
        if (!stopsElement) return -1;

        const stopsText = stopsElement.getAttribute("aria-label") ?? null;
        if (!stopsText) return -1;
        if (stopsText.includes("Nonstop")) return 0;

        // Using a simple approach to avoid regex backtracking issues
        const parts = stopsText.split(" ");
        for (let i = 0; i < parts.length - 1; i++) {
          if (parts[i + 1] === "stop" || parts[i + 1] === "stops") {
            const numStops = parseInt(parts[i], 10);
            if (!isNaN(numStops)) {
              return numStops;
            }
          }
        }
        return -1;
      }

      function extractAirports(flightElement: Element): { origin: string | null; destination: string | null } {
        // Target the QylvBf class which contains the airport codes
        const airportElements = flightElement.querySelectorAll('.QylvBf span[aria-label=""]');
        let origin = null;
        let destination = null;

        if (airportElements.length >= 2) {
          origin = getText(airportElements[0]);
          destination = getText(airportElements[1]);
        }

        return { origin, destination };
      }

      // Main function to extract flight details
      function extractFlightDetails(flightElement: Element): FlightData | null {
        // Skip "View more flights" button if present
        if (flightElement.querySelector('button[aria-label="View more flights"]')) {
          return null;
        }

        // Extract price
        const priceElement = flightElement.querySelector('span[aria-label$="US dollars"]');
        const price = extractPrice(priceElement);

        // Skip if no price found
        if (price === 0) return null;

        // Extract other details
        const { airlines, bookingCaution } = extractAirlineInfo(flightElement);
        const { departureTime, arrivalTime } = extractTimes(flightElement);
        const duration = extractDuration(flightElement);
        const stops = extractStops(flightElement);
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
          isTopFlight: false, // Will be set by the caller
        };
      }

      // Process flight elements in a section
      function processFlightElements(elements: NodeListOf<Element>, isTopFlight: boolean) {
        elements.forEach((flightElement) => {
          const flightDetails = extractFlightDetails(flightElement);
          if (flightDetails) {
            flightDetails.isTopFlight = isTopFlight;
            flightData.push(flightDetails);
          }
        });
      }


      // Find and process top flights
      const topFlightsHeader = Array.from(document.querySelectorAll("h3")).find((el) => el.textContent?.includes("Top departing flights"));
      if (topFlightsHeader) {
        const topFlightsSection = topFlightsHeader.closest("div")?.parentElement;
        if (topFlightsSection) {
          const topFlightElements = topFlightsSection.querySelectorAll("ul > li");
          processFlightElements(topFlightElements, true);
        }
      }

      // Find and process other flights
      const otherFlightsHeader = Array.from(document.querySelectorAll("h3")).find((el) => el.textContent?.includes("Other departing flights"));
      if (otherFlightsHeader) {
        const otherFlightsSection = otherFlightsHeader.closest("div")?.parentElement;
        if (otherFlightsSection) {
          const otherFlightElements = otherFlightsSection.querySelectorAll("ul > li");
          processFlightElements(otherFlightElements, false);
        }
      }

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

      console.info(`Found ${flights.length} flights (${topFlights.length} top flights, ${otherFlights.length} other flights)`);

      // Return all flight data
      return flights;
    }

    console.warn("No flights found on the page");
    return [];
  } catch (error) {
    console.error(`Error scraping flight prices: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

export function extractPricesFromFlightData(flightData: FlightData[]): number[] {
  return flightData.map((flight) => flight.price);
}
