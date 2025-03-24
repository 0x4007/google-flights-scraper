import { formatFlightRoute } from "./google-flights/scrape/format-flight-route";
import { FlightData } from "./types";

console.log("======= TESTING AIRLINE EXTRACTION =======");

// Test handling of ITA airline data
const itaFlightData: FlightData = {
  price: 123,
  airlines: ["ITA"],
  bookingCaution: null,
  departureTime: "7:00 AM",
  arrivalTime: "8:10 AM",
  duration: "1 hr 10 min",
  stops: 0,
  origin: "FCO",
  destination: "LIN",
  isTopFlight: true
};

// Test handling of AEROITALIA airline data
const aeroitaliaFlightData: FlightData = {
  price: 184,
  airlines: ["AEROITALIA SRL"],
  bookingCaution: null,
  departureTime: "9:30 AM",
  arrivalTime: "10:55 AM",
  duration: "1 hr 25 min",
  stops: 0,
  origin: "FCO",
  destination: "MXP",
  isTopFlight: true
};

// Test with our new extraction logic
console.log("Testing Italian carriers extraction and formatting:");

// Format the routes
const itaFormattedRoute = formatFlightRoute(itaFlightData);
console.log("ITA formatted route:", itaFormattedRoute);

const aeroitaliaFormattedRoute = formatFlightRoute(aeroitaliaFlightData);
console.log("AEROITALIA formatted route:", aeroitaliaFormattedRoute);

// Check if the formatted routes include the correct airline names
const itaTest = itaFormattedRoute.includes("ITA");
const aeroitaliaTest = aeroitaliaFormattedRoute.includes("AEROITALIA SRL");

// Test our logic before and after the changes with invalid airline data
const unknownAirlineData: FlightData = {
  price: 148,
  airlines: ["Carrier information unavailable"],
  bookingCaution: null,
  departureTime: "8:00 AM",
  arrivalTime: "9:10 AM",
  duration: "1 hr 10 min",
  stops: 0,
  origin: "ITA", // Intentionally using ITA as origin to test detection
  destination: "LIN",
  isTopFlight: true
};

// Format the unknown route
const unknownFormattedRoute = formatFlightRoute(unknownAirlineData);
console.log("Unknown airline formatted route:", unknownFormattedRoute);

// Check if the test passed for both cases
const testPassed = itaTest && aeroitaliaTest;
console.log("\nTest result:", testPassed ? "✅ PASSED" : "❌ FAILED");

// Exit with appropriate code
process.exit(testPassed ? 0 : 1);
