// sort of cryptographically strong function to generate Base62 token client-side
export function genBase62Token(length) {
  return window
    .btoa(
      Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
        .map((b) => String.fromCharCode(b))
        .join(''),
    )
    .replace(/[+/]/g, '')
    .substring(0, length);
}

export function tokenStrength(token) {
  const characters = token.split('').reduce(function (obj, s) {
    obj[s] = (obj[s] || 0) + 1;
    return obj;
  }, {});
  return { uniqueValues: Object.keys(characters).length, counts: Object.values(characters) };
}
