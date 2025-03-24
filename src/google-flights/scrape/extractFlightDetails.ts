import { FlightData } from "../../types";
import { extractAirlineInfo } from "./extractAirlineInfo";
import { extractAirports } from "./extractAirports";
import { extractDuration } from "./extractDuration";
import { extractPrice } from "./extractPrice";
import { extractStops } from "./extractStops";
import { extractTimes } from "./extractTimes";

// Main function to extract flight details

export function extractFlightDetails(flightElement: Element): FlightData | null {
  // Skip "View more flights" button if present
  if (flightElement.querySelector('button[aria-label="View more flights"]')) {
    return null;
  }

  // Extract price
  const priceElement = flightElement.querySelector(
    'span[data-gs][aria-label$="US dollars"], span[aria-label$="US dollars"]'
  );
  const price = extractPrice(priceElement);

  // Skip if no price found
  if (price === 0) return null;

  // Extract basic details
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
