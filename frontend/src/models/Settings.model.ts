import i18n from '../i18n/Web';
import { systemClient } from '../services/System';
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
    const [client] = window.RobosatsSettings.split('-');
    this.client = client as 'web' | 'mobile';

    this.host = getHost();

    systemClient.getItem('settings_mode').then((mode) => {
      this.mode = mode !== '' ? (mode as 'light' | 'dark') : this.getMode();
    });

    systemClient.getItem('settings_fontsize_basic').then((fontSizeCookie) => {
      this.fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 14;
    });

    systemClient.getItem('settings_light_qr').then((result) => {
      this.lightQRs = result === 'true';
    });

    systemClient.getItem('settings_language').then((result) => {
      this.language =
        result !== ''
          ? (result as Language)
          : i18n.resolvedLanguage == null
            ? 'en'
            : (i18n.resolvedLanguage.substring(0, 2) as Language);
    });

    systemClient.getItem('settings_connection').then((result) => {
      this.connection = result && result !== '' ? (result as 'api' | 'nostr') : this.connection;
    });

    systemClient.getItem('settings_network').then((result) => {
      this.network = result && result !== '' ? (result as 'mainnet' | 'testnet') : 'mainnet';
    });

    systemClient.getItem('settings_notifications').then((result) => {
      this.androidNotifications = !result ? client === 'mobile' : result === 'true';
    });

    systemClient.getItem('settings_use_proxy').then((result) => {
      this.useProxy = client === 'mobile' && result !== 'false';
    });

    systemClient.getItem('settings_garage_mode').then((result) => {
      if (result && result !== '') {
        this.garageMode = result as 'legacy' | 'garageKey';
      }
    });
  }

  getMode = (): 'light' | 'dark' => {
    return (systemClient.getSyncItem?.('settings_mode') as 'light' | 'dark') ||
      window?.matchMedia('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : 'light';
  };

  public frontend: 'basic' | 'pro' = 'basic';
  public mode: 'light' | 'dark' = this.getMode();
  public client: 'web' | 'mobile' = 'web';
  public fontSize: number = 14;
  public lightQRs: boolean = false;
  public language?: Language;
  public freezeViewports: boolean = false;
  public network?: 'mainnet' | 'testnet';
  public connection: 'api' | 'nostr' = 'nostr';
  public host?: string;
  public unsafeClient: boolean = false;
  public selfhostedClient: boolean = false;
  public useProxy: boolean = false;
  public androidNotifications: boolean = false;
  public garageMode: 'legacy' | 'garageKey' = 'garageKey';
}

export default BaseSettings;
