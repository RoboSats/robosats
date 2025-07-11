import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import DesktopBar from './DesktopBar';
import AppBar from './AppBar';

export type Page = 'garage' | 'order' | 'create' | 'offers' | 'settings' | 'none';

export function isPage(page: string): page is Page {
  return ['garage', 'order', 'create', 'offers', 'settings', 'none'].includes(page);
}

const NavBar = (): React.JSX.Element => {
  const theme = useTheme();
  const { page, setPage, setSlideDirection, windowSize } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const mobileView = windowSize?.width < 50;
  const navigate = useNavigate();
  const location = useLocation();

  const pagesPosition = {
    robot: 1,
    offers: 2,
    create: 3,
    order: 4,
    settings: 5,
  };

  useEffect(() => {
    // change tab (page) into the current route
    const pathPage: Page | string = location.pathname.split('/')[1];
    if (pathPage === 'index.html') {
      navigate('/garage');
      setPage('garage');
    }
    if (isPage(pathPage)) {
      setPage(pathPage);
    }
  }, [location]);

  const handleSlideDirection = function (oldPage: Page, newPage: Page): void {
    const oldPos: number = pagesPosition[oldPage];
    const newPos: number = pagesPosition[newPage];
    setSlideDirection(
      newPos > oldPos ? { in: 'left', out: 'right' } : { in: 'right', out: 'left' },
    );
  };

  const changePage = function (newPage: Page): void {
    if (newPage !== 'none') {
      const slot = garage.getSlot();
      handleSlideDirection(page, newPage);
      setPage(newPage);

      const shortAlias = slot?.activeOrder?.shortAlias;
      const orderId = slot?.activeOrder?.id;
      const param = newPage === 'order' ? `${String(shortAlias)}/${String(orderId)}` : '';
      setTimeout(() => {
        navigate(`/${newPage}/${param}`);
      }, theme.transitions.duration.leavingScreen * 3);
    }
  };

  return mobileView ? <AppBar changePage={changePage} /> : <DesktopBar changePage={changePage} />;
};

export default NavBar;
