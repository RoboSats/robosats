import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, Typography, Button, Grid, Chip, Box, Alert } from '@mui/material';
import TokenInput from '../../basic/RobotPage/TokenInput';
import Key from '@mui/icons-material/Key';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { validateGarageKey } from '../../utils';
import { GarageKey } from '../../models';

interface Props {
  setView: (state: 'welcome' | 'onboarding' | 'profile') => void;
  setInputToken: (inputToken: string) => void;
}

const RecoveryDialog = ({ setInputToken, setView }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { open, setOpen } = useContext<UseAppStoreType>(AppContext);
  const { garage, recoverAccountFromRelays } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [recoveryToken, setRecoveryToken] = useState<string>('');
  const [validToken, setValidToken] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const textFieldRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecoveryToken('');
    setErrorMessage('');
    if (open.recovery) {
      const timer = setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100); // Delay for 100 milliseconds
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [open.recovery]);

  const onClickRecover = async (): Promise<void> => {
    const currentMode = garage.getMode();

    setErrorMessage('');

    try {
      if (currentMode === 'garageKey') {
        const garageKeyValidation = validateGarageKey(recoveryToken);
        if (!garageKeyValidation.valid) {
          setErrorMessage(
            t('Invalid garage key format. Please check your input or switch to Legacy mode in Settings.')
          );
          return;
        }

        const garageKey = new GarageKey(recoveryToken, () => {});
        garage.setGarageKey(garageKey);
        setInputToken(recoveryToken);

        recoverAccountFromRelays();

        await garage.createRobotFromGarageKey(federation, undefined, true);

        setView('profile');
      } else {
        setInputToken(recoveryToken);
        await garage.createRobot(federation, recoveryToken);

        setView('profile');
      }

      setOpen((open) => {
        return { ...open, recovery: false };
      });
    } catch (e) {
      console.error('Error recovering robot:', e);
      setErrorMessage(
        t('Failed to recover robot. Please check your token and try again.')
      );
    }
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
            <Box display='flex' alignItems='center' justifyContent='center' gap={1}>
              <Typography variant='h5' align='center'>
                {t('Robot recovery')}
              </Typography>
              <Chip
                label={garage.getMode() === 'garageKey' ? t('Garage Key Mode') : t('Legacy Mode')}
                size='small'
                color={garage.getMode() === 'garageKey' ? 'primary' : 'secondary'}
              />
            </Box>
          </Grid>
          <Grid item>
            <Typography align='center'>
              {garage.getMode() === 'garageKey'
                ? t('Enter your garage key (robo1...) to recover all your robot accounts.')
                : t('Enter your robot token to re-build your robot and gain access to its trades.')
              }
            </Typography>
          </Grid>
          {errorMessage && (
            <Grid item style={{ width: '100%' }}>
              <Alert severity='error' onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            </Grid>
          )}
          <Grid item style={{ width: '100%' }}>
            <TokenInput
              fullWidth
              inputRef={textFieldRef}
              showCopy={false}
              inputToken={recoveryToken}
              setInputToken={setRecoveryToken}
              label={t('Paste token here')}
              onPressEnter={onClickRecover}
              setValidToken={(isValid) => {
                if (garage.getMode() === 'garageKey') {
                  const isGarageKey = validateGarageKey(recoveryToken).valid;
                  setValidToken(isGarageKey);
                } else {
                  setValidToken(isValid);
                }
              }}
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
