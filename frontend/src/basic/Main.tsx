import React, { useContext } from 'react';
import { MemoryRouter, HashRouter, BrowserRouter, BrowserRouterProps } from 'react-router-dom';
import { Box, Typography, styled } from '@mui/material';
import { type UseAppStoreType, AppContext, closeAll } from '../contexts/AppContext';

import { NavBar, MainDialogs } from './';
import Notifications from '../components/Notifications';

import { useTranslation } from 'react-i18next';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';
import Routes from './Routes';

const getRouter = (): (({
  basename,
  children,
  window,
}: BrowserRouterProps) => React.JSX.Element) => {
  const [client] = window.RobosatsSettings.split('-');
  if (client === 'web') {
    return BrowserRouter;
  } else if (client === 'desktop') {
    return HashRouter;
  } else {
    return MemoryRouter;
  }
};
const Router = getRouter();

const TestnetTypography = styled(Typography)({
  height: 0,
});

interface MainBoxProps {
  navbarHeight: number;
}

const MainBox = styled(Box)<MainBoxProps>((props) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: `translate(-50%, -50%) translate(0,  -${props.navbarHeight / 2}em)`,
}));

const Main: React.FC = () => {
  const { t } = useTranslation();
  const { settings, page, setOpen, windowSize, navbarHeight, client } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  return (
    <Router>
      <Notifications
        page={page}
        openProfile={() => {
          setOpen({ ...closeAll, profile: true });
        }}
        rewards={garage.getSlot()?.getRobot()?.earnedRewards}
        windowWidth={windowSize?.width}
      />
      {settings.network === 'testnet' ? (
        <TestnetTypography color='secondary' align='center'>
          <i>{t('Using Testnet Bitcoin')}</i>
        </TestnetTypography>
      ) : (
        <></>
      )}

      <MainBox navbarHeight={navbarHeight} style={{ paddingTop: client === 'mobile' ? '25px' : 0 }}>
        <Routes />
      </MainBox>
      <NavBar />
      <MainDialogs />
    </Router>
  );
};

export default Main;
