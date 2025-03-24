import { FlightData } from "../../types";
import { extractFlightDetails } from "./extract-flight-details";

// Process flight elements in a section

export function processFlightElements(
  elements: Element[],
  isTopFlight: boolean,
  flightData: FlightData[]
): void {
  elements.forEach((flightElement) => {
    const flightDetails = extractFlightDetails(flightElement);
    if (flightDetails) {
      flightDetails.isTopFlight = isTopFlight;
      flightData.push(flightDetails);
    }
  });
}
