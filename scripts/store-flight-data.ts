#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

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

interface DailyData {
  date: string;
  flights: FlightData[];
  metadata: {
    routeStats: {
      dayOfWeekAnalysis: {
        departures: Record<string, number>;
        averagePrices: Record<string, number>;
      };
      daysAheadAnalysis: {
        [key: string]: { count: number; avgPrice: number };
      };
    };
  };
}

const DATA_DIR = "data";
const DATA_FILE = join(DATA_DIR, "flights.json");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR);
}

// Initialize or load existing data
let existingData: DailyData = {
  date: new Date().toISOString().split("T")[0],
  flights: [],
  metadata: {
    routeStats: {
      dayOfWeekAnalysis: {
        departures: {},
        averagePrices: {}
      },
      daysAheadAnalysis: {}
    }
  }
};

if (existsSync(DATA_FILE)) {
  try {
    existingData = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading existing data:", error);
  }
}

// Function to update statistics
function updateStats(data: DailyData, newFlight: FlightData) {
  const stats = data.metadata.routeStats;
  const dayOfWeek = new Date(newFlight.departureDay).toLocaleDateString("en-US", { weekday: "long" });

  // Update day of week statistics
  stats.dayOfWeekAnalysis.departures[dayOfWeek] = (stats.dayOfWeekAnalysis.departures[dayOfWeek] || 0) + 1;
  const prevTotal = (stats.dayOfWeekAnalysis.averagePrices[dayOfWeek] || 0) *
                   (stats.dayOfWeekAnalysis.departures[dayOfWeek] - 1);
  stats.dayOfWeekAnalysis.averagePrices[dayOfWeek] =
    (prevTotal + newFlight.price) / stats.dayOfWeekAnalysis.departures[dayOfWeek];

  // Update days ahead analysis
  const bracket = `${Math.floor(newFlight.daysUntilDeparture / 7) * 7}-${Math.floor(newFlight.daysUntilDeparture / 7) * 7 + 6}`;
  if (!stats.daysAheadAnalysis[bracket]) {
    stats.daysAheadAnalysis[bracket] = { count: 0, avgPrice: 0 };
  }
  const bracketStats = stats.daysAheadAnalysis[bracket];
  bracketStats.avgPrice =
    (bracketStats.avgPrice * bracketStats.count + newFlight.price) / (bracketStats.count + 1);
  bracketStats.count++;
}

// Add new flight data
function addFlightData(flightData: FlightData) {
  // Add timestamp if not present
  if (!flightData.timestamp) {
    flightData.timestamp = new Date().toISOString();
  }

  // Check for duplicate entries within last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const isDuplicate = existingData.flights.some(flight =>
    flight.route.from === flightData.route.from &&
    flight.route.to === flightData.route.to &&
    flight.departureDay === flightData.departureDay &&
    flight.timestamp > last24Hours
  );

  if (!isDuplicate) {
    existingData.flights.push(flightData);
    updateStats(existingData, flightData);
    return true;
  }
  return false;
}

// Save data to file
function saveData() {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
    console.log("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Handle input from GitHub Actions
// Example: Read from environment variable or command line argument
const newFlightData = process.env.FLIGHT_DATA;
if (newFlightData) {
  try {
    const flightData = JSON.parse(newFlightData);
    if (addFlightData(flightData)) {
      console.log("New flight data added");
      saveData();
    } else {
      console.log("Duplicate flight data skipped");
    }
  } catch (error) {
    console.error("Error processing flight data:", error);
  }
} else {
  console.error("No flight data provided");
}
