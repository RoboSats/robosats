import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, Typography, Button, Grid } from '@mui/material';
import TokenInput from '../../basic/RobotPage/TokenInput';
import Key from '@mui/icons-material/Key';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';

interface Props {
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  setInputToken: (inputToken: string) => void;
}

const RecoveryDialog = ({ setInputToken, setView }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { open, setOpen } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [recoveryToken, setRecoveryToken] = useState<string>('');
  const [validToken, setValidToken] = useState<boolean>(false);

  useEffect(() => {
    setRecoveryToken('');
  }, [open.recovery]);

  const onClickRecover = (): void => {
    void garage.createRobot(federation, recoveryToken);
    setInputToken(recoveryToken);
    setView('profile');
    setOpen((open) => {
      return { ...open, recovery: false };
    });
  };

  return (
    <Dialog
      open={open.recovery}
      onClose={() => {
        setOpen((open) => {
          return { ...open, recovery: false };
        });
      }}
      aria-labelledby='recovery-dialog-title'
      aria-describedby='recovery-description'
    >
      <DialogContent>
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
          <Grid item style={{ width: '100%' }}>
            <TokenInput
              fullWidth
              showCopy={false}
              inputToken={recoveryToken}
              setInputToken={setRecoveryToken}
              label={t('Paste token here')}
              onPressEnter={onClickRecover}
              setValidToken={setValidToken}
            />
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              size='large'
              disabled={!validToken}
              onClick={onClickRecover}
            >
              <Key /> <div style={{ width: '0.5em' }} />
              {t('Recover')}
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default RecoveryDialog;
