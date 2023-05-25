export interface PublicOrder {
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
  bond_size: number;
  maker: number;
  escrow_duration: number;
  maker_nick: string;
  price: number;
  maker_status: 'Active' | 'Seen recently' | 'Inactive';
  coordinatorShortAlias?: string;
}

export interface Book {
  orders: PublicOrder[];
  loading: boolean;
  loadedCoordinators: number;
  totalCoordinators: number;
}

export default PublicOrder;
