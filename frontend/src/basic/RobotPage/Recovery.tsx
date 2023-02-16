import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Collapse, Grid, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { Casino, Download, ContentCopy, SmartToy, Bolt } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';

interface RecoveryProps {
  robot: Robot;
  inputToken: string;
  setInputToken: (state: string) => void;
  getGenerateRobot: (token: string) => void;
  setPage: (state: Page) => void;
  baseUrl: string;
}

const Recovery = ({
  robot,
  inputToken,
  setInputToken,
  getGenerateRobot,
  setPage,
  baseUrl,
}: RecoveryProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid container direction='column' alignItems='center' spacing={1}>
      <Grid item></Grid>
    </Grid>
  );
};

export default Recovery;
