import { getText } from "./getText";


export function extractAirports(flightElement: Element): {
  origin: string | null;
  destination: string | null;
} {
  // Look for airport codes like "ICN" and "NRT"
  const airportDivs = Array.from(
    flightElement.querySelectorAll("div > div")
  ).filter((div) => /^[A-Z]{3}$/.test(div.textContent?.trim() || ""));

  let origin = null;
  let destination = null;

  if (airportDivs.length >= 2) {
    // Find the first distinct pair of airport codes
    for (let i = 0; i < airportDivs.length - 1; i++) {
      const code1 = getText(airportDivs[i]);
      const code2 = getText(airportDivs[i + 1]);

      if (code1 && code2 && code1 !== code2) {
        origin = code1;
        destination = code2;
        break;
      }
    }

    // If no distinct pair was found, just use the first two
    if (!origin || !destination) {
      origin = getText(airportDivs[0]);
      destination = getText(airportDivs[1]);
    }
  }

  return { origin, destination };
}
