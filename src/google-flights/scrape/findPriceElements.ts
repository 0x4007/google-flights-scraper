export function findPriceElements(): string | (() => boolean) {
  return () => {
    // Look for any element with price information ($ sign or "dollars" text)
    const priceElements = Array.from(
      document.querySelectorAll("*")
    ).filter((el) => {
      const text = el.textContent || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      return (
        text.includes("$") ||
        ariaLabel.includes("dollars") ||
        text.includes("USD")
      );
    });

    return priceElements.length > 0;
  };
}
