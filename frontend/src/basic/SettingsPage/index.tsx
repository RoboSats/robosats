import React, { useContext } from 'react';
import { Grid, Paper } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';

const SettingsPage = (): JSX.Element => {
  const { windowSize, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;

  return (
    <Paper
      elevation={12}
      sx={{
        padding: '0.6em',
        width: '21em',
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
