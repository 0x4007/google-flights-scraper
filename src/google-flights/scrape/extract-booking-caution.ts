import { getText } from "./get-text";

// Helper functions to extract specific flight details

export function extractBookingCaution(flightElement: Element): string | null {
  const bookingCautionElements = flightElement.querySelectorAll("span");
  for (const el of Array.from(bookingCautionElements)) {
    const text = getText(el);
    if (!text) continue;

    if (text.includes("Self transfer")) {
      return "Self transfer";
    }
    if (text.includes("Separate tickets")) {
      return "Separate tickets booked together";
    }
  }
  return null;
}
