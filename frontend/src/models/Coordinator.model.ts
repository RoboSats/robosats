import { type LimitList, type PublicOrder, type Settings } from '.';
import { roboidentitiesClient } from '../services/Roboidentities/Web';
import { apiClient } from '../services/api';
import { compareUpdateLimit } from './Limit.model';

export interface Contact {
  nostr?: string | undefined;
  pgp?: string | undefined;
  fingerprint?: string | undefined;
  email?: string | undefined;
  telegram?: string | undefined;
  reddit?: string | undefined;
  matrix?: string | undefined;
  simplex?: string | undefined;
  twitter?: string | undefined;
  website?: string | undefined;
}

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export interface Badges {
  isFounder?: boolean | undefined;
  donatesToDevFund: number;
  hasGoodOpSec?: boolean | undefined;
  hasLargeLimits?: boolean | undefined;
}

export interface Info {
  num_public_buy_orders: number;
  num_public_sell_orders: number;
  book_liquidity: number;
  active_robots_today: number;
  last_day_nonkyc_btc_premium: number;
  last_day_volume: number;
  lifetime_volume: number;
  lnd_version?: string;
  cln_version?: string;
  robosats_running_commit_hash: string;
  alternative_site: string;
  alternative_name: string;
  node_alias: string;
  node_id: string;
  version: Version;
  maker_fee: number;
  taker_fee: number;
  bond_size: number;
  min_order_size: number;
  max_order_size: number;
  swap_enabled: boolean;
  max_swap: number;
  current_swap_fee_rate: number;
  network: 'mainnet' | 'testnet' | undefined;
  openUpdateClient: boolean;
  notice_severity: 'none' | 'warning' | 'error' | 'success' | 'info';
  notice_message: string;
  market_price_apis: string;
  loading: boolean;
}

export type Origin = 'onion' | 'i2p' | 'clearnet';

export const coordinatorDefaultValues = {
  longAlias: '',
  shortAlias: '',
  description: '',
  motto: '',
  color: '#000',
  size_limit: 21 * 100000000,
  established: new Date(),
  policies: {},
  contact: {
    email: '',
    telegram: '',
    simplex: '',
    matrix: '',
    website: '',
    nostr: '',
    pgp: '',
    fingerprint: '',
  },
  badges: {
    isFounder: false,
    donatesToDevFund: 0,
    hasGoodOpSec: false,
    hasLargeLimits: false,
  },
  mainnet: undefined,
  testnet: undefined,
  mainnetNodesPubkeys: '',
  testnetNodesPubkeys: '',
  federated: true,
};

export interface Origins {
  clearnet: Origin | undefined;
  onion: Origin | undefined;
  i2p: Origin | undefined;
}

function calculateSizeLimit(inputDate: Date): number {
  const now = new Date();
  const numDifficultyAdjustments = Math.ceil(
    (now.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24 * 14),
  );

  let value = 250000;
  for (let i = 1; i < numDifficultyAdjustments; i++) {
    value *= 1.3;
    if (i >= 12) {
      // after 12 difficulty adjustments (6 weeks) limit becomes 21 BTC (mature coordinator)
      return 21 * 100000000;
    }
  }

  return value;
}

export class Coordinator {
  constructor(value: object, origin: Origin, settings: Settings, hostUrl: string) {
    const established = new Date(value.established);
    this.longAlias = value.longAlias;
    this.shortAlias = value.shortAlias;
    this.description = value.description;
    this.federated = value.federated ?? false;
    this.motto = value.motto;
    this.color = value.color;
    this.size_limit = value.badges.isFounder ? 21 * 100000000 : calculateSizeLimit(established);
    this.established = established;
    this.policies = value.policies;
    this.contact = value.contact;
    this.badges = value.badges;
    this.mainnet = value.mainnet;
    this.testnet = value.testnet;
    this.mainnetNodesPubkeys = value.mainnetNodesPubkeys;
    this.testnetNodesPubkeys = value.testnetNodesPubkeys;
    this.nostrHexPubkey = value.nostrHexPubkey;
    this.url = '';

    this.updateUrl(origin, settings, hostUrl);
  }

