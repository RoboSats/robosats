import BaseSettings from './Settings.model';

class SettingsSelfhosted extends BaseSettings {
  constructor() {
    super();
  }

  public frontend: 'basic' | 'pro' = 'basic';
  public selfhostedClient: boolean = true;
}

export default SettingsSelfhosted;
