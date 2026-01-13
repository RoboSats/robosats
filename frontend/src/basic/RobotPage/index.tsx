import React, { useContext, useEffect, useState } from 'react';
import { Paper } from '@mui/material';
import { useParams } from 'react-router-dom';

import Onboarding from './Onboarding';
import Welcome from './Welcome';
import RobotProfile from './RobotProfile';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import RecoveryDialog from '../../components/Dialogs/Recovery';

const RobotPage = (): React.JSX.Element => {
  const { torStatus, windowSize, settings, page } = useContext<UseAppStoreType>(AppContext);
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
