import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  CircularProgress,
  Box,
  Alert,
  Typography,
  useTheme,
  AlertTitle,
  styled,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import { TorIcon } from '../../components/Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';

const RobotPage = (): JSX.Element => {
  const { torStatus, settings, page, client } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const params = useParams();
  const urlToken = settings.selfhostedClient ? params.token : null;
  const theme = useTheme();

  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'profile'>(
    garage.currentSlot !== null ? 'profile' : 'welcome',
  );

  useEffect(() => {
    const token = urlToken ?? garage.currentSlot;
    if (token !== undefined && token !== null && page === 'garage') {
      setInputToken(token);
      if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
        setView('profile');
      }
    }
  }, [torStatus, page]);

  if (settings.useProxy && client === 'mobile' && !(torStatus === 'ON')) {
    return (
      <StyledConnectingBox>
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
              <CircularProgress thickness={3} sx={{ width: '11.2em', height: '11.2em' }} />
              <StyledTorIconBox>
                <TorIcon
                  sx={{
                    fill: 'url(#linearColors)',
                    width: '6em',
                    height: '6em',
                    position: 'relative',
                    left: '0.7em',
                  }}
                />
              </StyledTorIconBox>
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
      </StyledConnectingBox>
    );
  } else {
    return (
      <StyledMainBox>
        <RecoveryDialog setInputToken={setInputToken} setView={setView} />
        {view === 'welcome' && <Welcome setView={setView} width={1200} />}

        {view === 'onboarding' && (
          <Onboarding setView={setView} inputToken={inputToken} setInputToken={setInputToken} />
        )}

        {view === 'profile' && (
          <RobotProfile
            setView={setView}
            width={1200}
            inputToken={inputToken}
            setInputToken={setInputToken}
          />
        )}
      </StyledMainBox>
    );
  }
};

// Styled components
const StyledConnectingBox = styled(Box)({
  width: '100vw',
  height: 'auto',
  backgroundColor: 'transparent',
});

const StyledTorIconBox = styled(Box)({
  position: 'fixed',
  top: '4.6em',
  backgroundColor: 'transparent',
});

const StyledMainBox = styled(Box)({
  width: '100vw',
  height: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2em',
  backgroundColor: 'transparent',
  border: 'none',
  boxShadow: 'none',
});

export default RobotPage;
