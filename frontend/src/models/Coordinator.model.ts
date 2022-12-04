import { apiClient } from '../services/api';

export interface Contact {
  email?: string | undefined;
  telegram?: string | undefined;
  reddit?: string | undefined;
  matrix?: string | undefined;
  twitter?: string | undefined;
  website?: string | undefined;
}

export type Version = { major: number | null; minor: number | null; patch: number | null };

export interface Info {
  num_public_buy_orders: number;
  num_public_sell_orders: number;
  book_liquidity: number;
  active_robots_today: number;
  last_day_nonkyc_btc_premium: number;
  last_day_volume: number;
  lifetime_volume: number;
  lnd_version: string;
  robosats_running_commit_hash: string;
  alternative_site: string;
  alternative_name: string;
  node_alias: string;
  node_id: string;
  version: Version;
  maker_fee: number;
  taker_fee: number;
  bond_size: number;
  current_swap_fee_rate: number;
  network: 'mainnet' | 'testnet' | undefined;
  openUpdateClient: boolean;
  loading: boolean;
}

export interface EndpointProps {
  bitcoin: 'mainnet' | 'testnet';
  network: 'Clearnet' | 'Onion' | 'I2P';
}
export class Coordinator {
  constructor(value: Coordinator) {
    this.alias = value.alias;
    this.description = value.description;
    this.motto = value.motto;
    this.color = value.color;
    this.contact = value.contact;
    this.mainnetOnion = value.mainnetOnion;
    this.mainnetClearnet = value.mainnetClearnet;
    this.mainnetI2P = value.mainnetI2P;
    this.testnetOnion = value.testnetOnion;
    this.testnetI2P = value.testnetI2P;
    this.mainnetNodesPubkeys = value.mainnetNodesPubkeys;
    this.testnetNodesPubkeys = value.testnetNodesPubkeys;
  }

  public alias: string;
  public enabled: boolean = true;
  public description: string;
  public motto: string;
  public color: string;
  public contact: Contact | undefined;
  public mainnetOnion: string | undefined;
  public mainnetClearnet: string | undefined;
  public mainnetI2P: string | undefined;
  public testnetOnion: string | undefined;
  public testnetClearnet: string | undefined;
  public testnetI2P: string | undefined;
  public mainnetNodesPubkeys: string[] | undefined;
  public testnetNodesPubkeys: string[] | undefined;
  public info?: Info | undefined = undefined;
  public loadingInfo: boolean = true;

  fetchInfo = ({ bitcoin, network }: EndpointProps, callback: (state: Coordinator[]) => void) => {
    this.loadingInfo = true;
    const url = this[`${bitcoin}${network}`];
    if (url != undefined) {
      apiClient
        .get(url, '/api/info/', { mode: 'no-cors' })
        .then((data: Info) => {
          this.info = data;
        })
        .catch(() => {
          this.loadingInfo = false;
        })
        .finally(() => {
          this.loadingInfo = false;
        });
    }
    return callback((state: Coordinator[]) => {
      return state;
    });
  };
}

export default Coordinator;
