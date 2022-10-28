import { baseSettings, Settings } from './Settings.model';

export const defaultSettings: Settings = {
  ...baseSettings,
  frontend: 'basic',
};

export default defaultSettings;
