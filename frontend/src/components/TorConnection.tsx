import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { TorIcon } from './Icons';
import { useTranslation } from 'react-i18next';

const TorConnection = (): JSX.Element => {
  const [torStatus, setTorStatus] = useState<string>('NOTINIT');
  const { t } = useTranslation();

  const getTorStatus = () => {
    setTorStatus(window?.NativeRobosats?.torDaemonStatus || 'NOTINIT');
    setInterval(getTorStatus, 1000);
  };

  useEffect(() => {
    getTorStatus();
  }, []);

  if (window?.NativeRobosats && (torStatus === 'NOTINIT' || torStatus === 'STARTING')) {
    return (
      <Box sx={{ display: 'inline-flex', position: 'fixed', left: '0.5em', top: '0.5em' }}>
        <Tooltip open={true} placement='right' title={t('Connecting to TOR network')}>
          <CircularProgress color='warning' thickness={6} size={23} />
        </Tooltip>
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TorIcon color='warning' sx={{ width: 20, height: 20 }} />
        </Box>
      </Box>
    );
  } else if (window?.NativeRobosats && (torStatus === '"Done"' || torStatus === 'DONE')) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          left: '0.5em',
          top: '0.5em',
        }}
      >
        <Tooltip
          enterTouchDelay={0}
          enterDelay={1000}
          placement='right'
          title={t('Connected to TOR network')}
        >
          <TorIcon color='success' sx={{ width: 20, height: 20 }} />
        </Tooltip>
      </Box>
    );
  } else if (true) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          left: '0.5em',
          top: '0.5em',
        }}
      >
        <Tooltip open={true} placement='right' title={t('TOR connection error')}>
          <TorIcon color='error' sx={{ width: 20, height: 20 }} />
        </Tooltip>
      </Box>
    );
  }
};

export default TorConnection;
