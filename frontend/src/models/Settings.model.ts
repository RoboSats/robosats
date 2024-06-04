import i18n from '../i18n/Web';
import { systemClient } from '../services/System';
import { apiClient } from '../services/api';
import { getHost } from '../utils';

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
  | 'sw'
  | 'zh-SI'
  | 'zh-TR';

class BaseSettings {
  constructor() {
    const modeCookie: 'light' | 'dark' | '' = systemClient.getItem('settings_mode');
    this.mode =
      modeCookie !== ''
        ? modeCookie
        : window?.matchMedia('(prefers-color-scheme: dark)')?.matches
          ? 'dark'
          : 'light';

    this.lightQRs = systemClient.getItem('settings_light_qr') === 'true';

    const languageCookie = systemClient.getItem('settings_language');
    this.language =
      languageCookie !== ''
        ? languageCookie
        : i18n.resolvedLanguage == null
          ? 'en'
          : i18n.resolvedLanguage.substring(0, 2);

    const networkCookie = systemClient.getItem('settings_network');

    this.network = networkCookie && networkCookie !== '' ? networkCookie : 'mainnet';
    this.host = getHost();

    const useProxy = systemClient.getItem('settings_use_proxy');
    this.useProxy =
      useProxy === 'true' || (useProxy !== 'false' && window.NativeRobosats !== undefined);

    apiClient.useProxy = this.useProxy;
  }

  public frontend: 'basic' | 'pro' = 'basic';
  public mode: 'light' | 'dark' = 'light';
  public fontSize: number = 14;
  public lightQRs: boolean = false;
  public language?: Language;
  public freezeViewports: boolean = false;
  public network: 'mainnet' | 'testnet' = 'mainnet';
  public host?: string;
  public unsafeClient: boolean = false;
  public selfhostedClient: boolean = false;
  public useProxy: boolean;
}

export default BaseSettings;
