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
import Recovery from './Recovery';
import { TorIcon } from '../../components/Icons';
import { genKey } from '../../pgp';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { validateTokenEntropy } from '../../utils';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const RobotPage = (): JSX.Element => {
  const { torStatus, windowSize, settings, page } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation, sortedCoordinators } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();
  const params = useParams();
  const urlToken = settings.selfhostedClient ? params.token : null;
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;
  const theme = useTheme();

  const [badToken, setBadToken] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'recovery' | 'profile'>(
    garage.currentSlot !== null ? 'profile' : 'welcome',
  );

  useEffect(() => {
    const token = urlToken ?? garage.currentSlot;
    if (token !== undefined && token !== null && page === 'robot') {
      setInputToken(token);
      if (window.NativeRobosats === undefined || torStatus === '"Done"') {
        getGenerateRobot(token);
        setView('profile');
      }
    }
  }, [torStatus, page]);

  useEffect(() => {
    if (inputToken.length < 20) {
      setBadToken(t('The token is too short'));
    } else if (!validateTokenEntropy(inputToken).hasEnoughEntropy) {
      setBadToken(t('Not enough entropy, make it more complex'));
    } else {
      setBadToken('');
    }
  }, [inputToken]);

  const getGenerateRobot = (token: string): void => {
    setInputToken(token);
    genKey(token)
      .then((key) => {
        garage.createRobot(token, sortedCoordinators, {
          token,
          pubKey: key.publicKeyArmored,
          encPrivKey: key.encryptedPrivateKeyArmored,
        });
        void federation.fetchRobot(garage, token);
        garage.currentSlot = token;
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const logoutRobot = (): void => {
    setInputToken('');
    garage.deleteSlot();
  };

  if (!(window.NativeRobosats === undefined) && !(torStatus === 'DONE' || torStatus === '"Done"')) {
    return (
      <Paper
        elevation={12}
        style={{
          width: `${width}em`,
          maxHeight: `${maxHeight}em`,
        }}
      >
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
              <Box sx={{ position: 'fixed', top: '4.6em' }}>
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
        {view === 'welcome' ? (
          <Welcome setView={setView} getGenerateRobot={getGenerateRobot} width={width} />
        ) : null}

        {view === 'onboarding' ? (
          <Onboarding
            setView={setView}
            badToken={badToken}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getGenerateRobot={getGenerateRobot}
          />
        ) : null}

        {view === 'profile' ? (
          <RobotProfile
            setView={setView}
            logoutRobot={logoutRobot}
            width={width}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getGenerateRobot={getGenerateRobot}
          />
        ) : null}

        {view === 'recovery' ? (
          <Recovery
            setView={setView}
            badToken={badToken}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getRecoverRobot={getGenerateRobot}
          />
        ) : null}
      </Paper>
    );
  }
};

export default RobotPage;
