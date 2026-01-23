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
import { useNavigate } from 'react-router-dom';
import { VpnKey, SmartToy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import GarageKeyOnboarding from './GarageKeyOnboarding';
import GarageKeyProfile from './GarageKeyProfile';
import Welcome from '../RobotPage/Welcome';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';
import { systemClient } from '../../services/System';

const GaragePage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { windowSize, slotUpdatedAt, settings, setSettings, navigateToPage } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;

  const [inputGarageKey, setInputGarageKey] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'profile'>('welcome');
  const [showModeChangeDialog, setShowModeChangeDialog] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<'legacy' | 'garageKey' | null>(null);

  const hasActiveData = (): boolean => {
    return Object.keys(garage.slots).length > 0 || garage.getGarageKey() !== null;
  };

  const handleModeChange = (newMode: 'legacy' | 'garageKey' | null): void => {
    if (newMode !== null && newMode !== settings.garageMode) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    }
  };

  const confirmModeChange = (): void => {
    if (pendingMode !== null) {
      const newSettings = { ...settings, garageMode: pendingMode };
      setSettings(newSettings);
      systemClient.setItem('settings_garage_mode', pendingMode);

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
    const garageKey = garage.getGarageKey();
    if (garageKey) {
      setInputGarageKey(garageKey.encodedKey);
      if (Object.keys(garage.slots).length > 0 && view !== 'onboarding') {
        setView('profile');
      } else if (view === 'welcome') {
        setView('onboarding');
      }
    } else {
      if (view !== 'onboarding') {
        setView('welcome');
      }
    }
  }, [slotUpdatedAt]);

  useEffect(() => {
    if (Object.keys(garage.slots).length > 0 && view === 'welcome') {
      const garageKey = garage.getGarageKey();
      if (garageKey) {
        setView('profile');
      }
    }
  }, [garage.currentSlot]);

  const handleSetView = (newView: 'welcome' | 'onboarding' | 'profile'): void => {
    if (newView === 'onboarding') {
      const garageKey = garage.getGarageKey();
      if (!garageKey) {
        setInputGarageKey('');
      }
    }
    setView(newView);
  };

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
          value={settings.garageMode}
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
              {settings.garageMode === 'garageKey' && garage.getGarageKey()
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

      <RecoveryDialog setInputToken={setInputGarageKey} setView={handleSetView} />

      {view === 'welcome' ? (
        <Welcome setView={handleSetView} width={width} setInputToken={setInputGarageKey} />
      ) : null}

      {view === 'onboarding' ? (
        <GarageKeyOnboarding
          setView={handleSetView}
          inputGarageKey={inputGarageKey}
          setInputGarageKey={setInputGarageKey}
        />
      ) : null}

      {view === 'profile' ? (
        <GarageKeyProfile
          setView={handleSetView}
          width={width}
          inputGarageKey={inputGarageKey}
          setInputGarageKey={setInputGarageKey}
        />
      ) : null}
    </Paper>
  );
};

export default GaragePage;
