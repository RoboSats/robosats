import { weightedMean, getHigherVer } from '../utils';
import { type Federation, type Version } from '.';

interface ExchangeInfo {
  num_public_buy_orders: number;
  num_public_sell_orders: number;
  book_liquidity: number;
  active_robots_today: number;
  last_day_nonkyc_btc_premium: number;
  last_day_volume: number;
  lifetime_volume: number;
  version: Version;
}

const defaultExchangeInfo: ExchangeInfo = {
  num_public_buy_orders: 0,
  num_public_sell_orders: 0,
  book_liquidity: 0,
  active_robots_today: 0,
  last_day_nonkyc_btc_premium: 0,
  last_day_volume: 0,
  lifetime_volume: 0,
  version: { major: 0, minor: 0, patch: 0 },
};

export const updateExchangeInfo = (federation: Federation) => {
  const info: ExchangeInfo = {};

  const toSum = [
    'num_public_buy_orders',
    'num_public_sell_orders',
    'book_liquidity',
    'active_robots_today',
    'last_day_volume',
    'lifetime_volume',
  ];

  toSum.map((key) => {
    let value = 0;
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.info) {
        value = value + coordinator.info[key];
      }
    });
    info[key] = value;
  });

  const premiums: number[] = [];
  const volumes: number[] = [];
  let highestVersion: Version = { major: 0, minor: 0, patch: 0 };
  Object.entries(federation).map(([shortAlias, coordinator], index) => {
    if (coordinator.info && coordinator.enabled) {
      premiums[index] = coordinator.info.last_day_nonkyc_btc_premium;
      volumes[index] = coordinator.info.last_day_volume;
      highestVersion = getHigherVer(highestVersion, coordinator.info.version);
    }
  });
  info.last_day_nonkyc_btc_premium = weightedMean(premiums, volumes);
  info.version = highestVersion;
  return info;
};

export interface Exchange {
  info: ExchangeInfo;
  onlineCoordinators: number;
  totalCoordinators: number;
}

export const defaultExchange: Exchange = {
  info: defaultExchangeInfo,
  onlineCoordinators: 0,
  totalCoordinators: 0,
};

export default Exchange;
