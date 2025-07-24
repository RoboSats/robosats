import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { RoboSatsTextIcon } from '../../components/Icons';
import { FastForward, RocketLaunch, Key } from '@mui/icons-material';
import { genBase62Token } from '../../utils';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { useNavigate } from 'react-router-dom';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';

interface WelcomeProps {
  setView: (state: 'welcome' | 'onboarding' | 'profile') => void;
  width: number;
  setInputToken: (state: string) => void;
}

const Welcome = ({ setView, width, setInputToken }: WelcomeProps): React.JSX.Element => {
  const { navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { setOpen } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  return (
    <Grid
      container
      direction='column'
      alignItems='center'
      spacing={1.8}
      paddingTop={2.2}
      padding={0.5}
    >
      <Grid item style={{ paddingTop: '2em', paddingBottom: '1.5em' }}>
        <svg width={0} height={0}>
          <linearGradient id='linearColors' x1={1} y1={0} x2={1} y2={1}>
            <stop offset={0} stopColor={theme.palette.primary.main} />
            <stop offset={1} stopColor={theme.palette.secondary.main} />
          </linearGradient>
        </svg>
        <RoboSatsTextIcon
          sx={{
            fill: 'url(#linearColors)',
            height: `${Math.min(width * 0.66, 17) * 0.25}em`,
            width: `${Math.min(width * 0.66, 17)}em`,
          }}
        />
        <Typography
          lineHeight={0.82}
          sx={{ position: 'relative', bottom: '0.3em' }}
          color='secondary'
          align='center'
          component='h6'
          variant='h6'
        >
          {t('A Simple and Private LN P2P Exchange')}
        </Typography>
      </Grid>

      <Grid item>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '4px',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
            },
          }}
        >
          <Grid container direction='column' alignItems='center' spacing={1} padding={1.5}>
            <Grid item>
              <Typography align='center'>
                {t('Create a new robot and learn to use RoboSats')}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                size='large'
                color='primary'
                variant='contained'
                onClick={() => {
                  setView('onboarding');
                }}
              >
                <RocketLaunch />
                <div style={{ width: '0.5em' }} />
                {t('Start')}
              </Button>
            </Grid>

            <Grid item>
              <Typography align='center'>
                {t('Recover an existing robot using your token')}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                size='large'
                color='primary'
                onClick={() => {
                  setOpen((open) => {
                    return { ...open, recovery: true };
                  });
                }}
              >
                <Key /> <div style={{ width: '0.5em' }} />
                {t('Recovery')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid item sx={{ position: 'relative', bottom: '0.5em' }}>
        <Button
          size='large'
          color='primary'
          onClick={() => {
            const token = genBase62Token(36);
            void garage.createRobot(federation, token);
            setInputToken(token);
            navigateToPage('create', navigate);
          }}
        >
          <FastForward /> <div style={{ width: '0.5em' }} />
          {t('Fast Generate Order')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Welcome;
