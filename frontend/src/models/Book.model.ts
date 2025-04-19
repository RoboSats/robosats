export interface PublicOrder {
  id: number;
  created_at: Date;
  expires_at: Date;
  type: number;
  currency: number | null;
  amount: string;
  base_price?: number;
  has_range: boolean;
  min_amount: string | null;
  max_amount: string | null;
  payment_method: string;
  is_explicit: false;
  premium: string;
  satoshis: number | null;
  satoshis_now: number | null;
  latitude: number | null;
  longitude: number | null;
  bond_size: string;
  maker: number | null;
  escrow_duration: number;
  maker_nick: string | null;
  maker_hash_id: string | null;
  price: number | null;
  maker_status?: 'Active' | 'Seen recently' | 'Inactive';
  coordinatorShortAlias?: string;
  link?: string;
  federated?: boolean;
}

export interface Book {
  orders: PublicOrder[];
  loading: boolean;
}

export default PublicOrder;
