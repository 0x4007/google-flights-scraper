import { extractAirlineNames } from "./extractAirlineNames";
import { extractBookingCaution } from "./extractBookingCaution";


export function extractAirlineInfo(flightElement: Element): {
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
