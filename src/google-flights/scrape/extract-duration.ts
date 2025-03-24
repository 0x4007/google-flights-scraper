import { getText } from "./get-text";


export function extractDuration(flightElement: Element): null | string {
  // Look for text matching pattern "X hr Y min"
  const durationDiv = Array.from(
    flightElement.querySelectorAll("div")
  ).find((div) => {
    const text = getText(div);
    return text && /^\d+\s*hr\s*(?:\d+\s*min)?$/.test(text);
  });

  return durationDiv ? getText(durationDiv) : null;
}
