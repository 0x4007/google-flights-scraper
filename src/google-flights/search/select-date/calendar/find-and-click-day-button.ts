import { ElementHandle } from "puppeteer";
import { clickDayButton } from "./click-day-button";

export async function findAndClickDayButton(
  section: ElementHandle<Element>,
  day: number,
): Promise<boolean> {
  const dayButtons = await section.$$('div[role="button"]');

  for (const button of dayButtons) {
    if (await clickDayButton(button, day)) {
      return true;
    }
  }
  return false;
}
