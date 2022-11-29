import { Info } from '.';

export interface Coordinator {
  alias: string;
  enabled: boolean;
  description: string | undefined;
  motto: string | undefined;
  logo: string;
  color: string;
  contact: {
    email: string | undefined;
    telegram: string | undefined;
    matrix: string | undefined;
    twitter: string | undefined;
    website: string | undefined;
  };
  mainnetOnion: string | undefined;
  mainnetClearnet: string | undefined;
  testnetOnion: string | undefined;
  testnetClearnet: string | undefined;
  mainnetNodesPubkeys: string[];
  testnetNodesPubkeys: string[];
  info: Info | undefined;
  loadingInfo: boolean;
}

export default Coordinator;
