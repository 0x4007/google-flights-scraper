import { FlightData } from "../../types";


export function extractPricesFromFlightData(
  flightData: FlightData[]
): number[] {
  return flightData.map((flight) => flight.price);
}
