import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, Typography, useTheme } from '@mui/material';
import { Robot } from '../../models';
import TokenInput from './TokenInput';
import Key from '@mui/icons-material/Key';

interface RecoveryProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  getGenerateRobot: (token: string) => void;
}

const Recovery = ({
  robot,
  setRobot,
  inputToken,
  setView,
  setInputToken,
  getGenerateRobot,
}: RecoveryProps): JSX.Element => {
  const { t } = useTranslation();

  const recoveryDisabled = () => {
    return !(inputToken.length > 20);
  };
  const onClickRecover = () => {
    if (recoveryDisabled()) {
    } else {
      getGenerateRobot(inputToken);
      setView('profile');
    }
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
      <Grid item>
        <Typography variant='h5' align='center'>
          {t('Robot recovery')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography align='center'>
          {t('Enter your robot token to re-build your robot and gain access to its trades.')}
        </Typography>
      </Grid>
      <Grid item>
        <TokenInput
          showCopy={false}
          inputToken={inputToken}
          setInputToken={setInputToken}
          setRobot={setRobot}
          label={t('Paste token here')}
          robot={robot}
          onPressEnter={onClickRecover}
          badRequest={''}
        />
      </Grid>
      <Grid item>
        <Button
          variant='contained'
          size='large'
          disabled={recoveryDisabled()}
          onClick={onClickRecover}
        >
          <Key /> <div style={{ width: '0.5em' }} />
          {t('Recover')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Recovery;
