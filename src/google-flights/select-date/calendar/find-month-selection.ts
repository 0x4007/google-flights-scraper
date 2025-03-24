import { ElementHandle } from "puppeteer";

export async function findMonthSection(
  section: ElementHandle<Element>,
  month: string,
): Promise<boolean> {
  try {
    const monthName = await section.$eval(
      "div:first-child",
      (el) => el.textContent?.trim() ?? "",
    );
    return monthName.includes(month);
  } catch (error) {
    console.error(`Error finding month section: ${error}`);
    return false;
  }
}
