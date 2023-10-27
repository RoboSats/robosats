import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { RoboSatsTextIcon } from '../../components/Icons';
import { FastForward, RocketLaunch, Key } from '@mui/icons-material';
import { genBase62Token } from '../../utils';

interface WelcomeProps {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  getGenerateRobot: (token: string) => void;
  width: number;
}

const Welcome = ({ setView, width, getGenerateRobot }: WelcomeProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

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
                size='small'
                color='secondary'
                variant='contained'
                onClick={() => {
                  setView('recovery');
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
          size='small'
          color='primary'
          onClick={() => {
            setView('profile');
            getGenerateRobot(genBase62Token(36));
          }}
        >
          <FastForward /> <div style={{ width: '0.5em' }} />
          {t('Fast Generate Robot')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Welcome;
