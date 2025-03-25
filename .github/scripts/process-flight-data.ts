#!/usr/bin/env bun

interface FlightData {
  route: {
    from: string;
    to: string;
  };
  price: number;
  departureDay: string;
  daysUntilDeparture: number;
  timestamp: string;
}

// Get flight data from environment variables
const startDate = process.env.START_DATE;
const endDate = process.env.END_DATE || startDate;
const location = process.env.LOCATION;

if (!startDate || !location) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Calculate days until departure
const today = new Date();
const departureDate = new Date(startDate);
const daysUntil = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

// Extract origin and destination from location (format: "ICN-NRT")
const [from, to] = location.split("-");

// Create flight data object
const flightData: FlightData = {
  route: {
    from,
    to
  },
  price: parseInt(process.env.PRICE || "0", 10),
  departureDay: startDate,
  daysUntilDeparture: daysUntil,
  timestamp: new Date().toISOString()
};

// Output the flight data as a stringified JSON
console.log(JSON.stringify(flightData));
