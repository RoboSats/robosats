import i18n from '../i18n/Web';
import { systemClient } from '../services/System';
import { websocketClient } from '../services/Websocket';
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

    const connection = systemClient.getItem('settings_connection');
    this.connection = connection && connection !== '' ? connection : this.connection;

    const networkCookie = systemClient.getItem('settings_network');
    this.network = networkCookie && networkCookie !== '' ? networkCookie : this.network;
    this.host = getHost();

    const [client] = window.RobosatsSettings.split('-');

    const stopNotifications = systemClient.getItem('settings_stop_notifications');
    this.stopNotifications = client === 'mobile' && stopNotifications === 'true';

    const useProxy = systemClient.getItem('settings_use_proxy');
    this.useProxy = client === 'mobile' && useProxy !== 'false';
    apiClient.useProxy = this.useProxy;
    websocketClient.useProxy = this.useProxy;
  }

  public frontend: 'basic' | 'pro' = 'basic';
  public mode: 'light' | 'dark' = 'light';
  public fontSize: number = 14;
  public lightQRs: boolean = false;
  public language?: Language;
  public freezeViewports: boolean = false;
  public network: 'mainnet' | 'testnet' = 'mainnet';
  public connection: 'api' | 'nostr' = 'nostr';
  public host?: string;
  public unsafeClient: boolean = false;
  public selfhostedClient: boolean = false;
  public useProxy: boolean;
  public stopNotifications: boolean;
}

export default BaseSettings;
