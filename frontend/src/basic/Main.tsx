import React, { useContext } from 'react';
import { MemoryRouter, BrowserRouter, HashRouter } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import { type UseAppStoreType, AppContext } from '../contexts/AppContext';
import { TopNavBar, NavBar, MainDialogs } from './';
import Notifications from '../components/Notifications';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';
import Routes from './Routes';

const getRouter = (): any => {
  const [client, _view] = window.RobosatsSettings.split('-');
  if (client === 'web') {
    return BrowserRouter;
  } else if (client === 'desktop') {
    return HashRouter;
  } else {
    return MemoryRouter;
  }
};
const Router = getRouter();

const Main: React.FC = () => {
  const { page, setOpen, windowSize } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  return (
    <Router>
      <TopNavBar />
      <Notifications
        page={page}
        openProfile={() => {
          setOpen({ ...closeAll, profile: true });
        }}
        rewards={garage.getSlot()?.getRobot()?.earnedRewards}
        windowWidth={windowSize?.width}
      />
      <MainContent>
        <Routes />
      </MainContent>
      <NavBar />
      <MainDialogs />
    </Router>
  );
};

// Styled components
const MainContent = styled(Box)(({ theme }) => ({
  marginTop: '100px',
  marginBottom: '80px',
  padding: theme.spacing(2),
  overflowY: 'auto',
  overflowX: 'hidden',
  height: 'calc(100vh - 180px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

export default Main;
