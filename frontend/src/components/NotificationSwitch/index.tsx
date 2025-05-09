import React, { useContext, useEffect, useState } from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { NotificationsActive, NotificationsOff } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { systemClient } from '../../services/System';

const NotificationSwitchBadge = (): React.JSX.Element => {
  const { setSettings, settings, torStatus } = useContext<UseAppStoreType>(AppContext);
  const theme = useTheme();

  const [stopNotifications, setStopNotifications] = useState<boolean>(settings.stopNotifications);

  useEffect(() => {
    setStopNotifications(settings.stopNotifications);
  }, [settings.stopNotifications]);

  const onClick = (): void => {
    if (torStatus === 'ON' || !settings.useProxy) {
      setSettings({ ...settings, stopNotifications: !settings.stopNotifications });
      systemClient.setItem('settings_stop_notifications', String(!settings.stopNotifications));
    }
  };

  const style = {
    width: 20,
    height: 20,
    color: stopNotifications ? theme.palette.secondary.main : theme.palette.primary.main,
  };

  return (
    <Box sx={{ display: 'inline-flex', position: 'fixed', right: '0.5em', top: '0.5em' }}>
      <Box>
        {torStatus === 'ON' || !settings.useProxy ? (
          <>
            {stopNotifications ? (
              <NotificationsOff sx={style} onClick={onClick} />
            ) : (
              <NotificationsActive sx={style} onClick={onClick} />
            )}
          </>
        ) : (
          <CircularProgress thickness={6} size={22} />
        )}
      </Box>
    </Box>
  );
};

export default NotificationSwitchBadge;