  // These properties are loaded from federation.json
  public longAlias: string;
  public shortAlias: string;
  public federated: boolean;
  public enabled?: boolean = true;
  public description: string;
  public motto: string;
  public color: string;
  public size_limit: number;
  public established: Date;
  public policies: Record<string, string> = {};
  public contact: Contact | undefined;
  public badges: Badges;
  public mainnet: Origins;
  public testnet: Origins;
  public mainnetNodesPubkeys: string[] | undefined;
  public testnetNodesPubkeys: string[] | undefined;
  public url: string;
  public nostrHexPubkey: string;

  // These properties are fetched from coordinator API
  public book: Record<string, PublicOrder> = {};
  public loadingBook: boolean = false;
  public info?: Info | undefined = undefined;
  public loadingInfo: boolean = false;
  public limits: LimitList = {};
  public loadingLimits: boolean = false;

  updateUrl = (origin: Origin, settings: Settings, hostUrl: string): void => {
    if (settings.selfhostedClient && this.shortAlias !== 'local') {
      this.url = `${hostUrl}/${settings.network}/${this.shortAlias}`;
    } else {
      this.url = String(this[settings.network]?.[origin]);
    }
  };

  generateAllMakerAvatars = async (): Promise<void> => {
    for (const order of Object.values(this.book)) {
      void roboidentitiesClient.generateRobohash(order.maker_hash_id ?? '', 'small');
    }
  };

  loadBook = (onDataLoad: () => void = () => {}): void => {
    if (!this.enabled) return;
    if (this.url === '') return;
    if (this.loadingBook) return;

    this.loadingBook = true;
    this.book = {};

    apiClient
      .get(this.url, `/api/book/`, undefined, true)
      .then((data) => {
        if (!data?.not_found) {
          this.book = (data as PublicOrder[]).reduce<Record<string, PublicOrder>>((book, order) => {
            order.coordinatorShortAlias = this.shortAlias;
            return { ...book, [`${this.shortAlias}${order.id}`]: order };
          }, {});
          void this.generateAllMakerAvatars();
          onDataLoad();
        } else {
          onDataLoad();
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        this.loadingBook = false;
      });
  };

  loadLimits = (onDataLoad: () => void = () => {}): void => {
    if (!this.enabled) return;
    if (this.url === '') return;
    if (this.loadingLimits) return;

    this.loadingLimits = true;

    apiClient
      .get(this.url, `/api/limits/`, undefined, true)
      .then((data) => {
        if (data !== null) {
          const newLimits = data as LimitList;

          for (const currency in this.limits) {
            newLimits[currency] = compareUpdateLimit(this.limits[currency], newLimits[currency]);
          }

          this.limits = newLimits;
          onDataLoad();
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        this.loadingLimits = false;
      });
  };

  loadInfo = (onDataLoad: () => void = () => {}): void => {
    if (!this.enabled) return;
    if (this.url === '') return;
    if (this.loadingInfo) return;

    this.loadingInfo = true;

    apiClient
      .get(this.url, `/api/info/`, undefined, true)
      .then((data) => {
        if (data !== null) {
          this.info = data as Info;
          onDataLoad();
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        this.loadingInfo = false;
      });
  };

  enable = (onEnabled: () => void = () => {}): void => {
    this.enabled = true;
    this.loadLimits(() => {
      onEnabled();
    });
  };

  disable = (): void => {
    this.enabled = false;
    this.info = undefined;
    this.limits = {};
    this.book = {};
  };

  getRelayUrl = (): string => {
    const protocol = this.url.includes('https') ? 'wss://' : 'ws://';
    return this.url.replace(/^https?:\/\//, protocol) + '/relay/';
  };
}

export default Coordinator;
