import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Paper, useTheme } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContextProps, AppContext } from '../../contexts/AppContext';

const SettingsPage = (): JSX.Element => {
  const { windowSize, navbarHeight } = useContext<AppContextProps>(AppContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;

  return (
    <Paper
      elevation={12}
      sx={{
        padding: '0.6em',
        width: '18em',
        maxHeight: `${maxHeight}em`,
        overflow: 'auto',
        overflowX: 'clip',
      }}
    >
      <Grid container>
        <Grid item>
          <SettingsForm showNetwork={!(window.NativeRobosats === undefined)} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
