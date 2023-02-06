import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Paper, useTheme } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { Settings, Favorites } from '../../models';

interface SettingsPageProps {
  fav: Favorites;
  setFav: (state: Favorites) => void;
  settings: Settings;
  setSettings: (state: Settings) => void;
  windowSize: { width: number; height: number };
}

const SettingsPage = ({
  fav,
  setFav,
  settings,
  setSettings,
  windowSize,
}: SettingsPageProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();
  const maxHeight = windowSize.height * 0.85 - 3;

  return (
    <Paper
      elevation={12}
      sx={{ padding: '0.6em', width: '18em', maxHeight: `${maxHeight}em`, overflow: 'auto' }}
    >
      <Grid container>
        <Grid item>
          <SettingsForm
            fav={fav}
            setFav={setFav}
            settings={settings}
            setSettings={setSettings}
            showNetwork={!(window.NativeRobosats === undefined)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
