import {
  type BrowserPsbtSignResult,
  generateTaprootKeypair,
  getBrowserPsbtSigner,
  isLikelyPsbt,
  normalizePsbt,
  signPsbtWithBrowserWallet,
  type TaprootBrowserWindow,
} from './taproot';

const MIN_PSBT_HEX = '70736274ff00';
const MIN_PSBT_BASE64 = 'cHNidP8A';

describe('taproot utils', () => {
  it('normalizes base64 and hex PSBT encodings', () => {
    expect(normalizePsbt(MIN_PSBT_BASE64, 'base64')).toBe(MIN_PSBT_BASE64);
    expect(normalizePsbt(MIN_PSBT_BASE64, 'hex')).toBe(MIN_PSBT_HEX);
    expect(normalizePsbt(MIN_PSBT_HEX, 'base64')).toBe(MIN_PSBT_BASE64);
  });

  it('validates likely PSBT values', () => {
    expect(isLikelyPsbt(MIN_PSBT_BASE64)).toBe(true);
    expect(isLikelyPsbt(MIN_PSBT_HEX)).toBe(true);
    expect(isLikelyPsbt('deadbeef')).toBe(false);
  });

  it('generates deterministic taproot keypair from provided secret', () => {
    const secret = new Uint8Array(32);
    secret[31] = 1;
    const keypair = generateTaprootKeypair(secret);

    expect(keypair.privateKeyHex).toBe(
      '0000000000000000000000000000000000000000000000000000000000000001',
    );
    expect(keypair.xOnlyPubkeyHex).toBe(
      '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    );
  });

  it('prefers unisat signer when multiple providers are available', () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const okxSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = {
      unisat: { signPsbt: unisatSignPsbt },
      okxwallet: { bitcoin: { signPsbt: okxSignPsbt } },
    };

    const signer = getBrowserPsbtSigner(browserWindow);
    expect(signer?.kind).toBe('unisat');
  });

  it('honors preferred signer when available', () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const okxSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = {
      unisat: { signPsbt: unisatSignPsbt },
      okxwallet: { bitcoin: { signPsbt: okxSignPsbt } },
    };

    const signer = getBrowserPsbtSigner(browserWindow, 'okx');
    expect(signer?.kind).toBe('okx');
  });

  it('falls back to available signer when preferred signer is missing', () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = { unisat: { signPsbt: unisatSignPsbt } };

    const signer = getBrowserPsbtSigner(browserWindow, 'okx');
    expect(signer?.kind).toBe('unisat');
  });

  it('signs PSBT with detected browser wallet and returns base64', async () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = { unisat: { signPsbt: unisatSignPsbt } };

    const signed = await signPsbtWithBrowserWallet(MIN_PSBT_BASE64, undefined, browserWindow);

    expect(unisatSignPsbt).toHaveBeenCalledWith(MIN_PSBT_HEX, undefined);
    expect(signed).toBe(MIN_PSBT_BASE64);
  });

  it('signs PSBT with preferred signer', async () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const okxSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = {
      unisat: { signPsbt: unisatSignPsbt },
      okxwallet: { bitcoin: { signPsbt: okxSignPsbt } },
    };

    const signed = await signPsbtWithBrowserWallet(MIN_PSBT_BASE64, undefined, browserWindow, 'okx');

    expect(okxSignPsbt).toHaveBeenCalledWith(MIN_PSBT_HEX, undefined);
    expect(unisatSignPsbt).not.toHaveBeenCalled();
    expect(signed).toBe(MIN_PSBT_BASE64);
  });

  it('passes signing options through to the wallet signer', async () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue(MIN_PSBT_HEX);
    const browserWindow: TaprootBrowserWindow = { unisat: { signPsbt: unisatSignPsbt } };
    const options = { autoFinalized: false, toSignInputs: [{ index: 0 }] };

    await signPsbtWithBrowserWallet(MIN_PSBT_BASE64, options, browserWindow);

    expect(unisatSignPsbt).toHaveBeenCalledWith(MIN_PSBT_HEX, options);
  });

  it('accepts object-shaped wallet signer responses', async () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue({ psbtHex: MIN_PSBT_HEX });
    const browserWindow: TaprootBrowserWindow = { unisat: { signPsbt: unisatSignPsbt } };

    const signed = await signPsbtWithBrowserWallet(MIN_PSBT_BASE64, undefined, browserWindow);

    expect(signed).toBe(MIN_PSBT_BASE64);
  });

  it('throws when wallet signer returns unsupported response shape', async () => {
    const unisatSignPsbt = jest
      .fn<Promise<BrowserPsbtSignResult>, [string]>()
      .mockResolvedValue({} as BrowserPsbtSignResult);
    const browserWindow: TaprootBrowserWindow = { unisat: { signPsbt: unisatSignPsbt } };

    await expect(signPsbtWithBrowserWallet(MIN_PSBT_BASE64, undefined, browserWindow)).rejects.toThrow(
      'Browser wallet returned an unsupported PSBT response shape',
    );
  });

  it('throws when no signer is available', async () => {
    await expect(signPsbtWithBrowserWallet(MIN_PSBT_BASE64, undefined, {})).rejects.toThrow(
      'No compatible browser PSBT signer detected',
    );
  });
});
