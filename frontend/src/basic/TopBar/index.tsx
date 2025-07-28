import React, { useContext, useState } from 'react';
import { Button, Grid, Tooltip } from '@mui/material';
import { Menu as MenuIcon, Notifications } from '@mui/icons-material';
import MenuDrawer from './MenuDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import { AppContext, UseAppStoreType } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';

const TopBar = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { windowSize, settings } = useContext<UseAppStoreType>(AppContext);

  const [showMenuDrawer, setShowMenuDrawer] = useState<boolean>(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);

  const mobileView = windowSize?.width < 50;

  return (
    <Grid container direction='row' justifyContent='space-between' spacing={1}>
      {mobileView && (
        <Grid item>
          <Button
            size='large'
            color='inherit'
            aria-label='open menu drawer'
            onClick={() => setShowMenuDrawer((s) => !s)}
          >
            <MenuIcon />
          </Button>
        </Grid>
      )}
      <span></span>
      <Tooltip
        title={t('You need to enable nostr to receive notifications.')}
        disableHoverListener={settings.connection === 'nostr'}
      >
        <Grid item>
          <LoadingButton
            aria-label='open notifications drawer'
            color='primary'
            size='large'
            onClick={() => setShowNotificationsDrawer((s) => !s)}
            disabled={settings.connection !== 'nostr'}
            loading={loadingNotifications && settings.connection === 'nostr'}
            endIcon={<Notifications />}
          />
        </Grid>
      </Tooltip>
      <MenuDrawer show={showMenuDrawer} setShow={setShowMenuDrawer} />
      <NotificationsDrawer
        show={showNotificationsDrawer}
        setShow={setShowNotificationsDrawer}
        setLoading={setLoadingNotifications}
      />
    </Grid>
  );
};

export default TopBar;
