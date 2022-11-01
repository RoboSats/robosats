import { systemClient } from '../services/System';
import { baseSettings, Settings } from './Settings.model';

const fontSizeCookie = systemClient.getCookie('settings_fontsize_pro');
const fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 12;

export const defaultSettings: Settings = {
  ...baseSettings,
  frontend: 'pro',
  fontSize: fontSize,
};

export default defaultSettings;
