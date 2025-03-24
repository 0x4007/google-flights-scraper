import { FlightData } from "../../types";

// Format flight timing information

export function formatFlightTimings(flight: FlightData): string {
  const deptTime = flight.departureTime || "Unknown";
  // If arrival time is the same as departure, adjust based on duration
  let arrTime = flight.arrivalTime;
  if (arrTime === deptTime && flight.duration) {
    // Try to estimate arrival time from duration
    const durMatch = flight.duration.match(
      /(\d+)\s*hr\s*(?:(\d+)\s*min)?/
    );
    if (durMatch) {
      const hours = parseInt(durMatch[1], 10);
      // We don't have a way to actually calculate the time, so make it different
      arrTime = deptTime + " + " + (hours > 0 ? hours + "h" : "");
    }
  }
  arrTime = arrTime || "Unknown";

  const duration = flight.duration || "Unknown";
  const stops = flight.stops === 0
    ? "Nonstop"
    : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;

  return `${deptTime} → ${arrTime} (${duration}, ${stops})`;
}
