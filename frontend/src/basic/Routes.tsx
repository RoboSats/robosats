import React, { useContext, useEffect, useState } from 'react';
import { Routes as DomRoutes, Route, useNavigate } from 'react-router-dom';
import { Slide, type SlideProps } from '@mui/material';
import { type UseAppStoreType, AppContext, Page } from '../contexts/AppContext';

import { RobotPage, MakerPage, BookPage, OrderPage, SettingsPage } from '.';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';

// Define the page order for carousel effect
const pageOrder: Page[] = ['garage', 'offers', 'create', 'order', 'settings'];

const Routes: React.FC = () => {
  const navigate = useNavigate();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { page, navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const [prevPage, setPrevPage] = useState<Page>('none');
  const [slideDirection, setSlideDirection] = useState<SlideProps['direction']>('left');

  useEffect(() => {
    window.addEventListener('navigateToPage', (event) => {
      const orderId: string = event?.order_id;
      const coordinator: string = event?.coordinator;
      if (orderId && coordinator) {
        const slot = garage.getSlotByOrder(coordinator, parseInt(orderId, 10));
        if (slot?.token) {
          garage.setCurrentSlot(slot?.token);
          navigate(`/order/${coordinator}/${orderId}`);
        }
      }
    });
  }, []);

  useEffect(() => {
    // change tab (page) into the current route
    const pathPage: Page | string = location.pathname.split('/')[1];
    if (pathPage === 'index.html') {
      navigateToPage('garage', navigate);
    } else {
      navigateToPage(pathPage as Page, navigate);
    }
  }, [location]);

  // Determine slide direction based on page order (carousel effect)
  useEffect(() => {
    if (prevPage === 'none' || page === prevPage) {
      // Initial load or same page, default direction
      setSlideDirection('left');
    } else {
      const prevIndex = pageOrder.indexOf(prevPage);
      const currentIndex = pageOrder.indexOf(page);

      // If moving forward in the carousel (or wrapping from end to start)
      if (currentIndex > prevIndex || (prevIndex === pageOrder.length - 1 && currentIndex === 0)) {
        setSlideDirection('left'); // New page comes from right
      }
      // If moving backward in the carousel (or wrapping from start to end)
      else if (
        currentIndex < prevIndex ||
        (prevIndex === 0 && currentIndex === pageOrder.length - 1)
      ) {
        setSlideDirection('right'); // New page comes from left
      }
    }

    // Update previous page after determining direction
    setPrevPage(page);
  }, [page]);

  return (
    <DomRoutes>
      {['/garage/:token?', '/garage', '/', ''].map((path, index) => {
        return (
          <Route
            path={path}
            element={
              <Slide in={page === 'garage'} direction={slideDirection} appear>
                <div>
                  <RobotPage />
                </div>
              </Slide>
            }
            key={index}
          />
        );
      })}

      <Route
        path={'/offers'}
        element={
          <Slide in={page === 'offers'} direction={slideDirection} appear>
            <div>
              <BookPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/create'
        element={
          <Slide in={page === 'create'} direction={slideDirection} appear>
            <div>
              <MakerPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/order/:shortAlias/:orderId'
        element={
          <Slide in={page === 'order'} direction={slideDirection} appear>
            <div>
              <OrderPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/settings'
        element={
          <Slide in={page === 'settings'} direction={slideDirection} appear>
            <div>
              <SettingsPage />
            </div>
          </Slide>
        }
      />
    </DomRoutes>
  );
};

export default Routes;
