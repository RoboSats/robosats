import { generateSecretKey, getPublicKey } from 'nostr-tools';

const PSBT_MAGIC = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff]);

export interface TaprootKeypair {
  privateKeyHex: string;
  xOnlyPubkeyHex: string;
}

export interface PsbtToSignInput {
  index: number;
  address?: string;
  publicKey?: string;
  sighashTypes?: number[];
  disableTweakSigner?: boolean;
}

export interface BrowserPsbtSignOptions {
  autoFinalized?: boolean;
  toSignInputs?: PsbtToSignInput[];
}

export interface BrowserPsbtSignResultObject {
  psbt?: string;
  psbtHex?: string;
  signedPsbt?: string;
  hex?: string;
}

export type BrowserPsbtSignResult = string | BrowserPsbtSignResultObject;

interface UnisatProvider {
  signPsbt: (
    psbtHex: string,
    options?: BrowserPsbtSignOptions,
  ) => Promise<BrowserPsbtSignResult>;
}

interface OkxBitcoinProvider {
  signPsbt: (
    psbtHex: string,
    options?: BrowserPsbtSignOptions,
  ) => Promise<BrowserPsbtSignResult>;
}

export interface TaprootBrowserWindow {
  unisat?: UnisatProvider;
  okxwallet?: {
    bitcoin?: OkxBitcoinProvider;
  };
}

export type BrowserPsbtSignerKind = 'unisat' | 'okx';

export interface BrowserPsbtSigner {
  kind: BrowserPsbtSignerKind;
  signPsbt: (
    psbtHex: string,
    options?: BrowserPsbtSignOptions,
  ) => Promise<BrowserPsbtSignResult>;
}

const isSignPsbtFn = (
  signPsbt: UnisatProvider['signPsbt'] | OkxBitcoinProvider['signPsbt'] | undefined,
): signPsbt is UnisatProvider['signPsbt'] => typeof signPsbt === 'function';

const resolveSigner = (
  kind: BrowserPsbtSignerKind,
  browserWindow: TaprootBrowserWindow,
): BrowserPsbtSigner | null => {
  if (kind === 'unisat' && isSignPsbtFn(browserWindow.unisat?.signPsbt)) {
    return {
      kind: 'unisat',
      signPsbt: browserWindow.unisat.signPsbt.bind(browserWindow.unisat),
    };
  }

  if (kind === 'okx' && isSignPsbtFn(browserWindow.okxwallet?.bitcoin?.signPsbt)) {
    return {
      kind: 'okx',
      signPsbt: browserWindow.okxwallet.bitcoin.signPsbt.bind(browserWindow.okxwallet.bitcoin),
    };
  }

  return null;
};

const hasPsbtMagic = (bytes: Uint8Array): boolean => {
  if (bytes.length < PSBT_MAGIC.length) return false;
  return PSBT_MAGIC.every((value, index) => bytes[index] === value);
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hexToBytes = (hex: string): Uint8Array | null => {
  const trimmed = hex.trim().toLowerCase().replace(/^0x/, '');
  if (trimmed.length === 0 || trimmed.length % 2 !== 0 || /[^0-9a-f]/.test(trimmed)) return null;

  const bytes = new Uint8Array(trimmed.length / 2);
  for (let i = 0; i < trimmed.length; i += 2) {
    bytes[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
  }
  return bytes;
};

const base64ToBytes = (base64: string): Uint8Array | null => {
  try {
    const normalized = base64.trim();
    if (normalized.length === 0) return null;

    const maybeBuffer = (globalThis as { Buffer?: typeof Buffer }).Buffer;
    if (maybeBuffer !== undefined) {
      return Uint8Array.from(maybeBuffer.from(normalized, 'base64'));
    }

    if (typeof atob !== 'function') return null;
    const binary = atob(normalized);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  const maybeBuffer = (globalThis as { Buffer?: typeof Buffer }).Buffer;
  if (maybeBuffer !== undefined) {
    return maybeBuffer.from(bytes).toString('base64');
  }

  if (typeof btoa !== 'function') {
    throw new Error('Base64 encoder unavailable in this environment');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const parsePsbtBytes = (psbt: string): Uint8Array | null => {
  const fromBase64 = base64ToBytes(psbt);
  if (fromBase64 !== null && hasPsbtMagic(fromBase64)) return fromBase64;

  const fromHex = hexToBytes(psbt);
  if (fromHex !== null && hasPsbtMagic(fromHex)) return fromHex;

  return null;
};

const getBrowserWindow = (): TaprootBrowserWindow | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window as unknown as TaprootBrowserWindow;
};

export const isLikelyPsbt = (psbt: string): boolean => parsePsbtBytes(psbt) !== null;

export const normalizePsbt = (psbt: string, output: 'base64' | 'hex' = 'base64'): string => {
  const parsed = parsePsbtBytes(psbt);
  if (parsed === null) {
    throw new Error('Invalid PSBT format. Expected base64 or hex with PSBT magic bytes.');
  }

  return output === 'hex' ? bytesToHex(parsed) : bytesToBase64(parsed);
};

const extractSignedPsbt = (result: BrowserPsbtSignResult): string | null => {
  if (typeof result === 'string') return result;
  if (result === null || typeof result !== 'object') return null;

  const psbtLike =
    result.psbt ?? result.psbtHex ?? result.signedPsbt ?? result.hex;

  return typeof psbtLike === 'string' && psbtLike.trim().length > 0 ? psbtLike : null;
};

export const generateTaprootKeypair = (secretKey?: Uint8Array): TaprootKeypair => {
  const privateKeyBytes = secretKey ?? generateSecretKey();
  if (privateKeyBytes.length !== 32) {
    throw new Error('Taproot secret key must be 32 bytes');
  }

  return {
    privateKeyHex: bytesToHex(privateKeyBytes),
    xOnlyPubkeyHex: getPublicKey(privateKeyBytes),
  };
};

export const getBrowserPsbtSigner = (
  browserWindow: TaprootBrowserWindow | undefined = getBrowserWindow(),
  preferredSigner?: BrowserPsbtSignerKind,
): BrowserPsbtSigner | null => {
  if (browserWindow === undefined) return null;

  if (preferredSigner !== undefined) {
    const preferred = resolveSigner(preferredSigner, browserWindow);
    if (preferred !== null) return preferred;
  }

  const unisat = resolveSigner('unisat', browserWindow);
  if (unisat !== null) return unisat;

  const okx = resolveSigner('okx', browserWindow);
  if (okx !== null) return okx;

  return null;
};

export const signPsbtWithBrowserWallet = async (
  psbt: string,
  options?: BrowserPsbtSignOptions,
  browserWindow: TaprootBrowserWindow | undefined = getBrowserWindow(),
  preferredSigner?: BrowserPsbtSignerKind,
): Promise<string> => {
  const signer = getBrowserPsbtSigner(browserWindow, preferredSigner);
  if (signer === null) {
    throw new Error('No compatible browser PSBT signer detected');
  }

  const psbtHex = normalizePsbt(psbt, 'hex');
  const signedResult = await signer.signPsbt(psbtHex, options);
  const signedPsbt = extractSignedPsbt(signedResult);
  if (signedPsbt === null) {
    throw new Error('Browser wallet returned an unsupported PSBT response shape');
  }

  return normalizePsbt(signedPsbt, 'base64');
};
