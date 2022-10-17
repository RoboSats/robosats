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
  loading: boolean;
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
  loading: true,
  copiedToken: false,
};

export default Robot;
