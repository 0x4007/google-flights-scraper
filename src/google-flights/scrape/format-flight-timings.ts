import { FlightData } from "../../types";

/**
 * Format flight timing information in a clean, consistent way
 * Handles missing or incorrect data gracefully
 */
export function formatFlightTimings(flight: FlightData): string {
  // Use default values for missing data
  const deptTime = flight.departureTime || "---";

  // Handle arrival time with special cases
  let arrTime = flight.arrivalTime;

  // Case 1: Missing arrival time
  if (!arrTime) {
    arrTime = "---";
  }

  // Case 2: Arrival time incorrectly matches departure time
  if (arrTime === deptTime && flight.duration) {
    // Try to estimate arrival time offset based on duration
    const durMatch = flight.duration.match(
      /(\d+)\s*hr\s*(?:(\d+)\s*min)?/
    );
    if (durMatch) {
      const hours = parseInt(durMatch[1], 10);
      const minutes = durMatch[2] ? parseInt(durMatch[2], 10) : 0;

      // Format as departure + offset to indicate it's a calculated value
      if (hours > 0 || minutes > 0) {
        arrTime = `${deptTime} + ${hours > 0 ? hours + "h" : ""}${minutes > 0 ? minutes + "m" : ""}`;
      }
    }
  }

  // Format duration and stops information
  const duration = flight.duration || "Unknown duration";

  // Properly handle different stop scenarios
  let stopsText = "Unknown stops";
  if (flight.stops !== undefined && flight.stops !== null) {
    if (flight.stops === 0) {
      stopsText = "Nonstop";
    } else if (flight.stops === -1) {
      stopsText = "Unknown stops";
    } else {
      stopsText = `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
    }
  }

  return `${deptTime} → ${arrTime} (${duration}, ${stopsText})`;
}
