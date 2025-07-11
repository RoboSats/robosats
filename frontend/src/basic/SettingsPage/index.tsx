import React, { useContext } from 'react';
import { Grid, Paper } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import Coordinators from './Coordinators';

const SettingsPage = (): React.JSX.Element => {
  const { windowSize, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;
  return (
    <Paper
      elevation={12}
      sx={{
        padding: '0.6em',
        width: '22.5em',
        maxHeight: `${maxHeight}em`,
        overflow: 'auto',
        overflowX: 'clip',
      }}
    >
      <Grid item xs={{ width: '100%' }}>
        <SettingsForm />
      </Grid>
      <Grid item xs={{ width: '100%' }}>
        <Coordinators />
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
