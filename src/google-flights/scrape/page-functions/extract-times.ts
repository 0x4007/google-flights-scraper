/**
 * Returns a string function for extracting departure and arrival times
 */
export function extractTimesFunction(): string {
  return `
    function extractTimes(flightElement) {
      let departureTime = null;
      let arrivalTime = null;

      // Look for elements with time patterns (12:30 PM)
      const timeElements = Array.from(flightElement.querySelectorAll("div, span"))
        .filter(el => /^\\d{1,2}:\\d{2}\\s*(?:AM|PM)$/.test(el.textContent?.trim() || ""))
        .map(el => el.textContent?.trim() || "");

      if (timeElements.length >= 2) {
        departureTime = timeElements[0];
        arrivalTime = timeElements[1];
      } else if (timeElements.length === 1) {
        departureTime = timeElements[0];
      }

      return { departureTime, arrivalTime };
    }
  `;
}
