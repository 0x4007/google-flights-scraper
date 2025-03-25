#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface RouteMetrics {
  frequency: {
    dailyFlights: number;
    weeklyPattern: {
      weekday: number;
      weekend: number;
    };
    score: number;
  };
  competition: {
    carriers: number;
    lowCostPresence: number;
    directFlights: number;
    score: number;
  };
  demand: {
    searchVolume: number;
    seasonalDemand: {
      spring: number;
      summer: number;
      fall: number;
      winter: number;
    };
    score: number;
  };
  seasonality: {
    currentSeason: string;
    peakSeason: string;
    offPeakAdjustment: number;
    score: number;
  };
}

interface Route {
  from: string;
  to: string;
  baseScore: number;
  metrics: RouteMetrics;
}

interface RoutesConfig {
  routes: Route[];
  metadata: {
    lastUpdated: string;
    version: string;
    activeRotation: boolean;
    rotationInterval: string;
    scoringVersion: string;
  };
}

// Read current route state
function getCurrentRouteState(): { lastRoute: string; lastUpdated: string } {
  const routeFile = join("data", "current-route.json");
  if (!existsSync(routeFile)) {
    return {
      lastRoute: "",
      lastUpdated: new Date(0).toISOString()
    };
  }

  const state = readFileSync(routeFile, "utf-8");
  return JSON.parse(state);
}

// Save current route state
function saveRouteState(route: Route): void {
  const state = {
    lastRoute: `${route.from}-${route.to}`,
    lastUpdated: new Date().toISOString()
  };
  writeFileSync(join("data", "current-route.json"), JSON.stringify(state, null, 2));
}

// Get next route in rotation
function getNextRoute(routes: Route[], lastRoute: string): Route {
  const currentIndex = routes.findIndex(
    route => `${route.from}-${route.to}` === lastRoute
  );

  // If last route not found or was last in list, start from beginning
  const nextIndex = currentIndex === -1 || currentIndex === routes.length - 1
    ? 0
    : currentIndex + 1;

  return routes[nextIndex];
}

// Main execution
try {
  // Read routes configuration
  const config: RoutesConfig = JSON.parse(
    readFileSync(join("data", "routes.json"), "utf-8")
  );

  // Sort routes by base score in descending order
  const sortedRoutes = [...config.routes].sort((a, b) => b.baseScore - a.baseScore);

  // Get current state
  const state = getCurrentRouteState();

  // Get next route
  const route = getNextRoute(sortedRoutes, state.lastRoute);

  // Save new state
  saveRouteState(route);

  // Output route as JSON for GitHub Actions
  console.log(JSON.stringify(route));
} catch (error) {
  console.error("Error getting current route:", error);
  process.exit(1);
}
