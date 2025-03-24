
/**
 * Returns a function string for finding price elements on the page.
 * This is used within page.waitForFunction to wait until prices appear.
 */
export function findPriceElements(): string {
  return `function() {
    // Look for elements with dollar values in aria-labels or content
    const priceElements = document.querySelectorAll('span[data-gs][aria-label*="US dollars"], span[aria-label*="US dollars"]');

    // Also check for dollar signs in text
    const dollarTextElements = Array.from(document.querySelectorAll('div, span'))
      .filter(el => el.textContent?.includes('$'));

    return priceElements.length > 0 || dollarTextElements.length > 0;
  }`;
}
