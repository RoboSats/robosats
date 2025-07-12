import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Grid,
  CircularProgress,
  Box,
  Alert,
  Typography,
  useTheme,
  AlertTitle,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import { TorIcon } from '../../components/Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';

const RobotPage = (): React.JSX.Element => {
  const { torStatus, windowSize, settings, page, client } = useContext<UseAppStoreType>(AppContext);
  const { garage, slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const params = useParams();
  const urlToken = settings.selfhostedClient ? params.token : null;
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;
  const theme = useTheme();

  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'profile'>(
    garage.currentSlot !== null ? 'profile' : 'welcome',
  );

  useEffect(() => {
    const token = urlToken ?? garage.currentSlot;
    if (token !== undefined && token !== null && page === 'garage') {
      setInputToken(token.replace(/\s+/g, ''));
      if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
        setView('profile');
      }
    }
  }, [torStatus, page, slotUpdatedAt]);

  if (settings.useProxy && client === 'mobile' && !(torStatus === 'ON')) {
    return (
      <Paper
        elevation={12}
        style={{
          width: `${width}em`,
          maxHeight: `${maxHeight}em`,
        }}
      >
        <RecoveryDialog setInputToken={setInputToken} setView={setView} />
        <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
          <Grid item>
            <Typography align='center' variant='h6'>
              {t('Connecting to TOR')}
            </Typography>
          </Grid>
          <Grid item>
            <Box>
              <svg width={0} height={0}>
                <linearGradient id='linearColors' x1={1} y1={0} x2={1} y2={1}>
                  <stop offset={0} stopColor={theme.palette.primary.main} />
                  <stop offset={1} stopColor={theme.palette.secondary.main} />
                </linearGradient>
              </svg>
              <CircularProgress thickness={3} style={{ width: '11.2em', height: '11.2em' }} />
              <Box sx={{ position: 'fixed', top: '6.2em' }}>
                <TorIcon
                  sx={{
                    fill: 'url(#linearColors)',
                    width: '6em',
                    height: '6em',
                    position: 'relative',
                    left: '0.7em',
                  }}
                />
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Alert>
              <AlertTitle>{t('Connection encrypted and anonymized using TOR.')}</AlertTitle>
              {t(
                'This ensures maximum privacy, however you might feel the app behaves slow. If connection is lost, restart the app.',
              )}
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    );
  } else {
    return (
      <Paper
        elevation={12}
        style={{
          width: `${width}em`,
          maxHeight: `${maxHeight}em`,
          overflow: 'auto',
          overflowX: 'clip',
        }}
      >
        <RecoveryDialog setInputToken={setInputToken} setView={setView} />
        {view === 'welcome' ? (
          <Welcome setView={setView} width={width} setInputToken={setInputToken} />
        ) : null}

        {view === 'onboarding' ? (
          <Onboarding setView={setView} inputToken={inputToken} setInputToken={setInputToken} />
        ) : null}

        {view === 'profile' ? (
          <RobotProfile
            setView={setView}
            width={width}
            inputToken={inputToken}
            setInputToken={setInputToken}
          />
        ) : null}
      </Paper>
    );
  }
};

export default RobotPage;
