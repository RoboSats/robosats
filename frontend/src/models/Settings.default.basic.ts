import BaseSettings from './Settings.model';

class Settings extends BaseSettings {
  constructor() {
    super();
  }

  public frontend: 'basic' | 'pro' = 'basic';
}

export default Settings;
