/**
 * Returns a string function for getting text content from a DOM element
 */
export function getTextFunction(): string {
  return `
    function getText(element) {
      return element?.textContent?.trim() || null;
    }
  `;
}
