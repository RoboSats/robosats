import React, { useContext } from 'react';
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Slide, styled } from '@mui/material';
import { type UseAppStoreType, AppContext } from '../contexts/AppContext';
import {
  TopNavBar,
  NavBar,
  RobotPage,
  MakerPage,
  BookPage,
  OrderPage,
  SettingsPage,
  MainDialogs,
} from './';
import Notifications from '../components/Notifications';
import { useTranslation } from 'react-i18next';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';

const Router = window.NativeRobosats === undefined ? BrowserRouter : MemoryRouter;

const Main: React.FC = () => {
  const { t } = useTranslation();
  const { settings, page, slideDirection, setOpen, windowSize } =
    useContext<UseAppStoreType>(AppContext);
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
        <Routes>
          {['/robot/:token?', '/', ''].map((path, index) => (
            <Route
              path={path}
              element={
                <Slide
                  direction={page === 'robot' ? slideDirection.in : slideDirection.out}
                  in={page === 'robot'}
                  appear={slideDirection.in !== undefined}
                >
                  <div>
                    <RobotPage />
                  </div>
                </Slide>
              }
              key={index}
            />
          ))}
          <Route
            path={'/offers'}
            element={
              <Slide
                direction={page === 'offers' ? slideDirection.in : slideDirection.out}
                in={page === 'offers'}
                appear={slideDirection.in !== undefined}
              >
                <div>
                  <BookPage />
                </div>
              </Slide>
            }
          />
          <Route
            path='/create'
            element={
              <Slide
                direction={page === 'create' ? slideDirection.in : slideDirection.out}
                in={page === 'create'}
                appear={slideDirection.in !== undefined}
              >
                <div>
                  <MakerPage />
                </div>
              </Slide>
            }
          />
          <Route
            path='/order/:shortAlias/:orderId'
            element={
              <Slide
                direction={page === 'order' ? slideDirection.in : slideDirection.out}
                in={page === 'order'}
                appear={slideDirection.in !== undefined}
              >
                <div>
                  <OrderPage />
                </div>
              </Slide>
            }
          />
          <Route
            path='/settings'
            element={
              <Slide
                direction={page === 'settings' ? slideDirection.in : slideDirection.out}
                in={page === 'settings'}
                appear={slideDirection.in !== undefined}
              >
                <div>
                  <SettingsPage />
                </div>
              </Slide>
            }
          />
        </Routes>
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


