import React, { useContext, useEffect, useState } from 'react';
import { MemoryRouter, HashRouter, BrowserRouter, BrowserRouterProps } from 'react-router-dom';
import { Box, Typography, styled } from '@mui/material';
import { type UseAppStoreType, AppContext } from '../contexts/AppContext';

import { NavBar, MainDialogs } from './';

import { useTranslation } from 'react-i18next';
import Routes from './Routes';
import TopBar from './TopBar';

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
  const { settings, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => setShow(settings.network === 'testnet'), [settings.network]);

  return (
    <Router>
      {show ? (
        <TestnetTypography color='secondary' align='center'>
          <i>{t('Using Testnet Bitcoin')}</i>
        </TestnetTypography>
      ) : (
        <></>
      )}
      <TopBar />
      <MainBox navbarHeight={navbarHeight}>
        <Routes />
      </MainBox>
      <NavBar />
      <MainDialogs />
    </Router>
  );
};

export default Main;
