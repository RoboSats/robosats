export default function hexToRgb(c: string): string[] | undefined {
  if (c.includes('rgb')) {
    const vals = c.split('(')[1].split(')')[0];
    return vals.split(',');
  }
  if (/^#([a-f0-9]{3}){1,2}$/.test(c)) {
    if (c.length === 4) {
      c = '#' + [c[1], c[1], c[2], c[2], c[3], c[3]].join('');
    }
    c = '0x' + c.substring(1);
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  }
}
