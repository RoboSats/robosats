import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, styled } from '@mui/material';
import { type UseAppStoreType, AppContext } from '../contexts/AppContext';

import { NavBar, MainDialogs } from './';

import { useTranslation } from 'react-i18next';
import Routes from './Routes';
import TopBar from './TopBar';
import { getRouter } from '../utils';

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
