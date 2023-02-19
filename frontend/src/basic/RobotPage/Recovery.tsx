import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Collapse, Grid, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { Casino, Download, ContentCopy, SmartToy, Bolt } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import Key from '@mui/icons-material/Key';

interface RecoveryProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  getGenerateRobot: (token: string) => void;
  setPage: (state: Page) => void;
  baseUrl: string;
}

const Recovery = ({
  robot,
  setRobot,
  inputToken,
  setInputToken,
  getGenerateRobot,
  setPage,
  baseUrl,
}: RecoveryProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const recoveryDisabled = () => {
    return inputToken.length > 10 ? false : true;
  };
  const onClickRecover = () => {
    if (recoveryDisabled()) {
      return;
    } else {
    }
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
      <Grid item>
        <Typography align='center'>
          {t(
            'Please, introduce your robot token to re-build your robot and gain access to its trades.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <TokenInput
          showCopy={false}
          inputToken={inputToken}
          setInputToken={setInputToken}
          setRobot={setRobot}
          robot={robot}
          onPressEnter={onClickRecover}
          badRequest={''}
        />
      </Grid>
      <Grid item>
        <Button variant='contained' size='large' disabled={recoveryDisabled()}>
          <Key /> <div style={{ width: '0.5em' }} />
          {t('Recover')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Recovery;
