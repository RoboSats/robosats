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
import { Casino, Bolt, Check, AddBox, School, Search, Key } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import GarageKeyInput from './GarageKeyInput';
import AccountNavigator from './AccountNavigator';
import { generateGarageKey, validateGarageKey } from '../../utils';
import { NewTabIcon } from '../../components/Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { GarageKey } from '../../models';

interface GarageKeyOnboardingProps {
  setView: (state: 'welcome' | 'onboarding' | 'profile') => void;
  inputGarageKey: string;
  setInputGarageKey: (state: string) => void;
}

const GarageKeyOnboarding = ({
  setView,
  inputGarageKey,
  setInputGarageKey,
}: GarageKeyOnboardingProps): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { navigateToPage, setOpen } = useContext<UseAppStoreType>(AppContext);
  const { garage, recoverAccountFromRelays } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [step, setStep] = useState<'1' | '2' | '3'>('1');
  const [generatedKey, setGeneratedKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateKey = (): void => {
    setGeneratedKey(true);
    setInputGarageKey(generateGarageKey());
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleContinueToStep2 = (): void => {
    const validation = validateGarageKey(inputGarageKey);
    if (!validation.valid) return;

    setLoading(true);

    try {
      const garageKey = new GarageKey(inputGarageKey, () => {});
      garage.setGarageKey(garageKey);

      recoverAccountFromRelays();

      void garage.createRobotFromGarageKey(federation).then(() => {
        setLoading(false);
        setStep('2');
      });
    } catch (error) {
      console.error('Error creating garage key:', error);
      setLoading(false);
    }
  };

  const slot = garage.getSlot();
  const garageKey = garage.getGarageKey();
  const isValidKey = validateGarageKey(inputGarageKey).valid;

  return (
    <Box>
      <Accordion expanded={step === '1'} disableGutters={true}>
        <AccordionSummary>
          <Typography variant='h5' color={step === '1' ? 'text.primary' : 'text.disabled'}>
            {t('1. Generate your Garage Key')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
            <Grid item>
              <Typography>
                {t(
                  'Your Garage Key is a master key that derives unlimited robot identities. Generate it once and use it forever.',
                )}
              </Typography>
            </Grid>
            {!generatedKey && !inputGarageKey ? (
              <Grid item>
                <Button autoFocus onClick={generateKey} variant='contained' size='large'>
                  <Key sx={{ mr: 1 }} />
                  {t('Generate Garage Key')}
                </Button>
              </Grid>
            ) : (
              <Grid item sx={{ width: '100%' }}>
                <Collapse in={generatedKey || !!inputGarageKey}>
                  <Grid container direction='column' alignItems='center' spacing={1}>
                    <Grid item>
                      <Alert variant='outlined' severity='info'>
                        <b>{`${t('Store it somewhere safe!')} `}</b>
                        {t(
                          `This key is the master key to all your robots. Keep it secret and backed up securely.`,
                        )}
                      </Alert>
                    </Grid>
                    <Grid item sx={{ width: '100%' }}>
                      <GarageKeyInput
                        loading={loading}
                        autoFocusTarget='copyButton'
                        garageKey={inputGarageKey}
                        setGarageKey={setInputGarageKey}
                        editable={true}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant='body2'>
                        {t('Or paste an existing Garage Key to recover your robots.')}
                        <Button size='small' onClick={generateKey}>
                          <Casino />
                          {t('Generate new')}
                        </Button>
                      </Typography>
                    </Grid>

                    <Grid item>
                      <Button
                        onClick={handleContinueToStep2}
                        disabled={loading || !isValidKey}
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
          <Grid container direction='column' alignItems='center' spacing={1}>
            <Grid item>
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

            <Grid item sx={{ width: '13.5em' }}>
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

            {garageKey ? (
              <Grid item>
                <AccountNavigator
                  accountIndex={garageKey.currentAccountIndex}
                  onPrevious={() => {
                    void garage.previousAccount(federation);
                  }}
                  onNext={() => {
                    void garage.nextAccount(federation);
                  }}
                  loading={slot?.loading}
                />
              </Grid>
            ) : null}

            <Grid item>
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

            <Grid item>
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
            <Grid item>
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
            <Grid item sx={{ position: 'relative', top: '0.6em' }}>
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

export default GarageKeyOnboarding;
