import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Paper, useTheme } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { Settings } from '../../models';

interface SettingsPageProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
  windowSize: { width: number; height: number };
}

const SettingsPage = ({ settings, setSettings, windowSize }: SettingsPageProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();
  const maxHeight = windowSize.height * 0.85 - 3;

  return (
    <Paper
      elevation={12}
      sx={{ padding: '0.6em', width: '17.25em', maxHeight: `${maxHeight}em`, overflow: 'auto' }}
    >
      <Grid container>
        <Grid item>
          <SettingsForm settings={settings} setSettings={setSettings} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
