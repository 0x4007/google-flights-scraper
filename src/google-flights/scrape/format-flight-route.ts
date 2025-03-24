import { FlightData } from "../../types";

/**
 * Format flight route information in a clean, consistent way
 * Handles missing or incomplete data gracefully
 */
export function formatFlightRoute(flight: FlightData): string {
  // Validate and use default values for missing data
  const origin = flight.origin || "---";
  const destination = flight.destination || "---";

  // Format airlines list, ensuring we only include actual airlines
  let airlineText = "Unknown";
  if (Array.isArray(flight.airlines) && flight.airlines.length > 0) {
    // Filter out any potentially invalid airlines
    const validAirlines = flight.airlines.filter(airline =>
      airline &&
      typeof airline === 'string' &&
      airline.length > 2 &&
      !airline.includes("Airport") &&
      !/^[A-Z]{3}$/.test(airline) // Not just an airport code
    );

    if (validAirlines.length > 0) {
      airlineText = validAirlines.join(" / ");
    }
  }

  // Check if origin and destination are the same (likely an error)
  if (origin === destination && origin !== "---") {
    // Try to recover by using a generic format
    return `${origin} → ? (${airlineText})`;
  }

  return `${origin} → ${destination} (${airlineText})`;
}
