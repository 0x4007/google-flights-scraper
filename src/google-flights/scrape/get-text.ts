// Helper function to extract text content safely
export function getText(element: Element | null): null | string {
  return element?.textContent?.trim() ?? null;
}
