import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  MenuItem,
  useTheme,
  Grid,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';

import Flags from 'country-flag-icons/react/3x2';
import { CataloniaFlag, BasqueCountryFlag } from '../Icons';
import type { Language } from '../../models';

const menuLanuguages = [
  { name: 'English', i18nCode: 'en', flag: Flags.US },
  { name: 'Español', i18nCode: 'es', flag: Flags.ES },
  { name: 'Deutsch', i18nCode: 'de', flag: Flags.DE },
  { name: 'Polski', i18nCode: 'pl', flag: Flags.PL },
  { name: 'Français', i18nCode: 'fr', flag: Flags.FR },
  { name: 'Русский', i18nCode: 'ru', flag: Flags.RU },
  { name: '日本語', i18nCode: 'ja', flag: Flags.JP },
  { name: 'Italiano', i18nCode: 'it', flag: Flags.IT },
  { name: 'Português', i18nCode: 'pt', flag: Flags.BR },
  { name: '简体', i18nCode: 'zh-si', flag: Flags.CN },
  { name: '繁體', i18nCode: 'zh-tr', flag: Flags.CN },
  { name: 'Svenska', i18nCode: 'sv', flag: Flags.SE },
  { name: 'Čeština', i18nCode: 'cs', flag: Flags.CZ },
  { name: 'ภาษาไทย', i18nCode: 'th', flag: Flags.TH },
  { name: 'Català', i18nCode: 'ca', flag: CataloniaFlag },
  { name: 'Euskara', i18nCode: 'eu', flag: BasqueCountryFlag },
];

interface SelectLanguageProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const SelectLanguage: React.FC<SelectLanguageProps> = ({ language, setLanguage }) => {
  const theme = useTheme();
  const { i18n } = useTranslation();

  const flagProps = {
    width: 1.5 * theme.typography.fontSize,
    height: 1.5 * theme.typography.fontSize,
  };

  const handleChangeLang = function (e: SelectChangeEvent): void {
    setLanguage(e.target.value);
    void i18n.changeLanguage(e.target.value);
  };

  return (
    <Select
      fullWidth={true}
      value={language}
      inputProps={{
        style: { textAlign: 'center' },
      }}
      onChange={handleChangeLang}
    >
      {menuLanuguages.map((language, index) => (
        <MenuItem key={index} value={language.i18nCode}>
          <Grid container>
            <Grid item style={{ width: '1.9em', position: 'relative', top: '0.15em' }}>
              <language.flag {...flagProps} />
            </Grid>
            <Grid item>
              <Typography variant='inherit'>{language.name}</Typography>
            </Grid>
          </Grid>
        </MenuItem>
      ))}
    </Select>
  );
};

export default SelectLanguage;
