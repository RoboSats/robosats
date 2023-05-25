import packageJson from '../../package.json';
import { type Version } from '../models';
// Gets SemVer from backend /api/info and compares to local imported frontend version "localVer". Uses major,minor,patch.
// If minor of backend > minor of frontend, updateAvailable = true.

export const getClientVersion = function () {
  const ver = packageJson.version.split('.');
  const semver = { major: ver[0], minor: ver[1], patch: ver[2] };
  const short = `v${ver[0]}.${ver[1]}.${ver[2]}`;
  const long = `v${packageJson.version}-alpha`;
  return { semver, short, long };
};

export const getHigherVer = (ver0: Version, ver1: Version): Version => {
  if (ver1.major == null || ver0.minor == null || ver0.patch == null) {
    return ver0;
  } else if (ver0.major > ver1.major) {
    return ver0;
  } else if (ver0.major < ver1.major) {
    return ver1;
  } else if (ver0.minor > ver1.minor) {
    return ver0;
  } else if (ver0.minor < ver1.minor) {
    return ver1;
  } else if (ver0.patch > ver1.patch) {
    return ver0;
  } else if (ver0.patch < ver1.patch) {
    return ver1;
  } else {
    return ver0;
  }
};

export const checkVer: (coordinatorVersion: Version | null) => boolean = (coordinatorVersion) => {
  let updateAvailable: boolean = false;
  if (coordinatorVersion != null) {
    const { major, minor, patch } = coordinatorVersion;
    if (!(major === null || minor === null || patch === null)) {
      const client = getClientVersion().semver;
      updateAvailable = major > Number(client.major) || minor > Number(client.minor);
      // const patchAvailable: boolean = !updateAvailable && patch > Number(client.semver[2]);
    }
  }

  return updateAvailable;
};

export default checkVer;
