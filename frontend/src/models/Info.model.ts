import packageJson from '../../package.json';

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
  version: { major: number | null; minor: number | null; patch: number | null };
  maker_fee: number;
  taker_fee: number;
  bond_size: number;
  current_swap_fee_rate: number;
  network: 'mainnet' | 'testnet';
  coordinatorVersion: string;
  clientVersion: string;
  openUpdateClient: boolean;
  loading: boolean;
}
const semver = packageJson.version.split('.');

export const defaultInfo: Info = {
  num_public_buy_orders: 0,
  num_public_sell_orders: 0,
  book_liquidity: 0,
  active_robots_today: 0,
  last_day_nonkyc_btc_premium: 0,
  last_day_volume: 0,
  lifetime_volume: 0,
  lnd_version: '0.0.0-beta',
  cln_version: '0.0.0',
  robosats_running_commit_hash: '000000000000000',
  alternative_site: 'RoboSats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion',
  alternative_name: 'RoboSats Mainnet',
  node_alias: '🤖RoboSats⚡(RoboDevs)',
  node_id: '033b58d7681fe5dd2fb21fd741996cda5449616f77317dd1156b80128d6a71b807',
  version: { major: null, minor: null, patch: null },
  maker_fee: 0,
  taker_fee: 0,
  bond_size: 0,
  current_swap_fee_rate: 0,
  network: undefined,
  coordinatorVersion: 'v?.?.?',
  clientVersion: `v${semver[0]}.${semver[1]}.${semver[2]}`,
  openUpdateClient: false,
  loading: true,
};

export default Info;
