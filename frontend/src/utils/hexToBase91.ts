import { Base91 } from 'base-ex';

export default function hexToBase85(hex: string): string {
  const byteArray = hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16));
  const b91 = new Base91();
  const base91string = b91.encode(new Uint8Array(byteArray));
  return base91string;
}
