/**
 * Returns a string function for extracting details from a flight element
 */
export function extractFlightDetailsFunction(): string {
  return `
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
  `;
}
