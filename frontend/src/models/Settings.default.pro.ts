import BaseSettings from './Settings.model';

class SettingsPro extends BaseSettings {
  constructor() {
    super();
  }

  public frontend: 'basic' | 'pro' = 'pro';
}

export default SettingsPro;
