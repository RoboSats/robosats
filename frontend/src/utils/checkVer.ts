import packageJson from '../../package.json';

// Gets SemVer from backend /api/info and compares to local imported frontend version "localVer". Uses major,minor,patch.
// If minor of backend > minor of frontend, updateAvailable = true.

export const getClientVersion = function () {
  const semver = packageJson.version.split('.');
  const short = `v${semver[0]}.${semver[1]}.${semver[2]}`;
  const long = `v${packageJson.version}-alpha`;
  return { semver, short, long };
};

export const checkVer: (
  major: number | null,
  minor: number | null,
  patch: number | null,
) => object = (major, minor, patch) => {
  if (major === null || minor === null || patch === null) {
    return { updateAvailable: null };
  }
  const client = getClientVersion();
  const updateAvailable: boolean =
    major > Number(client.semver[0]) || minor > Number(client.semver[1]);
  const patchAvailable: boolean = !updateAvailable && patch > Number(client.semver[2]);

  return {
    updateAvailable,
    patchAvailable,
    coordinatorVersion: `v${major}.${minor}.${patch}`,
    clientVersion: client.short,
  };
};

export default checkVer;
