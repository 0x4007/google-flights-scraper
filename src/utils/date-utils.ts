export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDefaultDates(): { departure: string; return: string } {
  const now = new Date();

  // Set departure to 1 week from now
  const departureDate = new Date(now);
  departureDate.setDate(now.getDate() + 7);

  // Set return to 2 weeks from now
  const returnDate = new Date(now);
  returnDate.setDate(now.getDate() + 14);

  return {
    departure: formatDate(departureDate),
    return: formatDate(returnDate)
  };
}
