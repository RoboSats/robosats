export interface Settings {
  mode: 'light' | 'dark';
  fontSize: number;
  language:
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
  freezeViewports: boolean;
}

export const baseSettings: Settings = {
  mode:
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  fontSize: 14,
  language: 'en',
  freezeViewports: false,
};

export default Settings;
