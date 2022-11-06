import { systemClient } from '../services/System';

class Robot {
  constructor() {
    this.token = systemClient.getCookie('robot_token') ?? undefined;
    this.pubKey = systemClient.getCookie('pub_key') ?? undefined;
    this.encPrivKey = systemClient.getCookie('enc_priv_key') ?? undefined;
  }

  public nickname?: string;
  public token?: string;
  public pubKey?: string;
  public encPrivKey?: string;
  public bitsEntropy?: number;
  public shannonEntropy?: number;
  public stealthInvoices: boolean = true;
  public activeOrderId?: number;
  public lastOrderId?: number;
  public earnedRewards: number = 0;
  public referralCode: string = '';
  public tgEnabled: boolean = false;
  public tgBotName: string = 'unknown';
  public tgToken: string = 'unknown';
  public loading: boolean = false;
  public avatarLoaded: boolean = false;
  public copiedToken: boolean = false;
}

export default Robot;
