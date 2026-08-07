import { pn, amountToString, btcToSatsString } from './prettyNumbers';

describe('pn', () => {
  it('adds thousand separators', () => {
    expect(pn(1012540)).toBe('1,012,540');
  });
});

describe('amountToString', () => {
  it('rounds fiat amounts to 4 significant figures by default', () => {
    expect(amountToString('1234.5678', false, 0, 0)).toBe('1,235');
  });
});

describe('btcToSatsString', () => {
  it('renders the exact integer Sats, without significant-figure rounding', () => {
    expect(btcToSatsString(0.0101254, false, 0, 0)).toBe('1,012,540');
  });

  it('rounds floating-point conversion artifacts to whole Sats', () => {
    expect(btcToSatsString(0.001, false, 0, 0)).toBe('100,000');
  });

  it('renders ranges as exact Sats bounds', () => {
    expect(btcToSatsString(0, true, 0.001, 0.0025)).toBe('100,000-250,000');
  });
});
