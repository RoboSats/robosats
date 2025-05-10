import defaultFederation from '../../static/federation.json';

export interface Maker {
  advancedOptions: boolean;
  coordinator: string;
  isExplicit: boolean;
  amount: string;
  paymentMethods: string[];
  paymentMethodsText: string;
  badPaymentMethod: boolean;
  premium: number | null;
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
  latitude: number;
  longitude: number;
}

export const defaultMaker: Maker = {
  advancedOptions: false,
  coordinator:
    Object.keys(defaultFederation)[
      Math.floor(Math.random() * Object.keys(defaultFederation).length)
    ] ?? '',
  isExplicit: false,
  amount: '',
  paymentMethods: [],
  paymentMethodsText: 'not specified',
  badPaymentMethod: false,
  premium: null,
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
  latitude: 0,
  longitude: 0,
};

export default Maker;
