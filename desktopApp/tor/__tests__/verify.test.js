'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const {
  loadManifest,
  parseVersionTuple,
  versionSatisfiesMinimum,
  extractVersionFromOutput,
  extractVersionFromStrings,
  checkPlatform,
  checkNonLinuxVersionString,
} = require('../verify');

const VERSIONS_FILE = path.join(__dirname, '..', 'versions.json');
const TOR_DIR = path.join(__dirname, '..');

describe('parseVersionTuple', () => {
  it('splits a dotted version into numbers', () => {
    assert.deepEqual(parseVersionTuple('0.4.9.15'), [0, 4, 9, 15]);
  });
  it('handles two-part version', () => {
    assert.deepEqual(parseVersionTuple('0.4'), [0, 4]);
  });
});

describe('versionSatisfiesMinimum', () => {
  it('accepts exactly the minimum', () => {
    assert.equal(versionSatisfiesMinimum('0.4.9', '0.4.9'), true);
  });
  it('accepts a higher patch', () => {
    assert.equal(versionSatisfiesMinimum('0.4.9.15', '0.4.9'), true);
  });
  it('accepts a higher minor', () => {
    assert.equal(versionSatisfiesMinimum('0.5.0', '0.4.9'), true);
  });
  it('rejects an older series', () => {
    assert.equal(versionSatisfiesMinimum('0.4.8.11', '0.4.9'), false);
  });
  it('rejects a much older version', () => {
    assert.equal(versionSatisfiesMinimum('0.3.5.17', '0.4.9'), false);
  });
  it('rejects 0.4.8 against minimum 0.4.9', () => {
    assert.equal(versionSatisfiesMinimum('0.4.8', '0.4.9'), false);
  });
});

describe('extractVersionFromOutput', () => {
  it('parses tor --version output', () => {
    const out =
      'Tor version 0.4.9.15 (git-4d8efff53a86670b).\nThis build of Tor...\n';
    assert.equal(extractVersionFromOutput(out), '0.4.9.15');
  });
  it('returns null for unrecognised output', () => {
    assert.equal(extractVersionFromOutput('nothing here'), null);
  });
});

describe('extractVersionFromStrings', () => {
  it('parses "on Tor X.Y.Z" pattern from macOS binary strings', () => {
    const s = ' (on Tor 0.4.9.15 4d8efff53a86670b)';
    assert.equal(extractVersionFromStrings(s), '0.4.9.15');
  });
  it('parses "tor X.Y.Z" pattern from Windows binary strings', () => {
    const s = 'Via: tor/1.0 tor-network (tor 0.4.9.15)';
    assert.equal(extractVersionFromStrings(s), '0.4.9.15');
  });
  it('returns null when no match', () => {
    assert.equal(extractVersionFromStrings('no version here'), null);
  });
});

describe('checkPlatform — sha256 checking', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-test-'));
  });

  it('passes when binary sha256 matches', () => {
    const content = 'fake-tor-binary-content';
    const hash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
    fs.writeFileSync(path.join(tmpDir, 'tor'), content);

    const fakePlatform = {
      binary: 'tor',
      binarySha256: hash,
      libs: {},
    };
    const errors = checkPlatform('test', fakePlatform, tmpDir, {});
    assert.deepEqual(errors, []);
  });

  it('reports mismatch when binary sha256 is wrong', () => {
    const content = 'fake-tor-binary-content';
    fs.writeFileSync(path.join(tmpDir, 'tor-bad'), content);

    const fakePlatform = {
      binary: 'tor-bad',
      binarySha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      libs: {},
    };
    const errors = checkPlatform('test', fakePlatform, tmpDir, {});
    assert.equal(errors.length, 1);
    assert.match(errors[0], /sha256 mismatch/);
  });

  it('reports missing binary', () => {
    const fakePlatform = {
      binary: 'nonexistent-binary',
      binarySha256: 'anything',
      libs: {},
    };
    const errors = checkPlatform('test', fakePlatform, tmpDir, {});
    assert.equal(errors.length, 1);
    assert.match(errors[0], /not found/);
  });

  it('reports lib sha256 mismatch', () => {
    const content = 'fake-lib-content';
    fs.writeFileSync(path.join(tmpDir, 'tor-libcheck'), 'bindata');
    fs.writeFileSync(path.join(tmpDir, 'libfake.so'), content);

    const fakePlatform = {
      binary: 'tor-libcheck',
      binarySha256: crypto
        .createHash('sha256')
        .update('bindata')
        .digest('hex'),
      libs: {
        'libfake.so':
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    };
    const errors = checkPlatform('test', fakePlatform, tmpDir, {});
    assert.equal(errors.length, 1);
    assert.match(errors[0], /library sha256 mismatch/);
  });
});

describe('loadManifest', () => {
  it('loads the real versions.json successfully', () => {
    const manifest = loadManifest(VERSIONS_FILE);
    assert.ok(manifest.minimumTorVersion);
    assert.ok(manifest.torVersion);
    assert.ok(manifest.platforms['linux-x86_64']);
    assert.ok(manifest.platforms['macos-x86_64']);
    assert.ok(manifest.platforms['windows-x86_64']);
  });

  it('minimum version is at least 0.4.9', () => {
    const manifest = loadManifest(VERSIONS_FILE);
    assert.equal(
      versionSatisfiesMinimum(manifest.minimumTorVersion, '0.4.9'),
      true,
    );
  });

  it('declared torVersion satisfies the minimum', () => {
    const manifest = loadManifest(VERSIONS_FILE);
    assert.equal(
      versionSatisfiesMinimum(manifest.torVersion, manifest.minimumTorVersion),
      true,
    );
  });
});

describe('checkNonLinuxVersionString — against real binaries', () => {
  it('passes on the real macOS binary', () => {
    const manifest = loadManifest(VERSIONS_FILE);
    const errors = checkNonLinuxVersionString('macos-x86_64', TOR_DIR, manifest);
    assert.deepEqual(errors, []);
  });

  it('passes on the real Windows binary', () => {
    const manifest = loadManifest(VERSIONS_FILE);
    const errors = checkNonLinuxVersionString('windows-x86_64', TOR_DIR, manifest);
    assert.deepEqual(errors, []);
  });
});
