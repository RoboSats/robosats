export interface Maker {
  isExplicit: boolean;
  amount: number | string;
  paymentMethod: string[];
  paymentMethodText: string;
  badPaymentMethod: boolean;
  premium: number | string;
  satoshis: string;
  publicExpiryTime: Date;
  publicDuration: number;
  escrowExpiryTime: Date;
  escrowDuration: number;
  bondSize: number;
  amountRange: boolean;
  minAmount: string;
  maxAmount: string;
  badSatoshisText: string;
  badPremiumText: string;
}

export default Maker;
