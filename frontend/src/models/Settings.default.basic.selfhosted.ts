import { systemClient } from '../services/System';
import BaseSettings from './Settings.model';

class Settings extends BaseSettings {
  constructor() {
    super();
    const fontSizeCookie = systemClient.getItem('settings_fontsize_basic');
    this.fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 14;
  }

  public frontend: 'basic' | 'pro' = 'basic';
  public selfhostedClient: boolean = true;
}

export default Settings;
