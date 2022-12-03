import { Info } from '.';
import { apiClient } from '../services/api';

export interface Contact {
  email?: string | undefined;
  telegram?: string | undefined;
  reddit?: string | undefined;
  matrix?: string | undefined;
  twitter?: string | undefined;
  website?: string | undefined;
}

export interface EndpointProps {
  bitcoin: 'mainnet' | 'testnet';
  network: 'Clearnet' | 'Onion' | 'I2P';
}
export class Coordinator {
  constructor(value: Coordinator) {
    this.alias = value.alias;
    this.description = value.description;
    this.motto = value.motto;
    this.color = value.color;
    this.contact = value.contact;
    this.mainnetOnion = value.mainnetOnion;
    this.mainnetClearnet = value.mainnetClearnet;
    this.mainnetI2P = value.mainnetI2P;
    this.testnetOnion = value.testnetOnion;
    this.testnetI2P = value.testnetI2P;
    this.mainnetNodesPubkeys = value.mainnetNodesPubkeys;
    this.testnetNodesPubkeys = value.testnetNodesPubkeys;
  }

  public alias: string;
  public enabled: boolean = true;
  public description: string;
  public motto: string;
  public color: string;
  public contact: Contact | undefined;
  public mainnetOnion: string | undefined;
  public mainnetClearnet: string | undefined;
  public mainnetI2P: string | undefined;
  public testnetOnion: string | undefined;
  public testnetClearnet: string | undefined;
  public testnetI2P: string | undefined;
  public mainnetNodesPubkeys: string[] | undefined;
  public testnetNodesPubkeys: string[] | undefined;
  public info?: Info | undefined = undefined;
  public loadingInfo: boolean = true;

  fetchInfo = ({ bitcoin, network }: EndpointProps) => {
    this.loadingInfo = true;
    const url = this[`${bitcoin}${network}`];
    if (url != undefined) {
      apiClient
        .get(url, '/api/info/', { mode: 'no-cors' })
        .then((data: Info) => {
          this.info = data;
        })
        .catch(() => {
          this.loadingInfo = false;
        })
        .finally(() => {
          this.loadingInfo = false;
        });
    }
  };
}

export default Coordinator;
