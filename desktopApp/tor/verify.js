'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const VERSIONS_FILE = path.join(__dirname, 'versions.json');

function loadManifest(versionsFile) {
  return JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
}

function parseVersionTuple(vstr) {
  return vstr.split('.').map(Number);
}

function versionSatisfiesMinimum(version, minimum) {
  const v = parseVersionTuple(version);
  const m = parseVersionTuple(minimum);
  const len = Math.max(v.length, m.length);
  for (let i = 0; i < len; i++) {
    const vi = v[i] ?? 0;
    const mi = m[i] ?? 0;
    if (vi > mi) return true;
    if (vi < mi) return false;
  }
  return true;
}

function sha256OfFile(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function extractVersionFromOutput(output) {
  const m = output.match(/Tor version (\d+\.\d+\.\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

function extractVersionFromStrings(output) {
  const m = output.match(/(?:on Tor|tor)\s+(\d+\.\d+\.\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

function checkPlatform(name, platform, torDir, manifest) {
  const errors = [];
  const binRelPath = platform.binary;
  const binPath = path.join(torDir, binRelPath);

  if (!fs.existsSync(binPath)) {
    errors.push(`[${name}] binary not found: ${binRelPath}`);
    return errors;
  }

  const actualBinHash = sha256OfFile(binPath);
  if (actualBinHash !== platform.binarySha256) {
    errors.push(
      `[${name}] binary sha256 mismatch\n  expected: ${platform.binarySha256}\n  actual:   ${actualBinHash}`,
    );
  }

  for (const [libRel, expectedHash] of Object.entries(platform.libs ?? {})) {
    const libPath = path.join(torDir, libRel);
    if (!fs.existsSync(libPath)) {
      errors.push(`[${name}] library not found: ${libRel}`);
      continue;
    }
    const actualHash = sha256OfFile(libPath);
    if (actualHash !== expectedHash) {
      errors.push(
        `[${name}] library sha256 mismatch for ${path.basename(libRel)}\n  expected: ${expectedHash}\n  actual:   ${actualHash}`,
      );
    }
  }

  return errors;
}

function checkLinuxVersion(torDir, manifest) {
  const binPath = path.join(torDir, manifest.platforms['linux-x86_64'].binary);
  const libDir = path.dirname(binPath);
  let output;
  try {
    output = execFileSync(binPath, ['--version'], {
      env: { ...process.env, LD_LIBRARY_PATH: libDir },
      encoding: 'utf8',
      timeout: 10000,
    });
  } catch (e) {
    return [`[linux-x86_64] failed to run tor --version: ${e.message}`];
  }
  const version = extractVersionFromOutput(output);
  if (!version) {
    return [`[linux-x86_64] could not parse version from: ${output.trim()}`];
  }
  if (!versionSatisfiesMinimum(version, manifest.minimumTorVersion)) {
    return [
      `[linux-x86_64] tor version ${version} is below minimum ${manifest.minimumTorVersion}`,
    ];
  }
  if (version !== manifest.torVersion) {
    return [
      `[linux-x86_64] tor --version reports ${version} but versions.json declares ${manifest.torVersion}`,
    ];
  }
  console.log(`  linux-x86_64: tor ${version} ✓`);
  return [];
}

function checkNonLinuxVersionString(name, torDir, manifest) {
  const platform = manifest.platforms[name];
  const binPath = path.join(torDir, platform.binary);
  const binData = fs.readFileSync(binPath);
  const printable = binData.toString('latin1').replace(/[^\x20-\x7e]/g, ' ');
  const version =
    extractVersionFromStrings(printable) ??
    extractVersionFromOutput(printable);
  if (!version) {
    return [`[${name}] could not extract version string from binary`];
  }
  if (!versionSatisfiesMinimum(version, manifest.minimumTorVersion)) {
    return [
      `[${name}] tor version ${version} is below minimum ${manifest.minimumTorVersion}`,
    ];
  }
  if (version !== manifest.torVersion) {
    return [
      `[${name}] binary version string ${version} does not match versions.json ${manifest.torVersion}`,
    ];
  }
  console.log(`  ${name}: tor ${version} ✓`);
  return [];
}

function main(versionsFile, torDir) {
  const manifest = loadManifest(versionsFile);
  const errors = [];

  console.log(
    `Verifying Tor Expert Bundle ${manifest.expertBundle} (tor ${manifest.torVersion}), minimum ${manifest.minimumTorVersion}`,
  );

  for (const [name, platform] of Object.entries(manifest.platforms)) {
    errors.push(...checkPlatform(name, platform, torDir, manifest));
  }

  errors.push(...checkLinuxVersion(torDir, manifest));
  errors.push(...checkNonLinuxVersionString('macos-x86_64', torDir, manifest));
  errors.push(
    ...checkNonLinuxVersionString('windows-x86_64', torDir, manifest),
  );

  if (errors.length > 0) {
    console.error('\nVERIFICATION FAILED:');
    for (const e of errors) {
      console.error('  ' + e);
    }
    process.exit(1);
  }

  console.log('All checks passed.');
}

module.exports = {
  loadManifest,
  parseVersionTuple,
  versionSatisfiesMinimum,
  sha256OfFile,
  extractVersionFromOutput,
  extractVersionFromStrings,
  checkPlatform,
  checkLinuxVersion,
  checkNonLinuxVersionString,
};

if (require.main === module) {
  main(VERSIONS_FILE, __dirname);
}
