import { type Coordinator } from '../models';

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

type toAdd =
  | 'num_public_buy_orders'
  | 'num_public_sell_orders'
  | 'book_liquidity'
  | 'active_robots_today'
  | 'last_day_volume'
  | 'lifetime_volume';

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

export const aggregateInfo = (federation: Coordinator[]): AggregatedInfo => {
  const info = {
    onlineCoordinators: 0,
    totalCoordinators: 0,
    num_public_buy_orders: 0,
    num_public_sell_orders: 0,
    book_liquidity: 0,
    active_robots_today: 0,
    last_day_nonkyc_btc_premium: 0,
    last_day_volume: 0,
    lifetime_volume: 0,
    version: { major: 0, minor: 0, patch: 0 },
  };
  info.totalCoordinators = federation.length;
  const addUp: toAdd[] = [
    'num_public_buy_orders',
    'num_public_sell_orders',
    'book_liquidity',
    'active_robots_today',
    'last_day_volume',
    'lifetime_volume',
  ];

  addUp.map((key) => {
    let value = 0;
    federation.map((coordinator) => {
      if (coordinator.info != null) {
        value = value + coordinator.info[key];
      }
      return null;
    });
    info[key] = value;
    return null;
  });

  const premiums: number[] = [];
  const volumes: number[] = [];
  let highestVersion = { major: 0, minor: 0, patch: 0 };
  federation.map((coordinator, index) => {
    if (coordinator.info != null) {
      info.onlineCoordinators = info.onlineCoordinators + 1;
      premiums[index] = coordinator.info.last_day_nonkyc_btc_premium;
      volumes[index] = coordinator.info.last_day_volume;
      highestVersion = getHigherVer(highestVersion, coordinator.info.version);
    }
    return null;
  });

  info.last_day_nonkyc_btc_premium = weightedMean(premiums, volumes);
  info.version = highestVersion;

  return info;
};

export default aggregateInfo;
