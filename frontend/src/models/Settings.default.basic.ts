import { systemClient } from '../services/System';
import BaseSettings from './Settings.model';

class Settings extends BaseSettings {
  constructor() {
    super();
    const fontSizeCookie = systemClient.getCookie('settings_fontsize_basic');
    this.fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 14;
  }
  public frontend: 'basic' | 'pro' = 'basic';
}

export default Settings;
