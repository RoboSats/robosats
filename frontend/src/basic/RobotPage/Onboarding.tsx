import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Collapse,
  Grid,
  LinearProgress,
  Link,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Page } from '../NavBar';
import { Robot } from '../../models';
import { Casino, Bolt, Check, Storefront, AddBox, School } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { genBase62Token } from '../../utils';
import { NewTabIcon } from '../../components/Icons';

interface OnboardingProps {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
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
  setView,
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
  const navigate = useNavigate();

  const [step, setStep] = useState<'1' | '2' | '3'>('1');
  const [generatedToken, setGeneratedToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateToken = () => {
    setGeneratedToken(true);
    setInputToken(genBase62Token(36));
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const changePage = function (newPage: Page) {
    setPage(newPage);
    navigate(`/${newPage}`);
  };

  return (
    <Box>
      <Accordion expanded={step === '1'} disableGutters={true}>
        <AccordionSummary>
          <Typography variant='h5' color={step == '1' ? 'text.primary' : 'text.disabled'}>
            {t('1. Generate a token')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
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
                          `This token is the one and only key to your robot and trade. You will need it later to recover your order or check its status.`,
                        )}
                      </Alert>
                    </Grid>
                    <Grid item sx={{ width: '100%' }}>
                      <TokenInput
                        loading={loading}
                        autoFocusTarget='copyButton'
                        inputToken={inputToken}
                        setInputToken={setInputToken}
                        setRobot={setRobot}
                        badRequest={badRequest}
                        robot={robot}
                        onPressEnter={() => null}
                      />
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
                          setRobot({ ...robot, nickname: undefined });
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
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={step === '2'} disableGutters={true}>
        <AccordionSummary>
          <Typography variant='h5' color={step == '2' ? 'text.primary' : 'text.disabled'}>
            {t('2. Meet your robot identity')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' alignItems='center' spacing={1}>
            <Grid item>
              <Typography>
                {robot.avatarLoaded && robot.nickname ? (
                  t('This is your trading avatar')
                ) : (
                  <>
                    <b>{t('Building your robot!')}</b>
                    <LinearProgress />
                  </>
                )}
              </Typography>
            </Grid>

            <Grid item sx={{ width: '13.5em' }}>
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
                tooltipPosition='top'
                baseUrl={baseUrl}
              />
            </Grid>

            {robot.avatarLoaded && robot.nickname ? (
              <Grid item>
                <Typography align='center'>{t('Hi! My name is')}</Typography>
                <Typography component='h5' variant='h5'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Bolt
                      sx={{
                        color: '#fcba03',
                        height: '1.5em',
                        width: '1.5em',
                      }}
                    />
                    <b>{robot.nickname}</b>
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
            ) : null}
            <Grid item>
              <Collapse in={!!(robot.avatarLoaded && robot.nickname)}>
                <Button onClick={() => setStep('3')} variant='contained' size='large'>
                  <Check />
                  {t('Continue')}
                </Button>
              </Collapse>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={step === '3'} disableGutters={true}>
        <AccordionSummary>
          <Typography variant='h5' color={step == '3' ? 'text.primary' : 'text.disabled'}>
            {t('3. Browse or create an order')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' alignItems='center' spacing={1} padding={1.5}>
            <Grid item>
              <Typography>
                {t(
                  'RoboSats is a peer-to-peer marketplace. You can browse the public offers or create a new one.',
                )}
              </Typography>
            </Grid>

            <Grid item>
              <ButtonGroup variant='contained'>
                <Button color='primary' onClick={() => changePage('offers')}>
                  <Storefront /> <div style={{ width: '0.5em' }} />
                  {t('Offers')}
                </Button>
                <Button color='secondary' onClick={() => changePage('create')}>
                  <AddBox /> <div style={{ width: '0.5em' }} />
                  {t('Create')}
                </Button>
              </ButtonGroup>
            </Grid>

            <Grid item>
              <Typography>
                {`${t('If you need help on your RoboSats journey join our public support')} `}
                <Link target='_blank' href='https://t.me/robosats_es' rel='noreferrer'>
                  {t('Telegram group')}
                </Link>
                {`, ${t('or visit the robot school for documentation.')} `}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                sx={{ color: 'black' }}
                component={Link}
                href='https://learn.robosats.com'
                target='_blank'
                color='inherit'
                variant='contained'
              >
                <School /> <div style={{ width: '0.5em' }} />
                {t('Learn RoboSats')}
                <div style={{ width: '0.5em' }} />
                <NewTabIcon sx={{ width: '0.8em' }} />
              </Button>
            </Grid>
            <Grid item sx={{ position: 'relative', top: '0.6em' }}>
              <Button color='inherit' onClick={() => setView('profile')}>
                {t('See profile')}
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Onboarding;
