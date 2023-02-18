import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { RoboSatsNoTextIcon, RoboSatsTextIcon } from '../../components/Icons';
import { FastForward, RocketLaunch } from '@mui/icons-material';
import SmartToy from '@mui/icons-material/SmartToy';

interface WelcomeProps {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  width: number;
}

const Welcome = ({ setView, width }: WelcomeProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
      <RoboSatsTextIcon
        color='primary'
        sx={{
          height: `${Math.min(width * 0.65, 13) * 0.25}em`,
          width: `${Math.min(width * 0.65, 13)}em`,
        }}
      />
      <Typography align='center' component='h5' variant='h5'>
        {t('Simple and Private LN P2P Exchange')}
      </Typography>

      <Grid item>
        <Box
          sx={{
            padding: '0.5em',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '4px',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
            },
          }}
        >
          <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
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
                onClick={() => setView('onboarding')}
              >
                <RocketLaunch />
                {t('Start')}
              </Button>
            </Grid>

            <Grid item>
              <Typography align='center'>
                {t('Recover an existing robot using your token')}
              </Typography>
            </Grid>
            <Grid item>
              <Button color='secondary' variant='contained' onClick={() => setView('recovery')}>
                <SmartToy />
                {t('Recovery')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid item>
        <Button color='primary' onClick={() => setView('profile')}>
          <FastForward />
          {t('Skip to Robot Generator')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Welcome;
