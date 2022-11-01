import { systemClient } from '../services/System';
import { baseSettings, Settings } from './Settings.model';

const fontSizeCookie = systemClient.getCookie('settings_fontsize_basic');
const fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 14;

export const defaultSettings: Settings = {
  ...baseSettings,
  frontend: 'basic',
  fontSize: fontSize,
};

export default defaultSettings;
