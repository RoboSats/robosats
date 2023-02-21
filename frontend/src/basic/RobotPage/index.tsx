import React, { useEffect, useState } from 'react';
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

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { tokenStrength } from '../../utils';
import { systemClient } from '../../services/System';
import { apiClient } from '../../services/api';
import { genKey } from '../../pgp';
import { sha256 } from 'js-sha256';
import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import Recovery from './Recovery';
import { TorIcon } from '../../components/Icons';

interface RobotPageProps {
  setPage: (state: Page) => void;
  setCurrentOrder: (state: number) => void;
  torStatus: 'NOTINIT' | 'STARTING' | '"Done"' | 'DONE';
  robot: Robot;
  setRobot: (state: Robot) => void;
  windowSize: { width: number; height: number };
  baseUrl: string;
}

const RobotPage = ({
  setPage,
  setCurrentOrder,
  torStatus,
  windowSize,
  robot,
  setRobot,
  baseUrl,
}: RobotPageProps): JSX.Element => {
  const { t } = useTranslation();
  const params = useParams();
  const refCode = params.refCode;
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;
  const theme = useTheme();

  const [robotFound, setRobotFound] = useState<boolean>(false);
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
      getGenerateRobot(robot.token);
    }
  }, []);

  const getGenerateRobot = (token: string) => {
    const strength = tokenStrength(token);
    setRobot({ ...robot, loading: true, avatarLoaded: false });
    setInputToken(token);

    const requestBody = genKey(token).then(function (key) {
      return {
        token_sha256: sha256(token),
        public_key: key.publicKeyArmored,
        encrypted_private_key: key.encryptedPrivateKeyArmored,
        unique_values: strength.uniqueValues,
        counts: strength.counts,
        length: token.length,
        ref_code: refCode,
      };
    });

    requestBody.then(
      async (body) =>
        await apiClient.post(baseUrl, '/api/user/', body).then((data: any) => {
          setRobotFound(data?.found);
          setBadRequest(data?.bad_request);
          setCurrentOrder(
            data.active_order_id
              ? data.active_order_id
              : data.last_order_id
              ? data.last_order_id
              : null,
          );
          // Add nick and token to App state (token only if not a bad request)
          data.bad_request
            ? setRobot({
                ...robot,
                avatarLoaded: true,
                loading: false,
                nickname: data.nickname ?? robot.nickname,
                activeOrderId: data.active_order_id ?? null,
                referralCode: data.referral_code ?? robot.referralCode,
                earnedRewards: data.earned_rewards ?? robot.earnedRewards,
                lastOrderId: data.last_order_id ?? robot.lastOrderId,
                stealthInvoices: data.wants_stealth ?? robot.stealthInvoices,
                tgEnabled: data.tg_enabled,
                tgBotName: data.tg_bot_name,
                tgToken: data.tg_token,
              })
            : setRobot({
                ...robot,
                nickname: data.nickname,
                token,
                loading: false,
                activeOrderId: data.active_order_id ?? null,
                lastOrderId: data.last_order_id ?? null,
                referralCode: data.referral_code,
                earnedRewards: data.earned_rewards ?? 0,
                stealthInvoices: data.wants_stealth,
                tgEnabled: data.tg_enabled,
                tgBotName: data.tg_bot_name,
                tgToken: data.tg_token,
                bitsEntropy: data.token_bits_entropy,
                shannonEntropy: data.token_shannon_entropy,
                pubKey: data.public_key,
                encPrivKey: data.encrypted_private_key,
                copiedToken: data.found ? true : robot.copiedToken,
              }) &
              systemClient.setItem('robot_token', token) &
              systemClient.setItem('pub_key', data.public_key.split('\n').join('\\')) &
              systemClient.setItem(
                'enc_priv_key',
                data.encrypted_private_key.split('\n').join('\\'),
              );
        }),
    );
  };

  const deleteRobot = () => {
    apiClient.delete(baseUrl, '/api/user');
    logoutRobot();
  };

  const logoutRobot = () => {
    setInputToken('');
    setRobotFound(false);
    systemClient.deleteCookie('sessionid');
    systemClient.deleteItem('robot_token');
    systemClient.deleteItem('pub_key');
    systemClient.deleteItem('enc_priv_key');
    setTimeout(() => setRobot(new Robot()), 10);
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
            setRobot={setRobot}
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
            robotFound={robotFound}
            setRobot={setRobot}
            setCurrentOrder={setCurrentOrder}
            badRequest={badRequest}
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
            setRobot={setRobot}
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
