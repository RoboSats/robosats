import i18n from '../i18n/Web';
import { systemClient } from '../services/System';
import type Coordinator from './Coordinator.model';

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

export interface Settings {
  frontend: 'basic' | 'pro';
  mode: 'light' | 'dark';
  fontSize: number;
  language: Language;
  freezeViewports: boolean;
  network: 'mainnet' | 'testnet' | undefined;
  coordinator: Coordinator | undefined;
  unsafeClient: boolean;
  hostedClient: boolean;
}

const modeCookie: 'light' | 'dark' | '' = systemClient.getCookie('settings_mode');
const mode: 'light' | 'dark' =
  modeCookie !== ''
    ? modeCookie
    : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const languageCookie = systemClient.getCookie('settings_language');
const language: Language =
  languageCookie !== ''
    ? languageCookie
    : i18n.resolvedLanguage == null
    ? 'en'
    : i18n.resolvedLanguage.substring(0, 2);

export const baseSettings: Settings = {
  frontend: 'basic',
  mode: mode,
  fontSize: 14,
  language: language,
  freezeViewports: false,
  network: undefined,
  coordinator: undefined,
  unsafeClient: false,
  hostedClient: false,
};

export default Settings;
