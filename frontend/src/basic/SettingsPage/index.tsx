import React, { useContext } from 'react';
import { Grid, Paper } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContext, hostUrl, type UseAppStoreType } from '../../contexts/AppContext';
import FederationTable from '../../components/FederationTable';

const SettingsPage = (): JSX.Element => {
  const {
    windowSize,
    navbarHeight,
    federation,
    fetchCoordinatorInfo,
    dispatchFederation,
    setFocusedCoordinator,
    settings,
    setOpen,
    open,
  } = useContext<UseAppStoreType>(AppContext);
  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;

  return (
    <Paper
      elevation={12}
      sx={{
        padding: '0.6em',
        width: '20.5em',
        maxHeight: `${maxHeight}em`,
        overflow: 'auto',
        overflowX: 'clip',
      }}
    >
      <Grid container>
        <Grid item>
          <SettingsForm showNetwork={!(window.NativeRobosats === undefined)} />
        </Grid>
        <Grid item>
          <FederationTable
            federation={federation}
            dispatchFederation={dispatchFederation}
            setFocusedCoordinator={setFocusedCoordinator}
            openCoordinator={() => {
              setOpen({ ...open, coordinator: true });
            }}
            fetchCoordinatorInfo={fetchCoordinatorInfo}
            baseUrl={hostUrl}
            maxHeight={14}
            network={settings.network}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
