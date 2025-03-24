
export function splitConcatenatedNames(text: string): string[] {
  if (!text) return [];

  // First handle comma-separated parts
  if (text.includes(",")) {
    return text
      .split(",")
      .map((part) => part.trim())
      .flatMap((part) => splitConcatenatedNames(part))
      .filter(Boolean);
  }

  // Look for camelCase patterns (lowercase followed by uppercase)
  const splitPoints: number[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    // Check if current char is lowercase and next char is uppercase
    if (/[a-z]/.test(text[i]) && /[A-Z]/.test(text[i + 1])) {
      splitPoints.push(i + 1);
    }
  }

  // If no split points found, return the original text
  if (splitPoints.length === 0) {
    return [text];
  }

  // Split the text at the identified points
  const result: string[] = [];
  let startIndex = 0;

  for (const splitPoint of splitPoints) {
    const part = text.substring(startIndex, splitPoint).trim();
    if (part) result.push(part);
    startIndex = splitPoint;
  }

  // Add the last part
  const lastPart = text.substring(startIndex).trim();
  if (lastPart) result.push(lastPart);

  return result;
}
