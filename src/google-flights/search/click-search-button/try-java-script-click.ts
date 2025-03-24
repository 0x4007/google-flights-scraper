import { ElementHandle, Page } from "puppeteer";

export async function tryJavaScriptClick(
  page: Page,
  button: ElementHandle<Element>,
): Promise<boolean> {
  try {
    await page.evaluate((element: Element) => {
      if (!(element instanceof HTMLElement)) return;

      function clickElement(el: HTMLElement) {
        el.click();
        el.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          }),
        );
      }

      // Try clicking the element itself
      clickElement(element);

      // Try parent button elements
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        if (
          parent instanceof HTMLElement &&
          (parent.tagName === "BUTTON" ||
            parent.getAttribute("role") === "button")
        ) {
          clickElement(parent);
          break;
        }
      }

      // Try child button elements
      const childButton = element.querySelector('button, [role="button"]');
      if (childButton instanceof HTMLElement) {
        clickElement(childButton);
      }

      // Try submitting parent forms
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        if (parent instanceof HTMLFormElement) {
          parent.submit();
          break;
        }
      }
    }, button);
    console.info("Clicked search button with JavaScript");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`JavaScript click failed: ${error.message}`);
    }
    return false;
  }
}
