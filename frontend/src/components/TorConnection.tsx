import React, { useEffect, useState } from 'react';
import { IconButton } from '@mui/material';
import { TorIcon } from './Icons';

const TorConnection = (): JSX.Element => {
  const [torStatus, setTorStatus] = useState<string>('NOTINIT');

  const torStatusColor = () => {
    if (torStatus === 'NOTINIT' || torStatus === 'STARTING') {
      return 'warning';
    } else if (torStatus === '"Done"' || torStatus === 'DONE') {
      return 'success';
    } else {
      return 'error';
    }
  };

  const getTorStatus = () => {
    setTorStatus(window?.NativeRobosats?.torDaemonStatus || 'NOTINIT');
    setInterval(getTorStatus, 1000);
  };

  useEffect(() => {
    getTorStatus();
  }, []);

  return window?.NativeRobosats ? (
    <IconButton color={torStatusColor()} sx={{ position: 'fixed', left: '0px' }}>
      <TorIcon sx={{ width: 18, height: 18 }} />
    </IconButton>
  ) : (
    <></>
  );
};

export default TorConnection;
