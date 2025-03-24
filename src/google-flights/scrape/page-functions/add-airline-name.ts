/**
 * Returns a string function for adding an airline name to an array, avoiding duplicates
 */
export function addAirlineNameFunction(): string {
  return `
    function addAirlineName(airlines, name) {
      // Clean the name and check if it's a valid airline
      if (name && !isNonAirlineText(name) && !airlines.includes(name)) {
        airlines.push(name);
      }
    }
  `;
}
