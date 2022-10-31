import { systemClient } from '../services/System';

export interface Robot {
  nickname: string | null;
  token: string | null;
  pubKey: string | null;
  encPrivKey: string | null;
  bitsEntropy: number | null;
  shannonEntropy: number | null;
  stealthInvoices: boolean;
  activeOrderId: number | null;
  lastOrderId: number | null;
  earnedRewards: number;
  referralCode: string;
  tgEnabled: boolean;
  tgBotName: string;
  tgToken: string;
  loading: boolean;
  avatarLoaded: boolean;
  copiedToken: boolean;
}

const pubKeyCookie = systemClient.getCookie('pub_key');
const privKeyCookie = systemClient.getCookie('enc_priv_key');

export const defaultRobot: Robot = {
  nickname: null,
  token: systemClient.getCookie('robot_token') ?? null,
  pubKey: pubKeyCookie ? pubKeyCookie.split('\\').join('\n') : null,
  encPrivKey: privKeyCookie ? privKeyCookie.split('\\').join('\n') : null,
  bitsEntropy: null,
  shannonEntropy: null,
  stealthInvoices: true,
  activeOrderId: null,
  lastOrderId: null,
  earnedRewards: 0,
  referralCode: '',
  tgEnabled: false,
  tgBotName: 'unknown',
  tgToken: 'unknown',
  loading: false,
  avatarLoaded: false,
  copiedToken: false,
};

export default Robot;
