import { systemClient } from '../services/System';

class Robot {
  constructor(garageRobot?: Robot) {
    if (garageRobot) {
      this.token = garageRobot?.token ?? undefined;
      this.pubKey = garageRobot?.pubKey ?? undefined;
      this.encPrivKey = garageRobot?.encPrivKey ?? undefined;
    }
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
  public found: boolean = false;
  public avatarLoaded: boolean = false;
  public copiedToken: boolean = false;
}

export default Robot;
