import { weightedMean, getHigherVer } from '../utils';
import { Coordinator, Limit, LimitList, Version } from '.';

interface ExchangeInfo {
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

const defaultExchangeInfo: ExchangeInfo = {
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

const compareUpdateLimit = (baseL: Limit, newL: Limit) => {
  if (!baseL) {
    return newL;
  } else {
    const price = (baseL.price + newL.price) / 2;
    const max_amount = Math.max(baseL.max_amount, newL.max_amount);
    const min_amount = Math.min(baseL.min_amount, newL.min_amount);
    const max_bondless_amount = Math.max(baseL.max_bondless_amount, newL.max_bondless_amount);
    return { code: newL.code, price, max_amount, min_amount, max_bondless_amount };
  }
};

type toAdd =
  | 'num_public_buy_orders'
  | 'num_public_sell_orders'
  | 'book_liquidity'
  | 'active_robots_today'
  | 'last_day_volume'
  | 'lifetime_volume';

export class Exchange {
  public info?: ExchangeInfo = defaultExchangeInfo;
  public limits?: LimitList;

  updateInfo = () => null;
  // updateInfo = (federation: Coordinator[], callback: () => void) => {
  //   this.info = undefined;
  //   const addUp: toAdd[] = [
  //     'num_public_buy_orders',
  //     'num_public_sell_orders',
  //     'book_liquidity',
  //     'active_robots_today',
  //     'last_day_volume',
  //     'lifetime_volume',
  //   ];

  //   addUp.map((key) => {
  //     let value = 0;
  //     federation.map((coordinator) => {
  //       if (coordinator.info) {
  //         value = value + coordinator.info[key];
  //       }
  //     });
  //     this.info[key] = value;
  //   });

  //   let premiums: number[] = [];
  //   let volumes: number[] = [];
  //   let highestVersion = { major: 0, minor: 0, patch: 0 };
  //   federation.map((coordinator, index) => {
  //     if (coordinator.info) {
  //       this.info.onlineCoordinators = this.info.onlineCoordinators + 1;
  //       premiums[index] = coordinator.info.last_day_nonkyc_btc_premium;
  //       volumes[index] = coordinator.info.last_day_volume;
  //       highestVersion = getHigherVer(highestVersion, coordinator.info.version);
  //     }
  //   });
  //   this.info.last_day_nonkyc_btc_premium = weightedMean(premiums, volumes);
  //   this.info.version = highestVersion;
  //   this.info.totalCoordinators = federation.length;
  //   return callback();
  // };

  updateLimits = () => null;
  // updateLimits = (federation: Coordinator[], callback: () => void) => {
  //   let newLimits: LimitList = {};
  //   federation.map((coordinator, index) => {
  //     if (coordinator.limits) {
  //       for (const currency in coordinator.limits) {
  //         newLimits[currency] = compareUpdateLimit(
  //           newLimits[currency],
  //           coordinator.limits[currency],
  //         );
  //       }
  //     }
  //     this.limits = newLimits;
  //   });
  //   return callback();
  // };
}

export default Exchange;
