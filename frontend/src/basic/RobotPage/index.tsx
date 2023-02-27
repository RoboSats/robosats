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

import { Garage, Robot } from '../../models';
import { systemClient } from '../../services/System';
import { apiClient } from '../../services/api';
import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import Recovery from './Recovery';
import { TorIcon } from '../../components/Icons';
import { genKey } from '../../pgp';
import { AppContext, AppContextProps } from '../../contexts/AppContext';

const RobotPage = (): JSX.Element => {
  const {
    garage,
    setGarage,
    robot,
    setRobot,
    currentSlot,
    setPage,
    setCurrentOrder,
    fetchRobot,
    torStatus,
    windowSize,
    baseUrl,
  } = useContext<AppContextProps>(AppContext);
  const { t } = useTranslation();
  const params = useParams();
  const refCode = params.refCode;
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;
  const theme = useTheme();

  const [badRequest, setBadRequest] = useState<string | undefined>(undefined);
  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'recovery' | 'profile'>(
    robot.token ? 'profile' : 'welcome',
  );

  useEffect(() => {
    if (robot.token) {
      setInputToken(robot.token);
    }
    if (robot.nickname == null && robot.token) {
      fetchRobot({ action: 'login' });
    }
  }, []);

  const getGenerateRobot = (token: string, slot?: number) => {
    setInputToken(token);
    genKey(token).then(function (key) {
      fetchRobot({
        action: 'generate',
        newKeys: {
          pubKey: key.publicKeyArmored,
          encPrivKey: key.encryptedPrivateKeyArmored,
        },
        newToken: token,
        slot,
        refCode,
        setBadRequest,
      });
    });
  };

  const deleteRobot = () => {
    apiClient.delete(baseUrl, '/api/user');
    logoutRobot();
  };

  const logoutRobot = () => {
    setInputToken('');
    setRobot(new Robot());
  };

  if (!(window.NativeRobosats === undefined) && !(torStatus == 'DONE' || torStatus == '"Done"')) {
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
            robot={robot}
            setRobot={() => null}
            badRequest={badRequest}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getGenerateRobot={getGenerateRobot}
            setPage={setPage}
            baseUrl={baseUrl}
          />
        ) : null}

        {view === 'profile' ? (
          <RobotProfile
            setView={setView}
            robot={robot}
            setRobot={() => null}
            setCurrentOrder={setCurrentOrder}
            badRequest={badRequest}
            getGenerateRobot={getGenerateRobot}
            logoutRobot={logoutRobot}
            width={width}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getGenerateRobot={getGenerateRobot}
            setPage={setPage}
            baseUrl={baseUrl}
          />
        ) : null}

        {view === 'recovery' ? (
          <Recovery
            setView={setView}
            robot={robot}
            setRobot={() => null}
            badRequest={badRequest}
            inputToken={inputToken}
            setInputToken={setInputToken}
            getGenerateRobot={getGenerateRobot}
            setPage={setPage}
            baseUrl={baseUrl}
          />
        ) : null}
      </Paper>
    );
  }
};

export default RobotPage;
