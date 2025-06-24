export default function hashStringToInteger(input: string): number {
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i); // Hashing algorithm
    hash |= 0; // Convert to 32-bit integer
  }

  return Math.abs(hash); // Return a positive integer
}
