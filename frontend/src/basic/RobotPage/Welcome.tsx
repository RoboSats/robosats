import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, styled, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { RoboSatsTextIcon } from '../../components/Icons';
import { genBase62Token } from '../../utils';

interface WelcomeProps {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  getGenerateRobot: (token: string) => void;
  width: number;
}

const BUTTON_COLORS = {
  primary: '#2196f3',
  secondary: '#9c27b0',
  text: '#ffffff',
};

const Welcome = ({ setView, getGenerateRobot, width }: WelcomeProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const COLORS = {
    background: theme.palette.background.paper,
    textPrimary: theme.palette.text.primary,
    shadow: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  };

  return (
    <WelcomeContainer>
      <LogoSection colors={COLORS}>
        <svg width={0} height={0}>
          <linearGradient id='linearColors' x1={1} y1={0} x2={1} y2={1}>
            <stop offset={0} stopColor={theme.palette.primary.main} />
            <stop offset={1} stopColor={theme.palette.secondary.main} />
          </linearGradient>
        </svg>
        <LogoBox>
          <StyledRoboSatsTextIcon />
        </LogoBox>
        <Typography variant='subtitle1' sx={{ fontSize: '1rem', mt: 2, textAlign: 'center' }}>
          A Simple and Private ⚡ Lightning P2P Exchange
        </Typography>
      </LogoSection>
      <ButtonsSection>
        <StyledButton
          fullWidth
          variant='contained'
          $buttonColor={BUTTON_COLORS.primary}
          $textColor={BUTTON_COLORS.text}
          $shadowColor={COLORS.shadow}
          $borderRadius={{ xs: '0', md: '0 8px 0 0' }}
          endIcon={<ArrowForwardIcon />}
          onClick={() => setView('onboarding')}
        >
          <ButtonContent>
            <Typography variant='body2'>Create a new robot and</Typography>
            <Typography variant='body2'>learn to use RoboSats.</Typography>
            <Typography variant='h6' sx={{ mt: 1, fontWeight: 'bold' }}>
              Start
            </Typography>
          </ButtonContent>
        </StyledButton>
        <StyledButton
          fullWidth
          variant='contained'
          $buttonColor={BUTTON_COLORS.secondary}
          $textColor={BUTTON_COLORS.text}
          $shadowColor={COLORS.shadow}
          $borderRadius={{ xs: '0', md: '0' }}
          endIcon={<ArrowForwardIcon />}
          onClick={() => setView('recovery')}
        >
          <ButtonContent>
            <Typography variant='body2'>Recover an existing</Typography>
            <Typography variant='body2'>Robot using your token.</Typography>
            <Typography variant='h6' sx={{ mt: 1, fontWeight: 'bold' }}>
              Recover
            </Typography>
          </ButtonContent>
        </StyledButton>
        <StyledButton
          fullWidth
          variant='contained'
          $buttonColor={COLORS.background}
          $textColor={BUTTON_COLORS.primary}
          $shadowColor={COLORS.shadow}
          $borderRadius={{ xs: '0 0 8px 8px', md: '0 0 8px 0' }}
          sx={{ justifyContent: 'flex-start' }}
          onClick={() => {
            setView('profile');
            getGenerateRobot(genBase62Token(36));
          }}
        >
          <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
            ▶ Fast Generate Robot
          </Typography>
        </StyledButton>
      </ButtonsSection>
    </WelcomeContainer>
  );
};

// Styled components
const WelcomeContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 800,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  marginBottom: theme.spacing(8),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}));

const LogoSection = styled(Box)<{ colors: typeof COLORS }>(({ theme, colors }) => ({
  flexGrow: 1,
  flexBasis: 0,
  backgroundColor: colors.background,
  border: `2px solid ${colors.textPrimary}`,
  borderRight: 'none',
  borderRadius: '8px 8px 0 0',
  boxShadow: `8px 8px 0px 0px ${colors.shadow}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    borderRadius: '8px 0 0 8px',
  },
}));

const LogoBox = styled(Box)({
  width: '80%',
  maxWidth: '400px',
  height: 'auto',
});

const StyledRoboSatsTextIcon = styled(RoboSatsTextIcon)({
  fill: 'url(#linearColors)',
  width: '100%',
  height: 'auto',
});

const ButtonsSection = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  flexBasis: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'transparent',
}));

const StyledButton = styled(Button)<{
  $buttonColor: string;
  $textColor: string;
  $shadowColor: string;
  $borderRadius: { xs: string; md: string };
}>(({ theme, $buttonColor, $textColor, $shadowColor, $borderRadius }) => ({
  justifyContent: 'space-between',
  textAlign: 'left',
  padding: theme.spacing(2),
  height: '100%',
  borderRadius: 0,
  border: `2px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}`,
  boxShadow: `8px 8px 0px 0px ${$shadowColor}`,
  '&:not(:last-child)': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: $buttonColor,
    boxShadow: `12px 12px 0px 0px ${$shadowColor}`,
  },
  backgroundColor: $buttonColor,
  color: $textColor,
  borderRadius: $borderRadius.xs,
  [theme.breakpoints.up('md')]: {
    borderRadius: $borderRadius.md,
  },
}));

const ButtonContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

export default Welcome;