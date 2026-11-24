import { checkVer, getClientVersion, getHigherVer } from '../checkVer';

jest.mock('../../../package.json', () => ({ version: '1.2.3' }));

describe('getClientVersion', () => {
  it('parses the package version', () => {
    expect(getClientVersion().semver).toEqual({ major: 1, minor: 2, patch: 3 });
  });
});

describe('checkVer', () => {
  it('flags a newer minor version on the same major', () => {
    expect(checkVer({ major: 1, minor: 3, patch: 0 })).toBe(true);
  });

  it('flags a newer major version', () => {
    expect(checkVer({ major: 2, minor: 0, patch: 0 })).toBe(true);
  });

  it('does not flag the same version or a newer patch', () => {
    expect(checkVer({ major: 1, minor: 2, patch: 3 })).toBe(false);
    expect(checkVer({ major: 1, minor: 2, patch: 9 })).toBe(false);
  });

  it('does not flag an older minor version', () => {
    expect(checkVer({ major: 1, minor: 1, patch: 9 })).toBe(false);
  });

  it('does not flag an older major version with a higher minor', () => {
    expect(checkVer({ major: 0, minor: 9, patch: 0 })).toBe(false);
  });

  it('does not flag missing version parts', () => {
    expect(checkVer({ major: null, minor: null, patch: null })).toBe(false);
  });
});

describe('getHigherVer', () => {
  it('returns the higher version by major, then minor, then patch', () => {
    expect(
      getHigherVer({ major: 1, minor: 0, patch: 0 }, { major: 0, minor: 9, patch: 9 }),
    ).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(
      getHigherVer({ major: 0, minor: 8, patch: 1 }, { major: 0, minor: 9, patch: 0 }),
    ).toEqual({ major: 0, minor: 9, patch: 0 });
    expect(
      getHigherVer({ major: 0, minor: 8, patch: 2 }, { major: 0, minor: 8, patch: 1 }),
    ).toEqual({ major: 0, minor: 8, patch: 2 });
  });
});
