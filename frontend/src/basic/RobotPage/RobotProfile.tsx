import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { RoboSatsTextIcon } from '../../components/Icons';
import { FastForward, RocketLaunch } from '@mui/icons-material';
import SmartToy from '@mui/icons-material/SmartToy';

interface RobotProfileProps {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  width: number;
}

const RobotProfile = ({ setView, width }: RobotProfileProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
      <Grid item></Grid>
    </Grid>
  );
};

export default RobotProfile;
