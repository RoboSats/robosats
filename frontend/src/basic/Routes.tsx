import React, { useContext, useEffect } from 'react';
import { Routes as DomRoutes, Route, useNavigate } from 'react-router-dom';
import { Fade } from '@mui/material';
import { type UseAppStoreType, AppContext, Page } from '../contexts/AppContext';

import { RobotPage, GaragePage, MakerPage, BookPage, OrderPage, SettingsPage } from '.';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';

const Routes: React.FC = () => {
  const navigate = useNavigate();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { page, navigateToPage } = useContext<UseAppStoreType>(AppContext);

  useEffect(() => {
    if (window.AndroidDataRobosats && garage.currentSlot) {
      const orderPath = window.AndroidDataRobosats.navigateToPage ?? '';
      const [coordinator, orderId] = orderPath.split('/');
      window.AndroidDataRobosats = undefined;

      if (orderId && coordinator) {
        const slot = garage.getSlotByOrder(coordinator, parseInt(orderId, 10));
        if (slot?.token) garage.setCurrentSlot(slot.token);

        navigateToPage(`order/${coordinator}/${orderId}`, navigate);
      }
    }
  }, [garage.currentSlot]);

  useEffect(() => {
    // change tab (page) into the current route
    const pathPage: Page | string = location.pathname.split('/')[1];
    if (pathPage === 'index.html') {
      navigateToPage('garage', navigate);
    }
  }, [location]);

  const GarageComponent = garage.mode === 'garageKey' ? GaragePage : RobotPage;

  return (
    <DomRoutes>
      {['/garage/:token?', '/garage', '/', ''].map((path, index) => {
        return (
          <Route
            path={path}
            element={
              <Fade in={page === 'garage'} appear>
                <div>
                  <GarageComponent />
                </div>
              </Fade>
            }
            key={index}
          />
        );
      })}

      <Route
        path={'/offers'}
        element={
          <Fade in={page === 'offers'} appear>
            <div>
              <BookPage />
            </div>
          </Fade>
        }
      />

      <Route
        path='/create'
        element={
          <Fade in={page === 'create'} appear>
            <div>
              <MakerPage />
            </div>
          </Fade>
        }
      />

      <Route
        path='/order/:shortAlias/:orderId'
        element={
          <Fade in={page === 'order'} appear>
            <div>
              <OrderPage />
            </div>
          </Fade>
        }
      />

      <Route
        path='/settings'
        element={
          <Fade in={page === 'settings'} appear>
            <div>
              <SettingsPage />
            </div>
          </Fade>
        }
      />
    </DomRoutes>
  );
};

export default Routes;
