import { ElementHandle, Page } from "puppeteer";
interface ButtonInfo {
  element: ElementHandle<Element>;
  boundingBox: { x: number; y: number } | null;
}
export async function findButtonByPosition(
  page: Page,
): Promise<ElementHandle<Element> | null> {
  try {
    const elements = await page.$$(
      'button, [role="button"], a[href], [tabindex="0"]',
    );

    if (elements.length === 0) return null;

    const elementInfos = await Promise.all(
      elements.map(async (element): Promise<ButtonInfo> => {
        const boundingBox = await element.boundingBox();
        return {
          element,
          boundingBox: boundingBox
            ? { x: boundingBox.x, y: boundingBox.y }
            : null,
        };
      }),
    );

    const visibleElements = elementInfos
      .filter(
        (
          info,
        ): info is ButtonInfo & {
          boundingBox: NonNullable<ButtonInfo["boundingBox"]>;
        } => info.boundingBox !== null,
      )
      .sort((a, b) => {
        const aBox = a.boundingBox;
        const bBox = b.boundingBox;
        return Math.abs(aBox.y - bBox.y) > 50
          ? bBox.y - aBox.y // Bottom first
          : bBox.x - aBox.x; // Right first
      });

    if (visibleElements.length > 0) {
      console.info("Using bottom-right element as search button");
      return visibleElements[0].element;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error finding button by position: ${error.message}`);
    }
  }
  return null;
}
