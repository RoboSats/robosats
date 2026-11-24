import weightedMean from '../weightedMean';

describe('weightedMean', () => {
  it('returns 0 for empty input', () => {
    expect(weightedMean([], [])).toBe(0);
  });

  it('computes the weighted average', () => {
    expect(weightedMean([1, 3], [1, 3])).toBeCloseTo(2.5);
    expect(weightedMean([10, 20], [1, 1])).toBe(15);
  });

  it('ignores values whose weight is zero', () => {
    expect(weightedMean([5, 100], [2, 0])).toBe(5);
  });

  it('returns 0 instead of NaN when every weight is zero', () => {
    expect(weightedMean([1.2, 0.5], [0, 0])).toBe(0);
  });

  it('returns 0 instead of NaN when weights sum to zero', () => {
    expect(weightedMean([4], [0])).toBe(0);
  });
});
