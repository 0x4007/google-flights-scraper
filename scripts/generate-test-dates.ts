#!/usr/bin/env bun

interface WeekTrip {
  departure: Date;
  return: Date;
  daysAhead: number;
  departureDay: string;
}

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Generate dates for the next 90 days
function generateDates(): WeekTrip[] {
  const trips: WeekTrip[] = [];
  const today = new Date();
  const maxDays = 90;

  // Look ahead up to maxDays
  for (let daysAhead = 1; daysAhead <= maxDays; daysAhead++) {
    const departureDate = new Date(today);
    departureDate.setDate(today.getDate() + daysAhead);

    // Create a week-long trip
    const returnDate = new Date(departureDate);
    returnDate.setDate(departureDate.getDate() + 7);

    trips.push({
      departure: departureDate,
      return: returnDate,
      daysAhead,
      departureDay: weekDays[departureDate.getDay()]
    });
  }

  return trips;
}

const trips = generateDates();

// Write dates to a file
const formatDate = (date: Date) => date.toISOString().split("T")[0];
const output = trips.map(trip => `${formatDate(trip.departure)}|${formatDate(trip.return)}`).join("\n");

console.log(output);
