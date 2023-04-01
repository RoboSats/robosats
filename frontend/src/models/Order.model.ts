import { apiClient } from '../services/api';
import type Federation from './Federation.model';
import type Slot from './Slot.model';

export interface SubmitActionProps {
  action:
    | 'cancel'
    | 'dispute'
    | 'pause'
    | 'confirm'
    | 'undo_confirm'
    | 'update_invoice'
    | 'update_address'
    | 'submit_statement'
    | 'rate_platform'
    | 'take';
  invoice?: string;
  routing_budget_ppm?: number;
  address?: string;
  mining_fee_rate?: number;
  statement?: string;
  rating?: number;
  amount?: number;
  cancel_status?: number;
  password?: string;
}

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

class Order {
  constructor(attributes: object) {
    Object.assign(this, attributes);
  }

  id: number = 0;
  status: number = 0;
  created_at: Date = new Date();
  expires_at: Date = new Date();
  type: number = 0;
  currency: number = 0;
  amount: number | null = null;
  has_range: boolean = false;
  min_amount: number = 0;
  max_amount: number = 0;
  payment_method: string = '';
  is_explicit: boolean = false;
  premium: number = 0;
  satoshis: number = 0;
  maker: number = 0;
  taker: number = 0;
  escrow_duration: number = 0;
  total_secs_exp: number = 0;
  penalty: Date | undefined = undefined;
  is_maker: boolean = false;
  is_taker: boolean = false;
  is_participant: boolean = false;
  has_password: boolean = false;
  maker_status: 'Active' | 'Seen recently' | 'Inactive' = 'Active';
  taker_status: 'Active' | 'Seen recently' | 'Inactive' = 'Active';
  price_now: number | undefined = undefined;
  satoshis_now: number = 0;
  latitude: number = 0;
  longitude: number = 0;
  password: string | undefined = undefined;
  description: string | undefined = undefined;
  premium_now: number | undefined = undefined;
  tg_enabled: boolean = false; // deprecated
  tg_token: string = '';
  tg_bot_name: string = '';
  is_buyer: boolean = false;
  is_seller: boolean = false;
  maker_nick: string = '';
  maker_hash_id: string = '';
  maker_nostr_pubkey: string = '';
  taker_nick: string = '';
  taker_hash_id: string = '';
  taker_nostr_pubkey: string = '';
  status_message: string = '';
  is_fiat_sent: boolean = false;
  is_disputed: boolean = false;
  ur_nick: string = '';
  maker_locked: boolean = false;
  taker_locked: boolean = false;
  escrow_locked: boolean = false;
  trade_satoshis: number = 0;
  bond_invoice: string = '';
  bond_satoshis: number = 0;
  escrow_invoice: string = '';
  escrow_satoshis: number = 0;
  invoice_amount: number = 0;
  swap_allowed: boolean = false;
  swap_failure_reason: string = '';
  suggested_mining_fee_rate: number = 0;
  swap_fee_rate: number = 0;
  pending_cancel: boolean = false;
  asked_for_cancel: boolean = false;
  statement_submitted: boolean = false;
  retries: number = 0;
  next_retry_time: Date = new Date();
  failure_reason: string = '';
  invoice_expired: boolean = false;
  public_duration: number = 0;
  bond_size: string = '';
  trade_fee_percent: number = 0;
  bond_size_sats: number = 0;
  bond_size_percent: number = 0;
  chat_last_index: number = 0;
  maker_summary: TradeRobotSummary = {
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
  };

  taker_summary: TradeRobotSummary = {
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
  };

  platform_summary: TradeCoordinatorSummary = {
    contract_timestamp: new Date(),
    contract_total_time: 0,
    contract_exchange_rate: 0,
    routing_budget_sats: 0,
    trade_revenue_sats: 0,
  };

  expiry_reason: number = 0;
  expiry_message: string = '';
  num_satoshis: number = 0;
  sent_satoshis: number = 0;
  txid: string = '';
  tx_queued: boolean = false;
  address: string = '';
  network: 'mainnet' | 'testnet' = 'mainnet';
  shortAlias: string = '';
  bad_request?: string = '';
  bad_address?: string = '';
  bad_invoice?: string = '';
  bad_statement?: string = '';

  update = (attributes: object): Order => {
    Object.assign(this, attributes);
    return this;
  };

  make: (federation: Federation, slot: Slot) => Promise<this> = async (federation, slot) => {
    const body = {
      type: this.type,
      currency: this.currency,
      amount: this.has_range ? null : this.amount,
      has_range: this.has_range,
      min_amount: this.min_amount,
      max_amount: this.max_amount,
      payment_method: this.payment_method,
      is_explicit: this.is_explicit,
      premium: this.is_explicit ? null : this.premium,
      satoshis: this.is_explicit ? this.satoshis : null,
      public_duration: this.public_duration,
      escrow_duration: this.escrow_duration,
      bond_size: this.bond_size,
      latitude: this.latitude,
      longitude: this.longitude,
      password: this.password,
      description: this.description,
    };

    if (slot) {
      const coordinator = federation.getCoordinator(this.shortAlias);
      const authHeaders = slot.getRobot()?.getAuthHeaders();
      if (!authHeaders) return this;
      const data = await apiClient
        .post(coordinator.url, '/api/make/', body, authHeaders)
        .catch((e) => {
          console.log(e);
        });
      if (data) this.update(data);
    }

    return this;
  };

  take: (federation: Federation, slot: Slot, takeAmount: string) => Promise<this> = async (
    federation,
    slot,
    takeAmount,
  ) => {
    return await this.submitAction(federation, slot, {
      action: 'take',
      password: this?.password,
      amount: this?.currency === 1000 ? Number(takeAmount) / 100000000 : Number(takeAmount),
    });
  };

  submitAction: (federation: Federation, slot: Slot, action: SubmitActionProps) => Promise<this> =
    async (federation, slot, action) => {
      if (this.id < 1) return this;

      if (slot) {
        const coordinator = federation.getCoordinator(this.shortAlias);
        const data = await apiClient
          .post(coordinator.url, `/api/order/?order_id=${Number(this.id)}`, action, {
            tokenSHA256: slot?.getRobot()?.tokenSHA256 ?? '',
          })
          .catch((e) => {
            console.log(e);
          });
        if (data) this.update(data);
      }
      return this;
    };

  fecth: (federation: Federation, slot: Slot) => Promise<this> = async (federation, slot) => {
    if (this.id < 1) return this;
    if (!slot) return this;

    const coordinator = federation.getCoordinator(this.shortAlias);
    const authHeaders = slot.getRobot()?.getAuthHeaders();
    if (!authHeaders) return this;
    const data = await apiClient
      .get(coordinator.url, `/api/order/?order_id=${this.id}`, authHeaders)
      .catch((e) => {
        console.log(e);
      });

    if (data) this.update(data);

    return this;
  };
}

export default Order;
