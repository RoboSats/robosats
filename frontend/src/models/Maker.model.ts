import defaultFederation from '../../static/federation.json';
import { systemClient } from '../services/System';

/** Return coordinator aliases from the live voted manifest, falling back to the seed. */
function getLiveFederationKeys(): string[] {
  try {
    const cached = systemClient.getSyncItem?.('federation_manifest');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        if (keys.length > 0) return keys;
      }
    }
  } catch {
    /* ignore */
  }
  return Object.keys(defaultFederation);
}

export interface Maker {
  advancedOptions: boolean;
  coordinator: string;
  isExplicit: boolean;
  amount: number | null;
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
  minAmount: number | null;
  maxAmount: number | null;
  badSatoshisText: string;
  badPremiumText: string;
  latitude: number | null;
  longitude: number | null;
  password: string | null;
  description: string | null;
  badDescription: boolean;
}

export const defaultMaker: Maker = {
  advancedOptions: false,
  coordinator: (() => {
    const keys = getLiveFederationKeys();
    return keys[Math.floor(Math.random() * keys.length)] ?? '';
  })(),
  isExplicit: false,
  amount: null,
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
  minAmount: null,
  maxAmount: null,
  badPremiumText: '',
  badSatoshisText: '',
  latitude: null,
  longitude: null,
  password: null,
  description: null,
  badDescription: false,
};

export default Maker;
