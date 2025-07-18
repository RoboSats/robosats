import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { AppContext, Page, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import DesktopBar from './DesktopBar';
import AppBar from './AppBar';

const NavBar = (): React.JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { navigateToPage, windowSize } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const mobileView = windowSize?.width < 50;

  const changePage = function (newPage: Page): void {
    if (newPage !== 'none') {
      const slot = garage.getSlot();
      const shortAlias = slot?.activeOrder?.shortAlias;
      const orderId = slot?.activeOrder?.id;
      const param = newPage === 'order' ? `/${String(shortAlias)}/${String(orderId)}` : '';
      setTimeout(() => {
        navigateToPage(`${newPage}${param}`, navigate);
      }, theme.transitions.duration.leavingScreen * 3);
    }
  };

  return mobileView ? <AppBar changePage={changePage} /> : <DesktopBar changePage={changePage} />;
};

export default NavBar;
