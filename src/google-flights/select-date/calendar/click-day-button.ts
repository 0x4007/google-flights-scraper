export async function clickDayButton(button: ElementHandle<Element>, day: number): Promise<boolean> {
    try {
      const dayText = await button.$eval("div:first-child", (el) => el.textContent?.trim() ?? "");
      if (dayText === String(day)) {

        await button.click();
        return true;
      }
    } catch (error) {
      if (error instanceof Error) {

      }
    }
    return false;
  }