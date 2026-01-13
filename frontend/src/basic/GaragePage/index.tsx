import React, { useContext, useEffect, useState } from 'react';
import { Paper } from '@mui/material';

import GarageKeyOnboarding from './GarageKeyOnboarding';
import GarageKeyProfile from './GarageKeyProfile';
import Welcome from '../RobotPage/Welcome';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';

const GaragePage = (): React.JSX.Element => {
  const { windowSize, slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { garage, garageKeyUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const width = Math.min(windowSize.width * 0.8, 28);
  const maxHeight = windowSize.height * 0.85 - 3;

  const [inputGarageKey, setInputGarageKey] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'profile'>('welcome');

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
  }, [garageKeyUpdatedAt, slotUpdatedAt]);

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
