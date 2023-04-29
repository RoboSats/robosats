import i18n from '../i18n/Web';
import { systemClient } from '../services/System';

export type Language =
  | 'en'
  | 'es'
  | 'ru'
  | 'de'
  | 'pl'
  | 'fr'
  | 'ca'
  | 'it'
  | 'pt'
  | 'eu'
  | 'cs'
  | 'th'
  | 'pl'
  | 'sv'
  | 'zh-SI'
  | 'zh-TR';

class BaseSettings {
  constructor() {
    const modeCookie: 'light' | 'dark' | '' = systemClient.getItem('settings_mode');
    this.mode =
      modeCookie !== ''
        ? modeCookie
        : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    const languageCookie = systemClient.getItem('settings_language');
    this.language =
      languageCookie !== ''
        ? languageCookie
        : i18n.resolvedLanguage == null
        ? 'en'
        : i18n.resolvedLanguage.substring(0, 2);

    const networkCookie = systemClient.getItem('settings_network');
    this.network = networkCookie !== '' ? networkCookie : 'mainnet';
  }

  public frontend: 'basic' | 'pro' = 'basic';
  public mode: 'light' | 'dark' = 'light';
  public fontSize: number = 14;
  public language?: Language;
  public freezeViewports: boolean = false;
  public network: 'mainnet' | 'testnet' | undefined = undefined;
  public host?: string;
  public unsafeClient: boolean = false;
  public selfhostedClient: boolean = false;
}

export default BaseSettings;
