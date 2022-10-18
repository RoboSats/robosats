import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme } from '@mui/material';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import BottomBar from './BottomBar';

import { apiClient } from '../services/api';

import {
  Book,
  LimitList,
  Maker,
  Robot,
  Info,
  Settings,
  Favorites,
  defaultMaker,
  defaultRobot,
  defaultInfo,
  defaultSettings,
} from '../models';

const Main = (): JSX.Element => {
  const theme = useTheme();
  const history = useHistory();
  const Router = window.NativeRobosats ? HashRouter : BrowserRouter;
  const basename = window.NativeRobosats ? window.location.pathname : '';

  // All app data structured
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<{ list: LimitList; loading: boolean }>({
    list: [],
    loading: true,
  });
  const [robot, setRobot] = useState<Robot>(defaultRobot);
  const [maker, setMaker] = useState<Maker>(defaultMaker);
  const [info, setInfo] = useState<Info>(defaultInfo);
  const [fav, setFav] = useState<Favorites>({ type: null, currency: 0 });
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  console.log(info);
  const initialWindowSize = {
    width: window.innerWidth / theme.typography.fontSize,
    height: window.innerHeight / theme.typography.fontSize,
  }; // EM values
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    initialWindowSize,
  );

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }
    fetchBook();
    fetchLimits();
    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  const onResize = function () {
    setWindowSize({
      width: window.innerWidth / theme.typography.fontSize,
      height: window.innerHeight / theme.typography.fontSize,
    });
  };

  const fetchBook = function () {
    setBook({ ...book, loading: true });
    apiClient.get('/api/book/').then((data) =>
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      }),
    );
  };

  const fetchLimits = () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get('/api/limits/').then((data) => {
      setLimits({ list: data, loading: false });
      return data;
    });
    return data;
  };

  return (
    <Router basename={basename}>
      <div className='appCenter'>
        <Switch>
          {/* 
          <Route
            exact
            path='/'
            render={(props) => (
              <UserGenPage
                {...props}
                {...this.state}
                {...this.props}
                setAppState={this.setAppState}
              />
            )}
          />
          <Route
            path='/ref/:refCode'
            render={(props) => (
              <UserGenPage
                {...props}
                {...this.state}
                {...this.props}
                setAppState={this.setAppState}
              />
            )}
          /> */}
          <Route
            path='/make'
            render={() => (
              <MakerPage
                orders={book.orders}
                limits={limits}
                fetchLimits={fetchLimits}
                maker={maker}
                setMaker={setMaker}
                fav={fav}
                setFav={setFav}
                windowSize={windowSize}
              />
            )}
          />
          <Route
            path='/book'
            render={() => (
              <BookPage
                book={book}
                fetchBook={fetchBook}
                limits={limits}
                fetchLimits={fetchLimits}
                fav={fav}
                setFav={setFav}
                maker={maker}
                setMaker={setMaker}
                lastDayPremium={info.last_day_nonkyc_btc_premium}
                windowSize={windowSize}
              />
            )}
          />
          {/* <Route
            path='/order/:orderId'
            render={(props) => (
              <OrderPage
                {...props}
                {...this.state}
                {...this.props}
                setAppState={this.setAppState}
              />
            )}
          />
           */}
        </Switch>
      </div>
      {/* <div
        className='bottomBar'
        style={{
          height: '2.857em',
          width: `${(windowSize.width / 16) * 14}em`,
        }}
      >
        <BottomBar redirectTo={(location) => history.push(location)} info={info} />
      </div> */}
    </Router>
  );
};

export default Main;
