export async function findMonthSection(section: ElementHandle<Element>, month: string): Promise<boolean> {
    try {
      const monthName = await section.$eval("div:first-child", (el) => el.textContent?.trim() ?? "");
      return monthName.includes(month);
    } catch (error) {

      return false;
    }
  }