import { addAirlineName } from "./addAirlineName";
import { getText } from "./getText";
import { isNonAirlineText } from "./isNonAirlineText";


export function extractAirlineNames(flightElement: Element): string[] {
  const airlineNames: string[] = [];
  const airlineElements = flightElement.querySelectorAll(
    "div > div > span:not([aria-label]), div > span:not([aria-label])"
  );

  for (const el of Array.from(airlineElements)) {
    const text = getText(el);
    if (!text || isNonAirlineText(text)) continue;

    // Clean up and add the airline name
    const cleanedText = text.trim();
    addAirlineName(airlineNames, cleanedText);
  }

  return airlineNames;
}
