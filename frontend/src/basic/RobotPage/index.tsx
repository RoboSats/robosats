import React, { useContext, useEffect, useState } from 'react';
import {
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { VpnKey, SmartToy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';

const RobotPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { torStatus, windowSize, settings, page, navigateToPage } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const params = useParams();
  const urlToken = settings.selfhostedClient ? params.token : null;
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;

  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'profile'>(
    Object.keys(garage.slots).length > 0 ? 'profile' : 'welcome',
  );
  const [showModeChangeDialog, setShowModeChangeDialog] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<'legacy' | 'garageKey' | null>(null);

  const hasActiveData = (): boolean => {
    return Object.keys(garage.slots).length > 0 || garage.getGarageKey() !== null;
  };

  const handleModeChange = (newMode: 'legacy' | 'garageKey' | null): void => {
    if (newMode !== null && newMode !== garage.getMode()) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    }
  };

  const confirmModeChange = (): void => {
    if (pendingMode !== null) {
      garage.deleteGarageKey();
      garage.delete();

      garage.setMode(pendingMode);

      setShowModeChangeDialog(false);
      setPendingMode(null);

      navigateToPage('garage', navigate);
    }
  };

  const cancelModeChange = (): void => {
    setShowModeChangeDialog(false);
    setPendingMode(null);
  };

  useEffect(() => {
    const token = urlToken ?? garage.currentSlot;
    if (token !== undefined && token !== null && page === 'garage') {
      setInputToken(token.replace(/\s+/g, ''));
    }
  }, [torStatus, page, slotUpdatedAt]);

  useEffect(() => {
    if (Object.keys(garage.slots).length > 0 && view === 'welcome') setView('profile');
  }, [garage.currentSlot]);

  useEffect(() => {
    if (Object.keys(garage.slots).length === 0 && view !== 'welcome') setView('welcome');
  }, [slotUpdatedAt]);

  return (
    <Paper
      elevation={12}
      style={{
        width: `${width}em`,
        maxHeight: `${maxHeight}em`,
        overflow: 'auto',
        overflowX: 'clip',
      }}
    >
      <Stack direction='column' alignItems='center' spacing={1} sx={{ pt: 1.5, px: 1.5 }}>
        <ToggleButtonGroup
          sx={{ width: '100%' }}
          exclusive={true}
          value={garage.getMode()}
          onChange={(_e, garageMode) => {
            handleModeChange(garageMode);
          }}
        >
          <ToggleButton value='garageKey' color='primary' sx={{ flexGrow: 1 }}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <VpnKey />
              <span>{t('Garage Key')}</span>
            </Stack>
          </ToggleButton>
          <ToggleButton value='legacy' color='secondary' sx={{ flexGrow: 1 }}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <SmartToy />
              <span>{t('Legacy')}</span>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>

        <Alert severity='warning' sx={{ width: '100%' }}>
          {t(
            'You are in Legacy mode. This mode is only for recovering robots from ongoing trades. Switch to Garage Key mode to create new orders.',
          )}
        </Alert>
      </Stack>

      <Dialog open={showModeChangeDialog} onClose={cancelModeChange} maxWidth='sm' fullWidth>
        <DialogTitle>{t('Change Robot Generation Mode?')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'Changing the robot generation mode will restart the application and clear all current robot data.',
            )}
          </DialogContentText>
          {hasActiveData() && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              {garage.getMode() === 'garageKey' && garage.getGarageKey()
                ? t(
                    'You have an active Garage Key. Make sure you have saved it before continuing!',
                  )
                : t(
                    'You have active robots. Make sure you have saved your tokens before continuing!',
                  )}
            </Alert>
          )}
          <DialogContentText sx={{ mt: 2 }}>{t('Do you want to continue?')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelModeChange} color='primary'>
            {t('Cancel')}
          </Button>
          <Button onClick={confirmModeChange} color='secondary' variant='contained'>
            {t('Confirm and Restart')}
          </Button>
        </DialogActions>
      </Dialog>

      <RecoveryDialog setInputToken={setInputToken} setView={setView} />
      {view === 'welcome' ? (
        <Welcome setView={setView} width={width} setInputToken={setInputToken} />
      ) : null}

      {view === 'onboarding' ? (
        <Onboarding setView={setView} inputToken={inputToken} setInputToken={setInputToken} />
      ) : null}

      {view === 'profile' ? (
        <RobotProfile
          setView={setView}
          width={width}
          inputToken={inputToken}
          setInputToken={setInputToken}
        />
      ) : null}
    </Paper>
  );
};

export default RobotPage;
