import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Button, Link, Grid, LinearProgress, Typography, Alert } from '@mui/material';
import { Bolt, Logout, Refresh } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { Page } from '../NavBar';
import { Robot } from '../../models';
import { genBase62Token } from '../../utils';

interface RobotProfileProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  inputToken: string;
  setCurrentOrder: (state: number) => void;
  logoutRobot: () => void;
  setInputToken: (state: string) => void;
  getGenerateRobot: (token: string) => void;
  setPage: (state: Page) => void;
  baseUrl: string;
  badRequest: string;
  robotFound: boolean;
  width: number;
}

const RobotProfile = ({
  robot,
  setRobot,
  inputToken,
  setInputToken,
  setCurrentOrder,
  getGenerateRobot,
  logoutRobot,
  setPage,
  setView,
  badRequest,
  baseUrl,
  robotFound,
  width,
}: RobotProfileProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const getNewRobot = () => {
    logoutRobot();
    setTimeout(() => getGenerateRobot(genBase62Token(36)), 10);
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={2} padding={2}>
      <Grid item sx={{ height: '2.3em', position: 'relative' }}>
        {robot.avatarLoaded && robot.nickname ? (
          <Typography align='center' component='h5' variant='h5'>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {width < 19 ? null : (
                <Bolt
                  sx={{
                    color: '#fcba03',
                    height: '1.5em',
                    width: '1.5em',
                  }}
                />
              )}
              <b>{robot.nickname}</b>
              {width < 19 ? null : (
                <Bolt
                  sx={{
                    color: '#fcba03',
                    height: '1.5em',
                    width: '1.5em',
                  }}
                />
              )}
            </div>
          </Typography>
        ) : (
          <>
            <b>{t('Building your robot!')}</b>
            <LinearProgress />
          </>
        )}
      </Grid>

      <Grid item sx={{ width: `13.5em` }}>
        <RobotAvatar
          nickname={robot.nickname}
          smooth={true}
          style={{ maxWidth: '12.5em', maxHeight: '12.5em' }}
          placeholderType='generating'
          imageStyle={{
            transform: '',
            border: '2px solid #555',
            filter: 'drop-shadow(1px 1px 1px #000000)',
            height: `12.4em`,
            width: `12.4em`,
          }}
          tooltip={t('This is your trading avatar')}
          tooltipPosition='top'
          baseUrl={baseUrl}
        />
      </Grid>

      {robotFound ? (
        <Grid item>
          <Typography variant='subtitle2' color='primary'>
            {t('Welcome back!')}
          </Typography>
        </Grid>
      ) : (
        <></>
      )}

      {robot.activeOrderId ? (
        <Grid item>
          <Typography>
            {t('One active order')}
            <Link
              onClick={() => {
                history.push('/order/' + robot.activeOrderId);
                setPage('order');
                setCurrentOrder(robot.activeOrderId);
              }}
            >
              {` #${robot.activeOrderId}`}
            </Link>
          </Typography>
        </Grid>
      ) : null}

      {robot.lastOrderId ? (
        <Grid item>
          <Typography align='center'>
            {t('Your past order')}
            <Link
              onClick={() => {
                history.push('/order/' + robot.lastOrderId);
                setPage('order');
                setCurrentOrder(robot.lastOrderId);
              }}
            >
              {` #${robot.lastOrderId}`}
            </Link>
          </Typography>
          <Alert severity='warning'>
            <Grid container direction='column' alignItems='center'>
              <Grid item>
                {t(
                  'Reusing trading identity degrades your privacy against other users, coordinators and observers.',
                )}
              </Grid>
              <Grid item sx={{ position: 'relative', right: '1em' }}>
                <Button color='inherit' size='small' onClick={getNewRobot}>
                  <Refresh />
                  {t('Generate a new Robot')}
                </Button>
              </Grid>
            </Grid>
          </Alert>
        </Grid>
      ) : null}

      <Grid item sx={{ width: '100%' }}>
        <TokenInput
          inputToken={inputToken}
          editable={false}
          showDownload={true}
          label={t('Store your token safely')}
          setInputToken={setInputToken}
          setRobot={setRobot}
          badRequest={badRequest}
          robot={robot}
          onPressEnter={() => null}
        />
      </Grid>

      <Grid item>
        <Button
          disabled={!(robot.avatarLoaded && robot.nickname)}
          size='small'
          color='primary'
          onClick={() => {
            logoutRobot();
            setView('welcome');
          }}
        >
          <Logout /> <div style={{ width: '0.5em' }} />
          {t('Logout Robot')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default RobotProfile;
