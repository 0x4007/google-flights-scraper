#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface FlightData {
  route: {
    from: string;
    to: string;
  };
  price: number;
  departureDay: string;
  searchDay: string;
  daysAhead: number;
}

interface ProcessedData {
  flights: FlightData[];
  metadata: {
    routeStats: {
      dayOfWeekAnalysis: {
        departures: { [key: string]: number };
        averagePrices: { [key: string]: number };
      };
      daysAheadAnalysis: {
        [key: string]: {
          avgPrice: number;
          count: number;
        };
      };
    };
  };
}

function getCurrentRoute(): { from: string; to: string } {
  const routeFile = join("data", "current-route.json");
  if (!existsSync(routeFile)) {
    throw new Error("Current route file not found");
  }

  const state = JSON.parse(readFileSync(routeFile, "utf-8"));
  const [from, to] = state.lastRoute.split("-");
  return { from, to };
}

function mergeRouteStats(existing: ProcessedData, current: ProcessedData): ProcessedData {
  // Initialize merged data structure
  const merged: ProcessedData = {
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

  // Merge flight data, keeping most recent entries
  const flightMap = new Map<string, FlightData>();

  // Add existing flights to map
  existing.flights.forEach(flight => {
    const key = `${flight.route.from}-${flight.route.to}-${flight.departureDay}`;
    flightMap.set(key, flight);
  });

  // Add/update with current flights
  current.flights.forEach(flight => {
    const key = `${flight.route.from}-${flight.route.to}-${flight.departureDay}`;
    flightMap.set(key, flight);
  });

  // Convert map back to array
  merged.flights = Array.from(flightMap.values());

  // Recalculate statistics
  const dayStats: { [key: string]: { total: number; count: number } } = {};
  const aheadStats: { [key: string]: { total: number; count: number } } = {};

  merged.flights.forEach(flight => {
    // Process day of week stats
    const day = new Date(flight.departureDay).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayStats[day]) {
      dayStats[day] = { total: 0, count: 0 };
    }
    dayStats[day].total += flight.price;
    dayStats[day].count++;

    // Process days ahead stats
    const bracket = Math.floor(flight.daysAhead / 5) * 5;
    const bracketKey = `${bracket}-${bracket + 4}`;
    if (!aheadStats[bracketKey]) {
      aheadStats[bracketKey] = { total: 0, count: 0 };
    }
    aheadStats[bracketKey].total += flight.price;
    aheadStats[bracketKey].count++;
  });

  // Calculate final averages
  Object.entries(dayStats).forEach(([day, stats]) => {
    merged.metadata.routeStats.dayOfWeekAnalysis.departures[day] = stats.count;
    merged.metadata.routeStats.dayOfWeekAnalysis.averagePrices[day] =
      Math.round(stats.total / stats.count);
  });

  Object.entries(aheadStats).forEach(([bracket, stats]) => {
    merged.metadata.routeStats.daysAheadAnalysis[bracket] = {
      avgPrice: Math.round(stats.total / stats.count),
      count: stats.count
    };
  });

  return merged;
}

try {
  // Get current route
  const { from, to } = getCurrentRoute();
  const routePath = join("data", "routes", `${from}-${to}`, "processed-data.json");

  // Read current route's processed data
  const currentData: ProcessedData = JSON.parse(readFileSync(routePath, "utf-8"));

  // Read existing dashboard data if it exists
  const dashboardPath = join("data", "flights.json");
  let mergedData: ProcessedData;

  if (existsSync(dashboardPath)) {
    const existingData: ProcessedData = JSON.parse(readFileSync(dashboardPath, "utf-8"));
    mergedData = mergeRouteStats(existingData, currentData);
  } else {
    mergedData = currentData;
  }

  // Save updated dashboard data
  writeFileSync(dashboardPath, JSON.stringify(mergedData, null, 2));
  console.log("Dashboard data updated successfully");

} catch (error) {
  console.error("Error updating dashboard data:", error);
  process.exit(1);
}
