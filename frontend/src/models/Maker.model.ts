export interface Maker {
  advancedOptions: boolean;
  coordinator: string;
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

export const defaultMaker: Maker = {
  advancedOptions: false,
  coordinator: 'exp',
  isExplicit: false,
  amount: '',
  paymentMethods: [],
  paymentMethodsText: 'not specified',
  badPaymentMethod: false,
  premium: '',
  satoshis: '',
  publicExpiryTime: new Date(0, 0, 0, 23, 59),
  publicDuration: 86340,
  escrowExpiryTime: new Date(0, 0, 0, 3, 0),
  escrowDuration: 10800,
  bondSize: 3,
  minAmount: '',
  maxAmount: '',
  badPremiumText: '',
  badSatoshisText: '',
};

export default Maker;
