import React from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, useTheme } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { Settings } from '../../models';

interface SettingsPageProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const SettingsPage = ({ settings, setSettings }: SettingsPageProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Paper elevation={12} sx={{ padding: '0.6em', width: '12em', height: '12em' }}>
      <SettingsForm settings={settings} setSettings={setSettings} />
    </Paper>
  );
};

export default SettingsPage;
