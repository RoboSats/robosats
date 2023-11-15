export interface TradeRobotSummary {
  is_buyer: boolean;
  sent_fiat: number;
  received_sats: number;
  is_swap: boolean;
  received_onchain_sats: number;
  mining_fee_sats: number;
  swap_fee_sats: number;
  swap_fee_percent: number;
  sent_sats: number;
  received_fiat: number;
  trade_fee_sats: number;
  payment_hash?: string;
  preimage?: string;
  address?: string;
  txid?: string;
}

export interface TradeCoordinatorSummary {
  contract_timestamp: Date;
  contract_total_time: number;
  contract_exchange_rate: number;
  routing_budget_sats: number;
  trade_revenue_sats: number;
}

export interface Order {
  id: number;
  status: number;
  created_at: Date;
  expires_at: Date;
  type: number;
  currency: number;
  amount: number;
  has_range: boolean;
  min_amount: number;
  max_amount: number;
  payment_method: string;
  is_explicit: boolean;
  premium: number;
  satoshis: number;
  maker: number;
  taker: number;
  escrow_duration: number;
  total_secs_exp: number;
  penalty: Date | undefined;
  is_maker: boolean;
  is_taker: boolean;
  is_participant: boolean;
  maker_status: 'Active' | 'Seen recently' | 'Inactive';
  taker_status: 'Active' | 'Seen recently' | 'Inactive';
  price_now: number | undefined;
  satoshis_now: number;
  latitude: number;
  longitude: number;
  premium_now: number | undefined;
  premium_percentile: number;
  num_similar_orders: number;
  tg_enabled: boolean; // deprecated
  tg_token: string;
  tg_bot_name: string;
  is_buyer: boolean;
  is_seller: boolean;
  maker_nick: string;
  taker_nick: string;
  status_message: string;
  is_fiat_sent: boolean;
  is_disputed: boolean;
  ur_nick: string;
  maker_locked: boolean;
  taker_locked: boolean;
  escrow_locked: boolean;
  trade_satoshis: number;
  bond_invoice: string;
  bond_satoshis: number;
  escrow_invoice: string;
  escrow_satoshis: number;
  invoice_amount: number;
  swap_allowed: boolean;
  swap_failure_reason: string;
  suggested_mining_fee_rate: number;
  swap_fee_rate: number;
  pending_cancel: boolean;
  asked_for_cancel: boolean;
  statement_submitted: boolean;
  retries: number;
  next_retry_time: Date;
  failure_reason: string;
  invoice_expired: boolean;
  public_duration: number;
  bond_size: string;
  trade_fee_percent: number;
  bond_size_sats: number;
  bond_size_percent: number;
  chat_last_index: number;
  maker_summary: TradeRobotSummary;
  taker_summary: TradeRobotSummary;
  platform_summary: TradeCoordinatorSummary;
  expiry_reason: number;
  expiry_message: string;
  num_satoshis: number;
  sent_satoshis: number;
  txid: string;
  tx_queued: boolean;
  address: string;
  network: 'mainnet' | 'testnet';
  shortAlias: string;
  bad_request?: string;
}

export const defaultOrder: Order = {
  shortAlias: '',
  id: 0,
  status: 0,
  created_at: new Date(),
  expires_at: new Date(),
  type: 0,
  currency: 0,
  amount: 0,
  has_range: false,
  min_amount: 0,
  max_amount: 0,
  payment_method: '',
  is_explicit: false,
  premium: 0,
  satoshis: 0,
  maker: 0,
  taker: 0,
  escrow_duration: 0,
  total_secs_exp: 0,
  penalty: undefined,
  is_maker: false,
  is_taker: false,
  is_participant: false,
  maker_status: 'Active',
  taker_status: 'Active',
  price_now: undefined,
  satoshis_now: 0,
  latitude: 0,
  longitude: 0,
  premium_now: undefined,
  premium_percentile: 0,
  num_similar_orders: 0,
  tg_enabled: false,
  tg_token: '',
  tg_bot_name: '',
  is_buyer: false,
  is_seller: false,
  maker_nick: '',
  taker_nick: '',
  status_message: '',
  is_fiat_sent: false,
  is_disputed: false,
  ur_nick: '',
  maker_locked: false,
  taker_locked: false,
  escrow_locked: false,
  trade_satoshis: 0,
  bond_invoice: '',
  bond_satoshis: 0,
  escrow_invoice: '',
  escrow_satoshis: 0,
  invoice_amount: 0,
  swap_allowed: false,
  swap_failure_reason: '',
  suggested_mining_fee_rate: 0,
  swap_fee_rate: 0,
  pending_cancel: false,
  asked_for_cancel: false,
  statement_submitted: false,
  retries: 0,
  next_retry_time: new Date(),
  failure_reason: '',
  invoice_expired: false,
  public_duration: 0,
  bond_size: '',
  trade_fee_percent: 0,
  bond_size_sats: 0,
  bond_size_percent: 0,
  chat_last_index: 0,
  maker_summary: {
    is_buyer: false,
    sent_fiat: 0,
    received_sats: 0,
    is_swap: false,
    received_onchain_sats: 0,
    mining_fee_sats: 0,
    swap_fee_sats: 0,
    swap_fee_percent: 0,
    sent_sats: 0,
    received_fiat: 0,
    trade_fee_sats: 0,
  },
  taker_summary: {
    is_buyer: false,
    sent_fiat: 0,
    received_sats: 0,
    is_swap: false,
    received_onchain_sats: 0,
    mining_fee_sats: 0,
    swap_fee_sats: 0,
    swap_fee_percent: 0,
    sent_sats: 0,
    received_fiat: 0,
    trade_fee_sats: 0,
  },
  platform_summary: {
    contract_timestamp: new Date(),
    contract_total_time: 0,
    contract_exchange_rate: 0,
    routing_budget_sats: 0,
    trade_revenue_sats: 0,
  },
  expiry_reason: 0,
  expiry_message: '',
  num_satoshis: 0,
  sent_satoshis: 0,
  txid: '',
  tx_queued: false,
  address: '',
  network: 'mainnet',
};

export default Order;
