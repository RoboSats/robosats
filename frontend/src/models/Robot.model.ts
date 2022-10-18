export interface Robot {
  nickname: string | null;
  token: string | null;
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

export const defaultRobot: Robot = {
  nickname: null,
  token: null,
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
  loading: true,
  avatarLoaded: false,
  copiedToken: false,
};

export default Robot;
