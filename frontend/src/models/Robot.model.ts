import { sha256 } from 'js-sha256';
import { hexToBase91 } from '../utils';

interface AuthHeaders {
  tokenSHA256: string;
  keys: {
    pubKey: string;
    encPrivKey: string;
  };
}

class Robot {
  constructor(attributes?: Record<any, any>) {
    if (attributes != null) {
      this.token = attributes?.token ?? undefined;
      this.tokenSHA256 =
        attributes?.tokenSHA256 ?? (this.token != null ? hexToBase91(sha256(this.token)) : '');
      this.pubKey = attributes?.pubKey ?? undefined;
      this.encPrivKey = attributes?.encPrivKey ?? undefined;
    }
  }

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
  public shortAlias: string = '';

  update = (attributes: Record<string, any>): void => {
    Object.assign(this, attributes);
  };

  getAuthHeaders = (): AuthHeaders | null => {
    const tokenSHA256 = this.tokenSHA256 ?? '';
    const encPrivKey = this.encPrivKey ?? '';
    const pubKey = this.pubKey ?? '';

    return {
      tokenSHA256,
      keys: {
        pubKey: pubKey.split('\n').join('\\'),
        encPrivKey: encPrivKey.split('\n').join('\\'),
      },
    };
  };
}

export default Robot;
