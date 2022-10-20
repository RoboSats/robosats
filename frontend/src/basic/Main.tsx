import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme } from '@mui/material';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import BottomBar from './BottomBar';

import { apiClient } from '../services/api';
import checkVer from '../utils/checkVer';

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

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

const Main = (): JSX.Element => {
  const theme = useTheme();
  const history = useHistory();
  const Router = window.NativeRobosats != null ? HashRouter : BrowserRouter;
  const basename = window.NativeRobosats != null ? window.location.pathname : '';

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

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }
    fetchBook();
    fetchLimits();
    fetchInfo();
    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  const fetchBook = function () {
    setBook({ ...book, loading: true });
    apiClient.get('/api/book/').then((data: any) =>
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      }),
    );
  };

  const fetchLimits = async () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get('/api/limits/').then((data) => {
      setLimits({ list: data ?? [], loading: false });
      return data;
    });
    return await data;
  };

  const fetchInfo = function () {
    apiClient.get('/api/info/').then((data: any) => {
      const versionInfo: any = checkVer(data.version.major, data.version.minor, data.version.patch);
      setInfo({
        ...data,
        openUpdateClient: versionInfo.updateAvailable,
        coordinatorVersion: versionInfo.coordinatorVersion,
        clientVersion: versionInfo.clientVersion,
      });
      setRobot({
        ...robot,
        nickname: data.nickname,
        loading: false,
        activeOrderId: data.active_order_id ?? null,
        lastOrderId: data.last_order_id ?? null,
        referralCode: data.referral_code,
        tgEnabled: data.tg_enabled,
        tgBotName: data.tg_bot_name,
        tgToken: data.tg_token,
        earnedRewards: data.earned_rewards ?? 0,
        stealthInvoices: data.wants_stealth,
      });
    });
  };

  console.log(robot);
  return (
    <Router basename={basename}>
      <div className='appCenter'>
        <Switch>
          <Route
            exact
            path='/'
            render={(props: any) => (
              <UserGenPage match={props.match} theme={theme} robot={robot} setRobot={setRobot} />
            )}
          />
          <Route
            path='/ref/:refCode'
            render={(props: any) => (
              <UserGenPage match={props.match} theme={theme} robot={robot} setRobot={setRobot} />
            )}
          />
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
          <Route
            path='/order/:orderId'
            render={(props: any) => <OrderPage theme={theme} history={history} {...props} />}
          />
        </Switch>
      </div>
      <div
        style={{
          height: '2.5em',
          position: 'fixed',
          bottom: 0,
        }}
      >
        <BottomBar
          theme={theme}
          windowSize={windowSize}
          redirectTo={(location: string) => history.push(location)}
          robot={robot}
          setRobot={setRobot}
          info={info}
          setInfo={setInfo}
          fetchInfo={fetchInfo}
        />
      </div>
    </Router>
  );
};

export default Main;
