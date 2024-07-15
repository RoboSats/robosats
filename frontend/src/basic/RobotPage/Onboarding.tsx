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
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
  stepConnectorClasses,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  Check,
  Casino,
  SmartToy,
  Storefront,
  AddBox,
  School,
  ContentCopy,
} from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { genBase62Token } from '../../utils';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.2)',
  borderRadius: '16px',
  border: '2px solid #000',
  padding: theme.spacing(2),
  color: theme.palette.text.primary,
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(1),
  borderRadius: '8px',
  border: '2px solid #000',
  boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.2)',
  textTransform: 'none',
  fontWeight: 'bold',
  width: '100%',
  '&:hover': {
    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 0.3)',
  },
}));

const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: 'calc(-50% + 20px)',
    right: 'calc(50% + 20px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const StyledStepIconRoot = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ theme, ownerState }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 44,
    height: 44,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
      backgroundColor: theme.palette.primary.main,
      boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(ownerState.completed && {
      backgroundColor: theme.palette.primary.main,
    }),
  }),
);

function StyledStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <Casino />,
    2: <SmartToy />,
    3: <Storefront />,
  };

  return (
    <StyledStepIconRoot ownerState={{ active, completed }} className={className}>
      {icons[String(props.icon)]}
    </StyledStepIconRoot>
  );
}

const Onboarding = ({
  setView,
  inputToken,
  setInputToken,
  badToken,
  getGenerateRobot,
}: OnboardingProps): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { setPage } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

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

  const steps = [
    t('1. Generate a token'),
    t('2. Meet your robot identity'),
    t('3. Browse or create an order'),
  ];

  return (
    <Box
      sx={{
        mt: 3,
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        width: '100%',
      }}
    >
      <Stepper
        alternativeLabel={!isMobile}
        orientation={isMobile ? 'horizontal' : 'horizontal'}
        activeStep={parseInt(step) - 1}
        connector={<StyledStepConnector />}
        sx={{ width: '100%', mb: 3 }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={StyledStepIcon}>{isMobile ? null : label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <StyledPaper elevation={3}>
        {step === '1' && (
          <>
            <Typography variant='h6' gutterBottom align='center'>
              {t('1. Generate a token')}
            </Typography>
            <Typography variant='body2' align='center' sx={{ mb: 2 }}>
              {t(
                'This temporary key gives you access to a unique and private robot identity for your trade.',
              )}
            </Typography>
            {!generatedToken ? (
              <Box display='flex' justifyContent='center'>
                <StyledButton
                  onClick={generateToken}
                  variant='contained'
                  size='large'
                  fullWidth={false}
                >
                  {t('Generate Token')}
                </StyledButton>
              </Box>
            ) : (
              <Collapse in={generatedToken}>
                <Grid container direction='column' alignItems='center' spacing={2}>
                  <Grid item xs={12}>
                    <Alert variant='outlined' severity='info' sx={{ mb: 2 }}>
                      <Typography variant='body2'>
                        <strong>{t('Store it somewhere safe!')}</strong>
                      </Typography>
                      <Typography variant='body2'>
                        {t(
                          'This token is the one and only key to your robot and trade. You will need it later to recover your order or check its status.',
                        )}
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <TokenInput
                        loading={loading}
                        autoFocusTarget='copyButton'
                        inputToken={inputToken}
                        setInputToken={setInputToken}
                        badToken={badToken}
                        onPressEnter={() => null}
                        sx={{ flexGrow: 1 }}
                      />
                      <IconButton
                        onClick={() => navigator.clipboard.writeText(inputToken)}
                        size='small'
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display='flex' justifyContent='center'>
                      <StyledButton
                        onClick={() => {
                          setStep('2');
                          getGenerateRobot(inputToken);
                        }}
                        variant='contained'
                        size='large'
                        startIcon={<Check />}
                        fullWidth={false}
                      >
                        {t('Continue')}
                      </StyledButton>
                    </Box>
                  </Grid>
                </Grid>
              </Collapse>
            )}
          </>
        )}

        {step === '2' && (
          <>
            <Typography variant='h6' gutterBottom align='center'>
              {t('2. Meet your robot identity')}
            </Typography>
            <Typography variant='body2' align='center' sx={{ mb: 2 }}>
              {slot?.hashId ? t('This is your trading avatar') : t('Building your robot!')}
            </Typography>
            {!slot?.hashId && <LinearProgress sx={{ mb: 2 }} />}
            <Box display='flex' justifyContent='center' sx={{ mb: 2 }}>
              <RobotAvatar
                hashId={slot?.hashId ?? ''}
                smooth={true}
                style={{ width: '150px', height: '150px' }}
                placeholderType='generating'
                imageStyle={{
                  border: '2px solid #555',
                  borderRadius: '50%',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                }}
                tooltipPosition='top'
              />
            </Box>
            {slot?.nickname && (
              <>
                <Typography variant='body2' align='center'>
                  {t('Hi! My name is')}
                </Typography>
                <Typography variant='h6' align='center' sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SmartToy sx={{ color: '#fcba03', fontSize: '1.2em', mr: 1 }} />
                    <strong>{slot.nickname}</strong>
                    <SmartToy sx={{ color: '#fcba03', fontSize: '1.2em', ml: 1 }} />
                  </Box>
                </Typography>
              </>
            )}
            <Box display='flex' justifyContent='center'>
              <StyledButton
                onClick={() => setStep('3')}
                variant='contained'
                size='large'
                startIcon={<Check />}
                disabled={!slot?.hashId}
                fullWidth={false}
              >
                {t('Continue')}
              </StyledButton>
            </Box>
          </>
        )}

        {step === '3' && (
          <>
            <Typography variant='h6' gutterBottom align='center'>
              {t('3. Browse or create an order')}
            </Typography>
            <Typography variant='body2' align='center' sx={{ mb: 2 }}>
              {t(
                'RoboSats is a peer-to-peer marketplace. You can browse the public offers or create a new one.',
              )}
            </Typography>
            <Box display='flex' justifyContent='center' sx={{ mb: 2 }}>
              <ButtonGroup
                variant='contained'
                size='large'
                orientation={isMobile ? 'vertical' : 'horizontal'}
                fullWidth={isMobile}
              >
                <StyledButton
                  onClick={() => {
                    navigate('/offers');
                    setPage('offers');
                  }}
                  startIcon={<Storefront />}
                >
                  {t('Offers')}
                </StyledButton>
                <StyledButton
                  onClick={() => {
                    navigate('/create');
                    setPage('create');
                  }}
                  startIcon={<AddBox />}
                  color='secondary'
                >
                  {t('Create')}
                </StyledButton>
              </ButtonGroup>
            </Box>
            <Typography variant='body2' align='center' sx={{ mb: 2 }}>
              {t('If you need help on your RoboSats journey join our public support')}{' '}
              <Link href='https://t.me/robosats_es' target='_blank' rel='noreferrer'>
                {t('Telegram group')}
              </Link>
              , {t('or visit the robot school for documentation.')}
            </Typography>
            <Box display='flex' justifyContent='center' sx={{ mb: 2 }}>
              <StyledButton
                component={Link}
                href='https://learn.robosats.com'
                target='_blank'
                color='inherit'
                variant='contained'
                startIcon={<School />}
                fullWidth={isMobile}
              >
                {t('Learn RoboSats')}
              </StyledButton>
            </Box>
            <Box display='flex' justifyContent='center'>
              <Button color='inherit' onClick={() => setView('profile')}>
                {t('See Profile')}
              </Button>
            </Box>
          </>
        )}
      </StyledPaper>
    </Box>
  );
};

export default Onboarding;
