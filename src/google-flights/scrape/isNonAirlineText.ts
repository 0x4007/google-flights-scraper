
export function isNonAirlineText(text: string): boolean {
  return (
    text.includes("Nonstop") ||
    text.includes("stop") ||
    text.includes("hr") ||
    text.includes("min") ||
    text.includes("Self transfer") ||
    text.includes("Separate tickets") ||
    text.includes("multiple airlines") ||
    text.includes("Missed connections") ||
    text.includes("Price unavailable") ||
    text.includes("Departure") ||
    text.includes("Unknown emissions") ||
    /^[A-Z]{3}/.test(text) || // Skip airport codes (3 uppercase letters)
    text.includes("International Airport") ||
    text.includes("Airport") ||
    text.includes("Wed,") ||
    text.includes("Thu,") ||
    text.includes("Fri,") ||
    text.includes("Sat,") ||
    text.includes("Sun,") ||
    text.includes("Mon,") ||
    text.includes("Tue,") ||
    /\d{4}/.test(text) || // Skip years
    /\d{1,2}:\d{2}/.test(text) ||
    text.includes("CO2") ||
    text.includes("kg") ||
    text.includes("emissions") ||
    text.includes("Avoids") ||
    text.includes("trees absorb") ||
    text.includes("+") ||
    text.includes("%")
  ); // Skip times
}
