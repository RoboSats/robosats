import React, { useContext } from 'react';
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Slide, Typography } from '@mui/material';

import RobotPage from './RobotPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import SettingsPage from './SettingsPage';
import NavBar from './NavBar';
import MainDialogs from './MainDialogs';

import RobotAvatar from '../components/RobotAvatar';

import { useTranslation } from 'react-i18next';
import Notifications from '../components/Notifications';
import { UseAppStoreType, AppContext, closeAll } from '../contexts/AppContext';

const Router = window.NativeRobosats === undefined ? BrowserRouter : MemoryRouter;

const Main = (): JSX.Element => {
  const { t } = useTranslation();
  const {
    settings,
    robot,
    setRobot,
    baseUrl,
    order,
    page,
    setPage,
    slideDirection,
    setOpen,
    windowSize,
    navbarHeight,
  } = useContext<UseAppStoreType>(AppContext);

  return (
    <Router>
      <RobotAvatar
        style={{ display: 'none' }}
        nickname={robot.nickname}
        baseUrl={baseUrl}
        onLoad={() =>
          setRobot((robot) => {
            return { ...robot, avatarLoaded: true };
          })
        }
      />
      <Notifications
        order={order}
        page={page}
        openProfile={() => setOpen({ ...closeAll, profile: true })}
        rewards={robot.earnedRewards}
        setPage={setPage}
        windowWidth={windowSize.width}
      />
      {settings.network === 'testnet' ? (
        <div style={{ height: 0 }}>
          <Typography color='secondary' align='center'>
            <i>{t('Using Testnet Bitcoin')}</i>
          </Typography>
        </div>
      ) : (
        <></>
      )}

      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(0,  -${navbarHeight / 2}em`,
        }}
      >
        <Routes>
          {['/robot/:refCode?', '/', ''].map((path, index) => {
            return (
              <Route
                path={path}
                element={
                  <Slide
                    direction={page === 'robot' ? slideDirection.in : slideDirection.out}
                    in={page === 'robot'}
                    appear={slideDirection.in != undefined}
                  >
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
              <Slide
                direction={page === 'offers' ? slideDirection.in : slideDirection.out}
                in={page === 'offers'}
                appear={slideDirection.in != undefined}
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
                appear={slideDirection.in != undefined}
              >
                <div>
                  <MakerPage />
                </div>
              </Slide>
            }
          />

          <Route
            path='/order/:orderId'
            element={
              <Slide
                direction={page === 'order' ? slideDirection.in : slideDirection.out}
                in={page === 'order'}
                appear={slideDirection.in != undefined}
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
                appear={slideDirection.in != undefined}
              >
                <div>
                  <SettingsPage />
                </div>
              </Slide>
            }
          />
        </Routes>
      </Box>
      <div style={{ alignContent: 'center', display: 'flex' }}>
        <NavBar width={windowSize.width} height={navbarHeight} />
      </div>
      <MainDialogs />
    </Router>
  );
};

export default Main;
