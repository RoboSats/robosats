import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, useTheme } from '@mui/material';
import { Settings } from '../../models';
import SelectLanguage from './SelectLanguage';

interface SettingsFormProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const SettingsForm = ({ settings, setSettings }: SettingsFormProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item>
        <SelectLanguage
          language={settings.language}
          setLanguage={(language) => setSettings({ ...settings, language })}
        />
      </Grid>
    </Grid>
  );
};

export default SettingsForm;
