class Robot {
  constructor(garageRobot?: Robot) {
    if (garageRobot != null) {
      this.token = garageRobot?.token ?? undefined;
      this.tokenSHA256 = garageRobot?.tokenSHA256 ?? '';
      this.pubKey = garageRobot?.pubKey ?? undefined;
      this.encPrivKey = garageRobot?.encPrivKey ?? undefined;
    }
  }

  public nickname?: string;
  public token?: string;
  public bitsEntropy?: number;
  public shannonEntropy?: number;
  public tokenSHA256: string = '';
  public pubKey?: string;
  public encPrivKey?: string;
  public stealthInvoices: boolean = true;
  public activeOrderId?: number;
  public lastOrderId?: number;
  public earnedRewards: number = 0;
  public tgEnabled: boolean = false;
  public tgBotName: string = 'unknown';
  public tgToken: string = 'unknown';
  public loading: boolean = true;
  public found: boolean = false;
  public last_login: string = '';
  public copiedToken: boolean = false;
  public avatarLoaded: boolean = false;
}

export default Robot;
