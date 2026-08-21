/**
 * Minimal ambient type declarations for libraries that ship no types.
 * Only the members actually used in this codebase are declared.
 * Prefer installing @types/{pkg} or vendor types when available;
 * update these stubs if new members are used.
 */

// react-smooth-image — used in RobotAvatar as <SmoothImage src={...} imageStyles={...} />
declare module 'react-smooth-image' {
  import React from 'react';
  interface SmoothImageProps {
    src?: string;
    imageStyles?: React.CSSProperties;
    [key: string]: unknown;
  }
  const SmoothImage: React.FC<SmoothImageProps>;
  export default SmoothImage;
}

// base-ex — used in utils/hexToBase91.ts via new Base16() / new Base91()
declare module 'base-ex' {
  class Base16 {
    decode(input: string): Uint8Array;
    encode(input: Uint8Array | string): string;
  }
  class Base91 {
    decode(input: string): Uint8Array;
    encode(input: Uint8Array | string): string;
  }
  export { Base16, Base91 };
}
