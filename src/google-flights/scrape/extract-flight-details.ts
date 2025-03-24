import { FlightData } from "../../types";
import { extractAirlineInfo } from "./extract-airline-info";
import { extractAirports } from "./extract-airports";
import { extractDuration } from "./extract-duration";
import { extractPrice } from "./extract-price";
import { extractStops } from "./extract-stops";
import { extractTimes } from "./extract-times";

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
