import { splitConcatenatedNames } from "./split-concatenated-names";


export function addAirlineName(airlineNames: string[], text: string): void {
  if (!text) return;

  // Split any concatenated names and add each one if not already in the list
  const names = splitConcatenatedNames(text);
  for (const name of names) {
    if (name && !airlineNames.includes(name)) {
      airlineNames.push(name);
    }
  }
}
