import { systemClient } from '../services/System';
import BaseSettings from './Settings.model';

class Settings extends BaseSettings {
  constructor() {
    super();
    const fontSizeCookie = systemClient.getItem('settings_fontsize_pro');
    this.fontSize = fontSizeCookie !== '' ? Number(fontSizeCookie) : 12;
  }

  public frontend: 'basic' | 'pro' = 'pro';
  public selfhostedClient: boolean = true;
}

export default Settings;
