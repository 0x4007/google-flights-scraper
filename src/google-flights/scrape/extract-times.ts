import { getText } from "./get-text";


export function extractTimes(flightElement: Element): {
  departureTime: null | string;
  arrivalTime: null | string;
} {
  // Find time span elements that match expected format
  const times = Array.from(flightElement.querySelectorAll("div"))
    .filter((el) => {
      const text = getText(el);
      return text && /^\d{1,2}:\d{2}\s*(?:AM|PM)/.test(text);
    })
    .map((el) => {
      // Extract only the time part to clean up the data
      const text = getText(el) || "";
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/);
      return timeMatch ? timeMatch[1] : text;
    });

  // Try to find unique times to avoid duplicates
  const uniqueTimes = Array.from(new Set(times));

  // If we have at least two distinct times, use those
  if (uniqueTimes.length >= 2) {
    const departureTime = uniqueTimes[0] || null;
    const arrivalTime = uniqueTimes[1] || null;
    return { departureTime, arrivalTime };
  }

  // Fallback to original behavior if no other option
  const departureTime = times[0] || null;
  const arrivalTime = times.length > 1 ? times[1] : null;

  return { departureTime, arrivalTime };
}
