#!/usr/bin/env bun

import { readFileSync } from "fs";

interface FlightData {
  route: {
    from: string;
    to: string;
  };
  price: number;
  departureDay: string;
  daysUntilDeparture: number;
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

// Initialize an empty data file if it doesn't exist
const dataPath = "data/flights.json";
const defaultData: DailyData = {
  date: new Date().toISOString().split('T')[0],
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

let data: DailyData;
try {
  data = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch (error) {
  console.log("No existing data file found, analyzing routes...");
  data = defaultData;
}

// Calculate statistics
const routeStats = new Map<string, { min: number; max: number; avg: number; count: number }>();

// Process each flight
data.flights.forEach(flight => {
  const routeKey = `${flight.route.from}-${flight.route.to}`;
  const current = routeStats.get(routeKey) || { min: Infinity, max: -Infinity, avg: 0, count: 0 };

  current.min = Math.min(current.min, flight.price);
  current.max = Math.max(current.max, flight.price);
  current.avg = (current.avg * current.count + flight.price) / (current.count + 1);
  current.count++;

  routeStats.set(routeKey, current);
});

// Print route analysis
console.log("\nRoute Analysis:");
console.log("--------------");
routeStats.forEach((stats, route) => {
  console.log(`\n${route}:`);
  console.log(`  Minimum Price: $${stats.min}`);
  console.log(`  Maximum Price: $${stats.max}`);
  console.log(`  Average Price: $${Math.round(stats.avg)}`);
  console.log(`  Sample Size: ${stats.count} flights`);
});

if (data.metadata.routeStats.dayOfWeekAnalysis.departures) {
  console.log("\nDay of Week Price Analysis:");
  console.log("-------------------------");
  const { departures, averagePrices } = data.metadata.routeStats.dayOfWeekAnalysis;
  Object.entries(averagePrices).forEach(([day, price]) => {
    console.log(`${day}: $${price} (${departures[day]} flights)`);
  });
}

if (data.metadata.routeStats.daysAheadAnalysis) {
  console.log("\nDays Until Departure Analysis:");
  console.log("-----------------------------");
  const { daysAheadAnalysis } = data.metadata.routeStats;
  Object.entries(daysAheadAnalysis).forEach(([bracket, stats]) => {
    console.log(`${bracket} days: $${stats.avgPrice} (${stats.count} flights)`);
  });
}
