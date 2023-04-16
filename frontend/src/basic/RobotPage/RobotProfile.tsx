import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Grid,
  LinearProgress,
  Typography,
  Alert,
  Select,
  MenuItem,
  Box,
  useTheme,
  Tooltip,
} from '@mui/material';
import { Bolt, Add, DeleteSweep, Logout, Download } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { Page } from '../NavBar';
import { Slot, Robot } from '../../models';
import { AppContext, AppContextProps } from '../../contexts/AppContext';
import { genBase62Token } from '../../utils';
import { LoadingButton } from '@mui/lab';

interface RobotProfileProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  getGenerateRobot: (token: string, slot?: number) => void;
  inputToken: string;
  setCurrentOrder: (state: number) => void;
  logoutRobot: () => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  setPage: (state: Page) => void;
  baseUrl: string;
  badRequest: string;
  width: number;
}

const RobotProfile = ({
  robot,
  setRobot,
  inputToken,
  getGenerateRobot,
  setInputToken,
  setCurrentOrder,
  logoutRobot,
  setPage,
  setView,
  badRequest,
  baseUrl,
  width,
}: RobotProfileProps): JSX.Element => {
  const { currentSlot, garage, setCurrentSlot, windowSize } =
    useContext<AppContextProps>(AppContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (robot.nickname && robot.avatarLoaded) {
      setLoading(false);
    }
  }, [robot]);

  const handleAddRobot = () => {
    getGenerateRobot(genBase62Token(36), garage.slots.length);
    setLoading(true);
  };

  const handleChangeSlot = (e) => {
    const slot = e.target.value;
    getGenerateRobot(garage.slots[slot].robot.token, slot);
    setLoading(true);
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1} padding={1} paddingTop={2}>
      <Grid
        item
        container
        direction='column'
        alignItems='center'
        spacing={1}
        sx={{ width: '100%' }}
      >
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
          {robot.found && !robot.lastOrderId ? (
            <Typography align='center' variant='h6'>
              {t('Welcome back!')}
            </Typography>
          ) : (
            <></>
          )}
        </Grid>

        {robot.activeOrderId && robot.avatarLoaded && robot.nickname ? (
          <Grid item>
            <Button
              onClick={() => {
                navigate('/order/' + robot.activeOrderId);
                setPage('order');
                setCurrentOrder(robot.activeOrderId);
              }}
            >
              {t('Active order #{{orderID}}', { orderID: robot.activeOrderId })}
            </Button>
          </Grid>
        ) : null}

        {robot.lastOrderId && robot.avatarLoaded && robot.nickname ? (
          <Grid item container direction='column' alignItems='center'>
            <Grid item>
              <Button
                onClick={() => {
                  navigate('/order/' + robot.lastOrderId);
                  setPage('order');
                  setCurrentOrder(robot.lastOrderId);
                }}
              >
                {t('Last order #{{orderID}}', { orderID: robot.lastOrderId })}
              </Button>
            </Grid>
            <Grid item>
              <Alert severity='warning'>
                <Grid container direction='column' alignItems='center'>
                  <Grid item>
                    {t(
                      'Reusing trading identity degrades your privacy against other users, coordinators and observers.',
                    )}
                  </Grid>
                  <Grid item sx={{ position: 'relative', right: '1em' }}>
                    <Button color='success' size='small' onClick={handleAddRobot}>
                      <Add />
                      {t('Add a new Robot')}
                    </Button>
                  </Grid>
                </Grid>
              </Alert>
            </Grid>
          </Grid>
        ) : null}

        <Grid
          item
          container
          direction='row'
          justifyContent='stretch'
          alignItems='stretch'
          sx={{ width: '100%' }}
        >
          <Grid
            item
            xs={2}
            sx={{ display: 'flex', justifyContent: 'stretch', alignItems: 'stretch' }}
          >
            <Tooltip enterTouchDelay={0} enterDelay={300} enterNextDelay={1000} title={t('Logout')}>
              <Button
                sx={{ minWidth: '2em', width: '100%' }}
                color='primary'
                variant='outlined'
                onClick={() => {
                  logoutRobot();
                  setView('welcome');
                }}
              >
                <Logout />
              </Button>
            </Tooltip>
          </Grid>
          <Grid item xs={10}>
            <TokenInput
              inputToken={inputToken}
              editable={false}
              label={t('Store your token safely')}
              setInputToken={setInputToken}
              setRobot={setRobot}
              badRequest={badRequest}
              robot={robot}
              onPressEnter={() => null}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item sx={{ width: '100%' }}>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '4px',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
          }}
        >
          <Grid container direction='column' alignItems='center' spacing={2} padding={2}>
            <Grid item sx={{ width: '100%' }}>
              <Typography variant='caption'>{t('Robot Garage')}</Typography>
              <Select
                fullWidth
                required={true}
                inputProps={{
                  style: { textAlign: 'center' },
                }}
                value={loading ? 'loading' : currentSlot}
                onChange={handleChangeSlot}
              >
                {loading ? (
                  <MenuItem key={'loading'} value={'loading'}>
                    <Typography>{t('Building...')}</Typography>
                  </MenuItem>
                ) : (
                  garage.slots.map((slot: Slot, index: number) => {
                    return (
                      <MenuItem key={index} value={index}>
                        <Grid
                          container
                          direction='row'
                          justifyContent='flex-start'
                          alignItems='center'
                          style={{ height: '2.8em' }}
                          spacing={1}
                        >
                          <Grid item>
                            <RobotAvatar
                              nickname={slot.robot.nickname}
                              smooth={true}
                              style={{ width: '2.6em', height: '2.6em' }}
                              placeholderType='loading'
                              baseUrl={baseUrl}
                            />
                          </Grid>
                          <Grid item>
                            <Typography variant={windowSize.width < 26 ? 'caption' : undefined}>
                              {slot.robot.nickname}
                            </Typography>
                          </Grid>
                        </Grid>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </Grid>

            <Grid item container direction='row' alignItems='center' justifyContent='space-evenly'>
              <Grid item>
                <LoadingButton loading={loading} color='primary' onClick={handleAddRobot}>
                  <Add /> <div style={{ width: '0.5em' }} />
                  {t('Add Robot')}
                </LoadingButton>
              </Grid>

              {window.NativeRobosats === undefined ? (
                <Grid item>
                  <Button color='primary' onClick={() => garage.download()}>
                    <Download />
                  </Button>
                </Grid>
              ) : null}

              <Grid item>
                <Button
                  color='primary'
                  onClick={() => {
                    garage.delete();
                    setCurrentSlot(0);
                    logoutRobot();
                    setView('welcome');
                  }}
                >
                  <DeleteSweep /> <div style={{ width: '0.5em' }} />
                  {t('Delete Garage')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default RobotProfile;
