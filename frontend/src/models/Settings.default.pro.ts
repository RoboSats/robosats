import { baseSettings, Settings } from './Settings.model';

export const defaultSettings: Settings = {
  ...baseSettings,
  fontSize: 12,
  frontend: 'pro',
};

export default defaultSettings;
