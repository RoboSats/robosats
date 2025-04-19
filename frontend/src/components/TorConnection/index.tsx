import React, { useContext } from 'react';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { TorIcon } from '../Icons';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

interface TorIndicatorProps {
  color: 'inherit' | 'error' | 'warning' | 'success' | 'primary' | 'secondary' | 'info' | undefined;
  tooltipOpen?: boolean | undefined;
  title: string;
  progress: boolean;
}

const TorIndicator = ({
  color,
  tooltipOpen = undefined,
  title,
  progress,
}: TorIndicatorProps): JSX.Element => {
  return (
    <Tooltip
      open={tooltipOpen}
      enterTouchDelay={0}
      enterDelay={1000}
      placement='right'
      title={title}
    >
      <Box sx={{ display: 'inline-flex', position: 'fixed', left: '0.5em', top: '0.5em' }}>
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
        )}
      </Box>
    </Tooltip>
  );
};

const TorConnectionBadge = (): JSX.Element => {
  const { torStatus, settings } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();

  if (!settings.useProxy) {
    return <></>;
  }

  if (torStatus === 'OFF' || torStatus === 'STOPPING') {
    return (
      <TorIndicator
        color='primary'
        progress={true}
        tooltipOpen={true}
        title={t('Initializing TOR daemon')}
      />
    );
  } else if (torStatus === 'STARTING') {
    return (
      <TorIndicator
        color='warning'
        progress={true}
        tooltipOpen={true}
        title={t('Connecting to TOR network')}
      />
    );
  } else if (torStatus === 'ON') {
    return <TorIndicator color='success' progress={false} title={t('Connected to TOR network')} />;
  } else {
    return (
      <TorIndicator
        color='error'
        progress={false}
        tooltipOpen={true}
        title={t('Connection error')}
      />
    );
  }
};

export default TorConnectionBadge;
