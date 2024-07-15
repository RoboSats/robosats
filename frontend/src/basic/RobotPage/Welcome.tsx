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

  const StyledButton = styled(Button)(({ theme }) => ({
    justifyContent: 'space-between',
    textAlign: 'left',
    padding: theme.spacing(2),
    height: '100%',
    borderRadius: 0,
    border: `2px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}`,
    boxShadow: `8px 8px 0px 0px ${COLORS.shadow}`,
    '&:not(:last-child)': {
      borderBottom: 'none',
    },
    '&:hover': {
      boxShadow: `12px 12px 0px 0px ${COLORS.shadow}`,
    },
  }));

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        mb: 8,
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          flexBasis: 0,
          bgcolor: COLORS.background,
          border: `2px solid ${COLORS.textPrimary}`,
          borderRight: 'none',
          borderRadius: { xs: '8px 8px 0 0', md: '8px 0 0 8px' },
          boxShadow: `8px 8px 0px 0px ${COLORS.shadow}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <svg width={0} height={0}>
          <linearGradient id='linearColors' x1={1} y1={0} x2={1} y2={1}>
            <stop offset={0} stopColor={theme.palette.primary.main} />
            <stop offset={1} stopColor={theme.palette.secondary.main} />
          </linearGradient>
        </svg>
        <Box sx={{ width: '80%', maxWidth: '400px', height: 'auto' }}>
          <RoboSatsTextIcon
            sx={{
              fill: 'url(#linearColors)',
              width: '100%',
              height: 'auto',
            }}
          />
        </Box>
        <Typography variant='subtitle1' sx={{ fontSize: '1rem', mt: 2, textAlign: 'center' }}>
          A Simple and Private ⚡ Lightning P2P Exchange
        </Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          flexBasis: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'transparent',
        }}
      >
        <StyledButton
          fullWidth
          variant='contained'
          sx={{
            bgcolor: BUTTON_COLORS.primary,
            color: BUTTON_COLORS.text,
            borderRadius: { xs: '0', md: '0 8px 0 0' },
            '&:hover': {
              backgroundColor: BUTTON_COLORS.primary,
              boxShadow: `12px 12px 0px 0px ${COLORS.shadow}`,
            },
          }}
          endIcon={<ArrowForwardIcon />}
          onClick={() => {
            setView('onboarding');
          }}
        >
          <Box>
            <Typography variant='body2'>Create a new robot and</Typography>
            <Typography variant='body2'>learn to use RoboSats.</Typography>
            <Typography variant='h6' sx={{ mt: 1, fontWeight: 'bold' }}>
              Start
            </Typography>
          </Box>
        </StyledButton>
        <StyledButton
          fullWidth
          variant='contained'
          sx={{
            bgcolor: BUTTON_COLORS.secondary,
            color: BUTTON_COLORS.text,
            borderRadius: { xs: '0', md: '0' },
            '&:hover': {
              backgroundColor: BUTTON_COLORS.secondary,
              boxShadow: `12px 12px 0px 0px ${COLORS.shadow}`,
            },
          }}
          endIcon={<ArrowForwardIcon />}
          onClick={() => {
            setView('recovery');
          }}
        >
          <Box>
            <Typography variant='body2'>Recover an existing</Typography>
            <Typography variant='body2'>Robot using your token.</Typography>
            <Typography variant='h6' sx={{ mt: 1, fontWeight: 'bold' }}>
              Recover
            </Typography>
          </Box>
        </StyledButton>
        <StyledButton
          fullWidth
          variant='contained'
          sx={{
            bgcolor: COLORS.background,
            color: BUTTON_COLORS.primary,
            borderRadius: { xs: '0 0 8px 8px', md: '0 0 8px 0' },
            '&:hover': {
              backgroundColor: COLORS.background,
              boxShadow: `12px 12px 0px 0px ${COLORS.shadow}`,
            },
            justifyContent: 'flex-start',
          }}
          onClick={() => {
            setView('profile');
            getGenerateRobot(genBase62Token(36));
          }}
        >
          <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
            ▶ Fast Generate Robot
          </Typography>
        </StyledButton>
      </Box>
    </Box>
  );
};

export default Welcome;
