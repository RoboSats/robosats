interface Version {
  major: number | null;
  minor: number | null;
  patch: number | null;
}
export interface AggregatedInfo {
  onlineCoordinators: number;
  totalCoordinators: number;
  num_public_buy_orders: number;
  num_public_sell_orders: number;
  book_liquidity: number;
  active_robots_today: number;
  last_day_nonkyc_btc_premium: number;
  last_day_volume: number;
  lifetime_volume: number;
  version: Version;
}

export const weightedMean = (arrValues: number[], arrWeights: number[]): number => {
  if (arrValues.length === 0) {
    return 0;
  }
  const result = arrValues
    .map((value, i) => {
      const weight = arrWeights[i];
      const sum = value * weight;
      return [sum, weight];
    })
    .reduce((p, c) => [p[0] + c[0], p[1] + c[1]], [0, 0]);

  return result[0] / result[1];
};

const getHigherVer = (ver0: Version, ver1: Version): Version => {
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

export default getHigherVer;
