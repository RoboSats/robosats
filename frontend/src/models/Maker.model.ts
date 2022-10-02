export interface Maker {
  isExplicit: boolean;
  amount: number | string | null;
  paymentMethod: string[];
  paymentMethodText: string;
  badPaymentMethod: boolean;
  premium: string;
  satoshis: string;
  publicExpiryTime: Date;
  escrowExpiryTime: Date;
  bondSize: number;
  amountRange: boolean;
  minAmount: number | null;
  maxAmount: number | null;
  badExactPrice: number | string | null;
  badSatoshisText: string;
  badPremiumText: string;
}

export default Maker;
