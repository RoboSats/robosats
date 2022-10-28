import i18n from '../i18n/Web';
import type Coordinator from './Coordinator.model';
import type Language from './Language.model';

export interface Settings {
  frontend: 'basic' | 'pro';
  mode: 'light' | 'dark';
  fontSize: number;
  language: Language;
  freezeViewports: boolean;
  network: 'mainnet' | 'testnet' | undefined;
  coordinator: Coordinator | undefined;
}

export const baseSettings: Settings = {
  frontend: 'basic',
  mode:
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  fontSize: 14,
  language: i18n.resolvedLanguage == null ? 'en' : i18n.resolvedLanguage.substring(0, 2),
  freezeViewports: false,
  network: undefined,
  coordinator: undefined,
};

export default Settings;
