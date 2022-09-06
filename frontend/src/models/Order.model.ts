export interface Order {
  id: number;
  created_at: Date;
  expires_at: Date;
  type: number;
  currency: number;
  amount: string;
  base_amount?: number;
  has_range: boolean;
  min_amount: number;
  max_amount: number;
  payment_method: string;
  is_explicit: false;
  premium: number;
  satoshis: number;
  satoshis_now: number;
  bondless_taker: boolean;
  maker: number;
  escrow_duration: number;
  maker_nick: string;
  price: number;
  maker_status: 'Active' | 'Seen recently' | 'Inactive';
}

export default Order;
