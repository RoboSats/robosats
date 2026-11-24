import hexToRgb from '../hexToRgb';

describe('hexToRgb', () => {
  it('converts six digit lowercase hex', () => {
    expect(hexToRgb('#ff8000')).toEqual(['255', '128', '0']);
  });

  it('converts six digit uppercase and mixed case hex', () => {
    expect(hexToRgb('#FF8000')).toEqual(['255', '128', '0']);
    expect(hexToRgb('#Ff80aB')).toEqual(['255', '128', '171']);
  });

  it('expands three digit hex in any case', () => {
    expect(hexToRgb('#fff')).toEqual(['255', '255', '255']);
    expect(hexToRgb('#FFF')).toEqual(['255', '255', '255']);
    expect(hexToRgb('#0aF')).toEqual(['0', '170', '255']);
  });

  it('splits rgb strings into their channel values', () => {
    expect(hexToRgb('rgb(1,2,3)')).toEqual(['1', '2', '3']);
  });

  it('returns undefined for invalid input', () => {
    expect(hexToRgb('#ggg')).toBeUndefined();
    expect(hexToRgb('#ffff')).toBeUndefined();
    expect(hexToRgb('red')).toBeUndefined();
  });
});
