import React, { useContext, useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { type Robot } from '../../models';
import { Casino, Bolt, Check, AddBox, School, Search } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { genBase62Token } from '../../utils';
import { NewTabIcon } from '../../components/Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';

interface OnboardingProps {
  setView: (state: 'welcome' | 'onboarding' | 'profile') => void;
  robot: Robot;
  setRobot: (state: Robot) => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  baseUrl: string;
}

const Onboarding = ({ setView, inputToken, setInputToken }: OnboardingProps): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { navigateToPage, setOpen } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [step, setStep] = useState<'1' | '2' | '3'>('1');
  const [generatedToken, setGeneratedToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateToken = (): void => {
    setGeneratedToken(true);
    setInputToken(genBase62Token(36));
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const slot = garage.getSlot();

  return (
    <Box>
      <Accordion expanded={step === '1'} disableGutters={true}>
        <AccordionSummary>
          <Typography variant='h5' color={step === '1' ? 'text.primary' : 'text.disabled'}>
            {t('1. Generate a token')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid
            container
            spacing={1}
            sx={{ alignItems: 'center', flexDirection: 'column', padding: 1 }}
          >
            <Grid>
              <Typography>
                {t(
                  'This temporary key gives you access to a unique and private robot identity for your trade.',
                )}
              </Typography>
            </Grid>
            {!generatedToken ? (
              <Grid>
                <Button autoFocus onClick={generateToken} variant='contained' size='large'>
                  <Casino />
                  {t('Generate token')}
                </Button>
              </Grid>
            ) : (
              <Grid>
                <Collapse in={generatedToken}>
                  <Grid
                    container
                    spacing={1}
                    sx={{ alignItems: 'center', flexDirection: 'column' }}
                  >
                    <Grid>
                      <Alert variant='outlined' severity='info'>
                        <b>{`${t('Store it somewhere safe!')} `}</b>
                        {t(
                          `This token is the one and only key to your robot, you will need it later to recover your order. Keep it secret, sharing it could put your funds at risk.`,
                        )}
                      </Alert>
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                      <TokenInput
                        loading={loading}
                        autoFocusTarget='copyButton'
                        inputToken={inputToken}
                        setInputToken={setInputToken}
                        onPressEnter={() => null}
                      />
                    </Grid>
                    <Grid>
                      <Typography>
                        {t('You can also add your own random characters into the token or')}
                        <Button size='small' onClick={generateToken}>
                          <Casino />
                          {t('roll again')}
                        </Button>
                      </Typography>
                    </Grid>

                    <Grid>
                      <Button
                        onClick={() => {
                          setStep('2');
                          void garage.createRobot(federation, inputToken);
                        }}
                        disabled={loading}
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
          <Typography variant='h5' color={step === '2' ? 'text.primary' : 'text.disabled'}>
            {t('2. Meet your robot identity')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1} sx={{ alignItems: 'center', flexDirection: 'column' }}>
            <Grid>
              <Typography>
                {slot?.hashId ? (
                  t('This is your trading avatar')
                ) : (
                  <>
                    <b>{t('Building your robot!')}</b>
                    <LinearProgress />
                  </>
                )}
              </Typography>
            </Grid>

            <Grid sx={{ width: '13.5em' }}>
              <RobotAvatar
                hashId={slot?.hashId ?? ''}
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
              />
            </Grid>

            {slot?.nickname ? (
              <Grid>
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
                    <b>{slot?.nickname}</b>
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
            <Grid>
              <Collapse in={!!slot?.hashId}>
                <Button
                  onClick={() => {
                    setStep('3');
                  }}
                  variant='contained'
                  size='large'
                >
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
          <Typography variant='h5' color={step === '3' ? 'text.primary' : 'text.disabled'}>
            {t('3. Browse or create an order')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid
            container
            spacing={1}
            sx={{ alignItems: 'center', flexDirection: 'column', padding: 1.5 }}
          >
            <Grid>
              <Typography>
                {t(
                  'RoboSats is a peer-to-peer marketplace. You can browse the public offers or create a new one.',
                )}
              </Typography>
            </Grid>

            <Grid>
              <ButtonGroup variant='contained'>
                <Button
                  color='primary'
                  onClick={() => {
                    setOpen((open) => {
                      return { ...open, search: true };
                    });
                  }}
                >
                  <Search /> <div style={{ width: '0.5em' }} />
                  {t('Search')}
                </Button>
                <Button
                  color='secondary'
                  onClick={() => {
                    navigateToPage('create', navigate);
                  }}
                >
                  <AddBox /> <div style={{ width: '0.5em' }} />
                  {t('Create')}
                </Button>
              </ButtonGroup>
            </Grid>

            <Grid>
              <Typography>
                {`${t('If you need help on your RoboSats journey join our public support')} `}
                <Link
                  target='_blank'
                  href='https://simplex.chat/contact/#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D'
                  rel='noreferrer'
                >
                  {t('SimpleX group')}
                </Link>
                {`, ${t('or visit the robot school for documentation.')} `}
              </Typography>
            </Grid>
            <Grid>
              <Button
                component={Link}
                href='https://learn.robosats.org'
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
            <Grid sx={{ position: 'relative', top: '0.6em' }}>
              <Button
                color='inherit'
                onClick={() => {
                  setView('profile');
                }}
              >
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
