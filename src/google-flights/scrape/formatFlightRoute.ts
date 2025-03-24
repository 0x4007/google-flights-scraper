import { FlightData } from "../../types";

// Format flight route information

export function formatFlightRoute(flight: FlightData): string {
  const origin = flight.origin || "Unknown";
  const destination = flight.destination || "Unknown";
  const airlines = flight.airlines.join("/") || "Unknown";
  return `${origin} → ${destination} (${airlines})`;
}
