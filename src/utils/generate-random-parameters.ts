/**
 * Utility to generate random flight search parameters for testing
 */

import { FlightSearchParameters } from "../types";

/**
 * Popular city pairs for testing
 * Format: [from, to]
 */
const POPULAR_CITY_PAIRS: [string, string][] = [
  ["Seoul", "Tokyo"],
  ["New York", "London"],
  ["San Francisco", "Tokyo"],
  ["London", "Paris"],
  ["Singapore", "Bangkok"],
  ["Los Angeles", "New York"],
  ["Beijing", "Shanghai"],
  ["Sydney", "Melbourne"],
  ["Dubai", "Istanbul"],
  ["Toronto", "Vancouver"],
  ["Berlin", "Munich"],
  ["Madrid", "Barcelona"],
  ["Rome", "Milan"],
  ["Amsterdam", "Paris"],
  ["Bangkok", "Hong Kong"]
];

/**
 * Generates a random date string in YYYY-MM-DD format
 * @param minDaysFromNow Minimum days from now
 * @param maxDaysFromNow Maximum days from now
 * @returns Date string in YYYY-MM-DD format
 */
function generateRandomDate(minDaysFromNow: number, maxDaysFromNow: number): string {
  const now = new Date();
  const randomDaysToAdd = minDaysFromNow + Math.floor(Math.random() * (maxDaysFromNow - minDaysFromNow));

  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + randomDaysToAdd);

  return futureDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

/**
 * Generates a random return date that is after the departure date
 * @param departureDate Departure date string in YYYY-MM-DD format
 * @param minStayDays Minimum stay duration in days
 * @param maxStayDays Maximum stay duration in days
 * @returns Return date string in YYYY-MM-DD format
 */
function generateRandomReturnDate(
  departureDate: string,
  minStayDays: number = 3,
  maxStayDays: number = 21
): string {
  const departureDateObj = new Date(departureDate);
  const stayDuration = minStayDays + Math.floor(Math.random() * (maxStayDays - minStayDays));

  const returnDateObj = new Date(departureDateObj);
  returnDateObj.setDate(departureDateObj.getDate() + stayDuration);

  return returnDateObj.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

/**
 * Randomly selects a city pair
 * @returns [from, to] array of city names
 */
function getRandomCityPair(): [string, string] {
  const randomIndex = Math.floor(Math.random() * POPULAR_CITY_PAIRS.length);
  return POPULAR_CITY_PAIRS[randomIndex];
}

/**
 * Generates a random combination of flight search parameters for testing
 * @returns FlightSearchParameters object
 */
export function generateRandomParameters(): FlightSearchParameters {
  // Get random cities
  const [from, to] = getRandomCityPair();

  // Generate random future dates (30-180 days from now)
  const departureDate = generateRandomDate(30, 180);

  // Generate random return date (3-21 days after departure)
  const returnDate = generateRandomReturnDate(departureDate, 3, 21);

  // Randomly decide whether to include budget carriers
  const includeBudget = Math.random() > 0.5;

  return {
    from,
    to,
    departureDate,
    returnDate,
    includeBudget
  };
}

/**
 * Generates multiple random parameter sets for testing
 * @param count Number of parameter sets to generate
 * @returns Array of FlightSearchParameters objects
 */
export function generateMultipleRandomParameters(count: number = 5): FlightSearchParameters[] {
  const parameterSets: FlightSearchParameters[] = [];

  for (let i = 0; i < count; i++) {
    parameterSets.push(generateRandomParameters());
  }

  return parameterSets;
}

/**
 * Prints the generated parameters to the console in a readable format
 * @param parameters FlightSearchParameters object
 */
export function logGeneratedParameters(parameters: FlightSearchParameters): void {
  console.log("Generated Flight Search Parameters:");
  console.log("------------------------");
  console.log(`From: ${parameters.from}`);
  console.log(`To: ${parameters.to}`);
  console.log(`Departure Date: ${parameters.departureDate}`);
  console.log(`Return Date: ${parameters.returnDate || "One-way trip"}`);
  console.log(`Include Budget Carriers: ${parameters.includeBudget}`);
  console.log("------------------------");
}

// If this file is run directly, generate and display some example parameters
if (import.meta.main) {
  console.log("Generating random flight search parameters examples:");
  const examples = generateMultipleRandomParameters(3);

  examples.forEach((params, index) => {
    console.log(`\nExample ${index + 1}:`);
    logGeneratedParameters(params);
  });
}
