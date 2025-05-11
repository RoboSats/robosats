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

export const updateExchangeInfo = (federation: Federation): ExchangeInfo => {
  const info: ExchangeInfo = {
    num_public_buy_orders: 0,
    num_public_sell_orders: 0,
    book_liquidity: 0,
    active_robots_today: 0,
    last_day_nonkyc_btc_premium: 0,
    last_day_volume: 0,
    lifetime_volume: 0,
    version: { major: 0, minor: 0, patch: 0 },
  };
  const premiums: number[] = [];
  const volumes: number[] = [];
  let highestVersion: Version = { major: 0, minor: 0, patch: 0 };
  let active_robots_today: number = 0;

  const aggregations = [
    'num_public_buy_orders',
    'num_public_sell_orders',
    'book_liquidity',
    'last_day_volume',
    'lifetime_volume',
  ];

  federation.getCoordinators().forEach((coordinator, index) => {
    if (coordinator.info !== undefined) {
      premiums[index] = coordinator.info.last_day_nonkyc_btc_premium;
      volumes[index] = coordinator.info.last_day_volume;
      highestVersion = getHigherVer(highestVersion, coordinator.info.version);
      active_robots_today = Math.max(active_robots_today, coordinator.info.active_robots_today);

      aggregations.forEach((key: string) => {
        info[key] = Number(info[key]) + Number(coordinator.info[key]);
      });
    }
  });

  info.last_day_nonkyc_btc_premium = weightedMean(premiums, volumes);
  info.version = highestVersion;
  info.active_robots_today = active_robots_today;

  return info;
};

export interface Exchange {
  info: ExchangeInfo;
  enabledCoordinators: number;
  onlineCoordinators: number;
  loadingCoordinators: number;
  loadingCache: number;
  totalCoordinators: number;
}

export const defaultExchange: Exchange = {
  info: {
    num_public_buy_orders: 0,
    num_public_sell_orders: 0,
    book_liquidity: 0,
    active_robots_today: 0,
    last_day_nonkyc_btc_premium: 0,
    last_day_volume: 0,
    lifetime_volume: 0,
    version: { major: 0, minor: 0, patch: 0 },
  },
  enabledCoordinators: 0,
  onlineCoordinators: 0,
  loadingCoordinators: 0,
  loadingCache: 0,
  totalCoordinators: 0,
};

export default Exchange;
