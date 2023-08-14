import { Base16, Base91 } from 'base-ex';

export default function hexToBase91(hex: string): string {
  const b16 = new Base16();
  const b91 = new Base91();
  const base91string = b91.encode(b16.decode(hex));
  return base91string;
}
