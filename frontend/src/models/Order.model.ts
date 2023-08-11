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
  min_amount: string;
  max_amount: string;
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
}

export default Order;
