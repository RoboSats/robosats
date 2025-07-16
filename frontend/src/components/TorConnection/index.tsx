import React, { useContext } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TorIcon } from '../Icons';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

const TorConnectionBadge = (): React.JSX.Element => {
  const { torStatus } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();

  let color:
    | 'inherit'
    | 'error'
    | 'warning'
    | 'success'
    | 'primary'
    | 'secondary'
    | 'info'
    | undefined = 'error';
  let progress = true;
  let title = t('Connection error');

  if (torStatus === 'OFF' || torStatus === 'STOPPING') {
    color = 'primary';
    progress = true;
    title = t('Initializing Tor daemon');
  } else if (torStatus === 'STARTING') {
    color = 'warning';
    progress = true;
    title = t('Connecting to Tor network');
  } else if (torStatus === 'ON') {
    color = 'success';
    progress = false;
    title = t('Connected to Tor network');
  }

  return (
    <Box sx={{ display: 'inline-flex' }}>
      {progress ? (
        <>
          <CircularProgress color={color} thickness={6} size={22} />
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
            <TorIcon color={color} sx={{ width: 20, height: 20 }} />
          </Box>
        </>
      ) : (
        <Box>
          <TorIcon color={color} sx={{ width: 20, height: 20 }} />
        </Box>
      )}{' '}
      {title}
    </Box>
  );
};

export default TorConnectionBadge;
