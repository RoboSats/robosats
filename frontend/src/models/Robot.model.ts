import { sha256 } from 'js-sha256';
import { hexToBase91 } from '../utils';
import { robohash } from '../components/RobotAvatar/RobohashGenerator';
import { generate_roboname } from 'robo-identities-wasm';

interface AuthHeaders {
  tokenSHA256: string;
  keys: {
    pubKey: string;
    encPrivKey: string;
  };
}

class Robot {
  constructor(garageRobot?: Robot) {
    if (garageRobot != null) {
      this.token = garageRobot?.token ?? undefined;
      this.hashId = garageRobot?.hashId ?? undefined;
      this.tokenSHA256 =
        garageRobot?.tokenSHA256 ?? (this.token != null ? hexToBase91(sha256(this.token)) : '');
      this.pubKey = garageRobot?.pubKey ?? undefined;
      this.encPrivKey = garageRobot?.encPrivKey ?? undefined;
    }
  }

  public nickname?: string;
  public token?: string;
  public hashId?: string;
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

    // generate robo identity
    if (attributes.token != null) {
      const hashId = sha256(sha256(attributes.token));
      this.hashId = hashId;
      this.nickname = generate_roboname(hashId);
      // trigger RoboHash avatar generation in webworker and store in RoboHash class cache.
      robohash.generate(hashId, 'small');
      robohash.generate(hashId, 'large');
    }
  };

  getAuthHeaders = (): AuthHeaders | null => {
    if (this.token === undefined) return null;

    const tokenSHA256 = hexToBase91(sha256(this.token));
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
