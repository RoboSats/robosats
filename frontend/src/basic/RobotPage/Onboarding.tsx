import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Collapse, Grid, LinearProgress, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { Casino, Download, ContentCopy, SmartToy, Bolt, Check } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { genBase62Token } from '../../utils';

interface OnboardingProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  getGenerateRobot: (token: string) => void;
  badRequest: string | undefined;
  setPage: (state: Page) => void;
  baseUrl: string;
}

const Onboarding = ({
  robot,
  inputToken,
  setInputToken,
  setRobot,
  badRequest,
  getGenerateRobot,
  setPage,
  baseUrl,
}: OnboardingProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [step, setStep] = useState<'1' | '2' | '3'>('1');
  const [generatedToken, setGeneratedToken] = useState<boolean>(false);
  const [showMimickProgress, setShowMimickProgress] = useState<boolean>(false);

  const generateToken = () => {
    setGeneratedToken(true);
    setInputToken(genBase62Token(36));
    setShowMimickProgress(true);
    setTimeout(() => setShowMimickProgress(false), 1000);
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={2}>
      <Grid item>
        <Typography variant='h5' color={step == '1' ? 'text.primary' : 'text.disabled'}>
          {t('1. Generate a token')}
        </Typography>
        <Collapse in={step == '1'}>
          <Grid container direction='column' alignItems='center' spacing={1} paddingLeft={4}>
            <Grid item>
              <Typography>
                {t(
                  'This temporary key gives you access to a unique and private robot identity for your trade.',
                )}
              </Typography>
            </Grid>
            {!generatedToken ? (
              <Grid item>
                <Button autoFocus onClick={generateToken} variant='contained' size='large'>
                  <Casino />
                  {t('Generate token')}
                </Button>
              </Grid>
            ) : (
              <Grid item>
                <Collapse in={generatedToken}>
                  <Grid container direction='column' alignItems='center' spacing={1}>
                    <Grid item>
                      <Alert variant='outlined' severity='info'>
                        <b>{`${t('Store it somewhere safe!')} `}</b>
                        {t(
                          `This token is the one and only key to your robot and trade. You will need it later to recover your order or check it's status.`,
                        )}
                      </Alert>
                    </Grid>
                    <Grid item sx={{ width: '100%' }}>
                      {showMimickProgress ? (
                        <LinearProgress sx={{ height: '0.7em' }} />
                      ) : (
                        <TokenInput
                          inputToken={inputToken}
                          setInputToken={setInputToken}
                          setRobot={setRobot}
                          badRequest={badRequest}
                          robot={robot}
                          onPressEnter={() => null}
                          badRequest={badRequest}
                        />
                      )}
                    </Grid>
                    <Grid item>
                      <Typography>
                        {t('You can also add your own random characters into the token or')}
                        <Button size='small' onClick={generateToken}>
                          <Casino />
                          {t('roll again')}
                        </Button>
                      </Typography>
                    </Grid>

                    <Grid item>
                      <Button
                        onClick={() => {
                          setStep('2');
                          getGenerateRobot(inputToken);
                          setRobot({ ...robot, nickname: null });
                        }}
                        variant='contained'
                        size='large'
                      >
                        <Check />
                        {t('Continue')}
                      </Button>
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>
            )}
          </Grid>
        </Collapse>

        <Grid item>
          <Typography variant='h5' color={step == '2' ? 'text.primary' : 'text.disabled'}>
            {t('2. Meet your robot identity')}
          </Typography>
        </Grid>

        <Collapse in={step == '2'}>
          <Grid container direction='column' alignItems='center' spacing={1} paddingLeft={4}>
            {robot.avatarLoaded && robot.nickname ? (
              <Grid item>
                <Typography>{t('Hi! My name is')}</Typography>
                <Typography component='h5' variant='h5'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      height: '3.2em',
                    }}
                  >
                    <Bolt
                      sx={{
                        color: '#fcba03',
                        height: '1.5em',
                        width: '1.5em',
                      }}
                    />
                    <a>{robot.nickname}</a>
                    <Bolt
                      sx={{
                        color: '#fcba03',
                        height: '1.5em',
                        width: '1.5em',
                      }}
                    />
                  </div>
                </Typography>
              </Grid>
            ) : (
              <Grid item>
                <Typography>{t('Your robot is under consctruction!')}</Typography>
              </Grid>
            )}

            <Grid item sx={{ width: '15em' }}>
              <RobotAvatar
                nickname={robot.nickname}
                smooth={true}
                style={{ maxWidth: '12.5em', maxHeight: '12.5em' }}
                placeholderType='generating'
                imageStyle={{
                  transform: '',
                  border: '2px solid #555',
                  filter: 'drop-shadow(1px 1px 1px #000000)',
                  height: '12.4em',
                  width: '12.4em',
                }}
                tooltip={t('This is your trading avatar')}
                tooltipPosition='top'
                baseUrl={baseUrl}
              />
            </Grid>

            <Grid item>
              <Button onClick={() => setStep('3')} variant='contained' size='large'>
                <Check />
                {t('Continue')}
              </Button>
            </Grid>
          </Grid>
        </Collapse>

        <Grid item>
          <Typography variant='h5' color={step == '3' ? 'text.primary' : 'text.disabled'}>
            {t('3. Browse or create an order')}
          </Typography>
          <Collapse in={step == '3'}>
            <Grid container direction='column' alignItems='center' spacing={1} paddingLeft={4}>
              Marketplace See Offers contained buttonm Create Offer container button If you need
              help fire away on our support public Telegram group! Support Telegram Group My profile
              not contained button
            </Grid>
          </Collapse>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Onboarding;
