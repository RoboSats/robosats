// sort of cryptographically strong function to generate Base62 token client-side
export function genBase62Token(length: number): string {
  return window
    .btoa(
      Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
        .map((b) => String.fromCharCode(b))
        .join(''),
    )
    .replace(/[+/]/g, '')
    .substring(0, length);
}

interface TokenEntropy {
  hasEnoughEntropy: boolean;
  bitsEntropy: number;
  shannonEntropy: number;
}

export function validateTokenEntropy(token: string): TokenEntropy {
  const charCounts: Record<string, number> = {};
  const len = token.length;
  let shannonEntropy = 0;

  // Count number of occurrences of each character
  for (let i = 0; i < len; i++) {
    const char = token.charAt(i);
    if (charCounts[char] != null) {
      charCounts[char]++;
    } else {
      charCounts[char] = 1;
    }
  }
  // Calculate the entropy
  Object.keys(charCounts).forEach((char) => {
    const probability = charCounts[char] / len;
    shannonEntropy -= probability * Math.log2(probability);
  });

  const uniqueChars = Object.keys(charCounts).length;
  const bitsEntropy = Math.log2(Math.pow(uniqueChars, len));

  const hasEnoughEntropy = bitsEntropy > 128 && shannonEntropy > 4;

  return { hasEnoughEntropy, bitsEntropy, shannonEntropy };
}
