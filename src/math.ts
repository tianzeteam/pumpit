/**
 * Adds two numbers and returns the result.
 * @param a - The first number.
 * @param b - The second number.
 * @returns The sum of the two numbers.
 */
export function add(a: number, b: number): number {
  return a + b;
}

export function filterIn(sourceArray: string[], targetArray: string[]): string[]{

  return sourceArray.filter(item => targetArray.includes(item));
}