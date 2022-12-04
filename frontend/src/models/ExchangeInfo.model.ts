import { weightedMean, getHigherVer } from '../utils';
import { Coordinator, Version } from '.';

type toAdd =
  | 'num_public_buy_orders'
  | 'num_public_sell_orders'
  | 'book_liquidity'
  | 'active_robots_today'
  | 'last_day_volume'
  | 'lifetime_volume';

export class ExchangeInfo {
  public onlineCoordinators: number = 0;
  public totalCoordinators: number = 0;
  public num_public_buy_orders: number = 0;
  public num_public_sell_orders: number = 0;
  public book_liquidity: number = 0;
  public active_robots_today: number = 0;
  public last_day_nonkyc_btc_premium: number = 0;
  public last_day_volume: number = 0;
  public lifetime_volume: number = 0;
  public version: Version = { major: 0, minor: 0, patch: 0 };

  resetValues = () => {
    this.onlineCoordinators = 0;
    this.totalCoordinators = 0;
    this.num_public_buy_orders = 0;
    this.num_public_sell_orders = 0;
    this.book_liquidity = 0;
    this.active_robots_today = 0;
    this.last_day_nonkyc_btc_premium = 0;
    this.last_day_volume = 0;
    this.lifetime_volume = 0;
    this.version = { major: 0, minor: 0, patch: 0 };
  };

  update = (federation: Coordinator[], callback: (state: ExchangeInfo) => void) => {
    this.resetValues();
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
        if (coordinator.info) {
          value = value + coordinator.info[key];
        }
      });
      this[key] = value;
    });

    let premiums: number[] = [];
    let volumes: number[] = [];
    let highestVersion = { major: 0, minor: 0, patch: 0 };
    federation.map((coordinator, index) => {
      if (coordinator.info) {
        this.onlineCoordinators = this.onlineCoordinators + 1;
        premiums[index] = coordinator.info.last_day_nonkyc_btc_premium;
        volumes[index] = coordinator.info.last_day_volume;
        highestVersion = getHigherVer(highestVersion, coordinator.info.version);
      }
    });
    this.last_day_nonkyc_btc_premium = weightedMean(premiums, volumes);
    this.version = highestVersion;
    this.totalCoordinators = federation.length;
    return callback((state: ExchangeInfo) => {
      return state;
    });
  };
}

export default ExchangeInfo;
