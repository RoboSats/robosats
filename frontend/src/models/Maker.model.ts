export interface Maker {
  isExplicit: boolean;
  amount: string;
  paymentMethods: string[];
  paymentMethodsText: string;
  badPaymentMethod: boolean;
  premium: number | string;
  satoshis: string;
  publicExpiryTime: Date;
  publicDuration: number;
  escrowExpiryTime: Date;
  escrowDuration: number;
  bondSize: number;
  minAmount: string;
  maxAmount: string;
  badSatoshisText: string;
  badPremiumText: string;
}

export default Maker;
