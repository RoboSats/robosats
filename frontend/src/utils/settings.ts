import SettingsSelfhosted from '../models/Settings.default.basic.selfhosted';
import SettingsSelfhostedPro from '../models/Settings.default.pro.selfhosted';
import SettingsPro from '../models/Settings.default.pro';
import { Settings } from '../models';

export const getSettings = (): Settings => {
  let settings;

  const [client, view] = window.RobosatsSettings.split('-');
  if (client === 'selfhosted') {
    settings = view === 'pro' ? new SettingsSelfhostedPro() : new SettingsSelfhosted();
  } else {
    settings = view === 'pro' ? new SettingsPro() : new Settings();
  }
  return settings;
};

export default getSettings;
