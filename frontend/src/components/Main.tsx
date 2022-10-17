import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme } from '@mui/material';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import BottomBar from './BottomBar';

import { apiClient } from '../services/api';

import { Book, LimitList } from '../models';

interface Limits {
  list: LimitList;
  loading: boolean;
}

const Main = (): JSX.Element => {
  const theme = useTheme();
  const history = useHistory();
  const Router = window.NativeRobosats ? HashRouter : BrowserRouter;
  const basename = window.NativeRobosats ? window.location.pathname : '';
  const [windowSize, setWindowSize] = useState<number[]>(); // EM values

  // All app data structured
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<Limits>({ list: [], loading: true });
  const [robot, setRobot] = useState();
  const [maker, setMaker] = useState();
  const [info, setInfo] = useState();
  const [favorites, setFavorites] = useState();
  const [settings, setSettings] = useState();

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     type: null,
  //     currency: 0,
  //     lastDayPremium: 0,
  //   };
  // }

  useEffect(() => {
    if (typeof window !== undefined) {
      onResize();
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
    setWindowSize([
      window.innerWidth / theme.typography.fontSize,
      window.innerHeight / theme.typography.fontSize,
    ]);
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
      setLimits({ limits: data, loading: false });
      return data;
    });
    return data;
  };

  return (
    <Router basename={basename}>
      <div className='appCenter'>
        <Switch>
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
          />
          <Route
            path='/make'
            render={() => (
              <MakerPage
                orders={book.orders}
                fetchLimits={fetchLimits}
                maker={maker}
                setMaker={setMaker}
              />
            )}
          />
          <Route
            path='/book'
            render={(props) => (
              <BookPage
                {...props}
                {...this.state}
                {...this.props}
                book={book}
                fetchBook={this.fetchBook}
                fetchLimits={this.fetchLimits}
                setAppState={this.setAppState}
              />
            )}
          />
          <Route
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
        </Switch>
      </div>
      <div
        className='bottomBar'
        style={{
          height: '2.857em',
          width: `${(windowSize[0] / 16) * 14}em`,
        }}
      >
        <BottomBar
          redirectTo={(location) => history.push(location)}
          {...this.state}
          {...this.props}
          setAppState={this.setAppState}
        />
      </div>
    </Router>
  );
};

export default Main;
