import BaseSettings from './Settings.model';

class SettingsSelfhostedPro extends BaseSettings {
  constructor() {
    super();
  }

  public frontend: 'basic' | 'pro' = 'pro';
  public selfhostedClient: boolean = true;
}

export default SettingsSelfhostedPro;
