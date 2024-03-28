import {
  type Robot,
  type LimitList,
  type PublicOrder,
  type Settings,
  type Order,
  type Garage,
} from '.';
import { apiClient } from '../services/api';
import { validateTokenEntropy } from '../utils';
import { compareUpdateLimit } from './Limit.model';
import { defaultOrder } from './Order.model';
import { robohash } from '../components/RobotAvatar/RobohashGenerator';

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
  robotsLove?: boolean | undefined;
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
  loading: boolean;
}

export type Origin = 'onion' | 'i2p' | 'clearnet';

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
  constructor(value: any) {
    const established = new Date(value.established);
    this.longAlias = value.longAlias;
    this.shortAlias = value.shortAlias;
    this.description = value.description;
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
    this.url = '';
    this.basePath = '';
  }

  // These properties are loaded from federation.json
  public longAlias: string;
  public shortAlias: string;
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
  public basePath: string;

  // These properties are fetched from coordinator API
  public book: PublicOrder[] = [];
  public loadingBook: boolean = false;
  public info?: Info | undefined = undefined;
  public loadingInfo: boolean = false;
  public limits: LimitList = {};
  public loadingLimits: boolean = false;
  public loadingRobot: boolean = true;

  start = async (
    origin: Origin,
    settings: Settings,
    hostUrl: string,
    onUpdate: (shortAlias: string) => void = () => {},
  ): Promise<void> => {
    if (this.enabled !== true) return;
    void this.updateUrl(settings, origin, hostUrl, onUpdate);
  };

  updateUrl = async (
    settings: Settings,
    origin: Origin,
    hostUrl: string,
    onUpdate: (shortAlias: string) => void = () => {},
  ): Promise<void> => {
    if (settings.selfhostedClient && this.shortAlias !== 'local') {
      this.url = hostUrl;
      this.basePath = `/${settings.network}/${this.shortAlias}`;
    } else {
      this.url = String(this[settings.network][origin]);
      this.basePath = '';
    }
    void this.update(() => {
      onUpdate(this.shortAlias);
    });
  };

  update = async (onUpdate: (shortAlias: string) => void = () => {}): Promise<void> => {
    const onDataLoad = (): void => {
      if (this.isUpdated()) onUpdate(this.shortAlias);
    };

    this.loadBook(onDataLoad);
    this.loadLimits(onDataLoad);
    this.loadInfo(onDataLoad);
  };

  updateBook = async (onUpdate: (shortAlias: string) => void = () => {}): Promise<void> => {
    this.loadBook(() => {
      onUpdate(this.shortAlias);
    });
  };

  generateAllMakerAvatars = async (data: [PublicOrder]): Promise<void> => {
    for (const order of data) {
      void robohash.generate(order.maker_hash_id, 'small');
    }
  };

  loadBook = (onDataLoad: () => void = () => {}): void => {
    if (!this.enabled) return;
    if (this.url === '') return;
    if (this.loadingBook) return;

    this.loadingBook = true;

    apiClient
      .get(this.url, `${this.basePath}/api/book/`)
      .then((data) => {
        if (!data?.not_found) {
          this.book = (data as PublicOrder[]).map((order) => {
            order.coordinatorShortAlias = this.shortAlias;
            return order;
          });
          void this.generateAllMakerAvatars(data);
          onDataLoad();
        } else {
          this.book = [];
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
      .get(this.url, `${this.basePath}/api/limits/`)
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
      .get(this.url, `${this.basePath}/api/info/`)
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
    void this.update(() => {
      onEnabled();
    });
  };

  disable = (): void => {
    this.enabled = false;
    this.info = undefined;
    this.limits = {};
    this.book = [];
  };

  isUpdated = (): boolean => {
    return !((this.loadingBook === this.loadingInfo) === this.loadingLimits);
  };

  getBaseUrl = (): string => {
    return this.url + this.basePath;
  };

  getEndpoint = (
    network: 'mainnet' | 'testnet',
    origin: Origin,
    selfHosted: boolean,
    hostUrl: string,
  ): { url: string; basePath: string } => {
    if (selfHosted && this.shortAlias !== 'local') {
      return { url: hostUrl, basePath: `/${network}/${this.shortAlias}` };
    } else {
      return { url: String(this[network][origin]), basePath: '' };
    }
  };

  fetchRobot = async (garage: Garage, token: string): Promise<Robot | null> => {
    if (!this.enabled || !token) return null;

    const robot = garage?.getSlot(token)?.getRobot() ?? null;
    const authHeaders = robot?.getAuthHeaders();

    if (!authHeaders) return null;

    const { hasEnoughEntropy, bitsEntropy, shannonEntropy } = validateTokenEntropy(token);

    if (!hasEnoughEntropy) return null;

    garage.updateRobot(token, this.shortAlias, { loading: true });

    const newAttributes = await apiClient
      .get(this.url, `${this.basePath}/api/robot/`, authHeaders)
      .then((data: any) => {
        return {
          nickname: data.nickname,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          last_login: data.last_login,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
        };
      })
      .catch((e) => {
        console.log(e);
      });

    garage.updateRobot(token, this.shortAlias, {
      ...newAttributes,
      tokenSHA256: authHeaders.tokenSHA256,
      loading: false,
      bitsEntropy,
      shannonEntropy,
      shortAlias: this.shortAlias,
    });

    return garage.getSlot(this.shortAlias)?.getRobot() ?? null;
  };

  fetchOrder = async (orderId: number, robot: Robot, token: string): Promise<Order | null> => {
    if (!this.enabled) return null;
    if (!token) return null;

    const authHeaders = robot.getAuthHeaders();
    if (!authHeaders) return null;

    return await apiClient
      .get(this.url, `${this.basePath}/api/order/?order_id=${orderId}`, authHeaders)
      .then((data) => {
        console.log('data', data);
        const order: Order = {
          ...defaultOrder,
          ...data,
          shortAlias: this.shortAlias,
        };
        return order;
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
  };

  fetchReward = async (
    signedInvoice: string,
    garage: Garage,
    index: string,
  ): Promise<null | {
    bad_invoice?: string;
    successful_withdrawal?: boolean;
  }> => {
    if (!this.enabled) return null;

    const slot = garage.getSlot(index);
    const robot = slot?.getRobot();

    if (!slot?.token || !robot?.encPrivKey) return null;

    const data = await apiClient.post(
      this.url,
      `${this.basePath}/api/reward/`,
      {
        invoice: signedInvoice,
      },
      { tokenSHA256: robot.tokenSHA256 },
    );
    garage.updateRobot(slot?.token, this.shortAlias, {
      earnedRewards: data?.successful_withdrawal === true ? 0 : robot.earnedRewards,
    });

    return data ?? {};
  };

  fetchStealth = async (wantsStealth: boolean, garage: Garage, index: string): Promise<null> => {
    if (!this.enabled) return null;

    const slot = garage.getSlot(index);
    const robot = slot?.getRobot();

    if (!(slot?.token != null) || !(robot?.encPrivKey != null)) return null;

    await apiClient.post(
      this.url,
      `${this.basePath}/api/stealth/`,
      { wantsStealth },
      { tokenSHA256: robot.tokenSHA256 },
    );

    garage.updateRobot(slot?.token, this.shortAlias, {
      stealthInvoices: wantsStealth,
    });

    return null;
  };
}

export default Coordinator;
