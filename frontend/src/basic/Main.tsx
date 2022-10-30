import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme, Box, Slide } from '@mui/material';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import SettingsPage from './SettingsPage';
import NavBar, { Page } from './NavBar';
import MainDialogs, { OpenDialogs } from './MainDialogs';

import { apiClient } from '../services/api';
import { checkVer } from '../utils';

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
} from '../models';
import { sha256 } from 'js-sha256';
import RobotAvatar from '../components/RobotAvatar';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

interface SlideDirection {
  in: 'left' | 'right' | undefined;
  out: 'left' | 'right' | undefined;
}

interface MainProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const Main = ({ settings, setSettings }: MainProps): JSX.Element => {
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

  const theme = useTheme();
  const history = useHistory();

  const Router = window.NativeRobosats != null ? HashRouter : BrowserRouter;
  const basename = window.NativeRobosats != null ? window.location.pathname : '';
  const [page, setPage] = useState<Page>(
    window.location.pathname.split('/')[1] == ''
      ? 'offers'
      : window.location.pathname.split('/')[1],
  );
  const [slideDirection, setSlideDirection] = useState<SlideDirection>({
    in: undefined,
    out: undefined,
  });
  const [order, setOrder] = useState<number | null>(null);

  const navbarHeight = 2.5;
  const closeAll = {
    more: false,
    learn: false,
    community: false,
    info: false,
    coordinator: false,
    stats: false,
    update: false,
    profile: false,
  };
  const [open, setOpen] = useState<OpenDialogs>(closeAll);

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

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

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
    });
  };

  const fetchRobot = function () {
    const requestBody = {
      token_sha256: sha256(robot.token),
    };

    apiClient.post('/api/user/', requestBody).then((data: any) => {
      setOrder(
        data.active_order_id
          ? data.active_order_id
          : data.last_order_id
          ? data.last_order_id
          : order,
      );
      setRobot({
        ...robot,
        nickname: data.nickname,
        token: robot.token,
        loading: false,
        avatarLoaded: false,
        activeOrderId: data.active_order_id ? data.active_order_id : null,
        lastOrderId: data.last_order_id ? data.last_order_id : null,
        referralCode: data.referral_code,
        earnedRewards: data.earned_rewards ?? 0,
        stealthInvoices: data.wants_stealth,
        tgEnabled: data.tg_enabled,
        tgBotName: data.tg_bot_name,
        tgToken: data.tg_token,
        bitsEntropy: data.token_bits_entropy,
        shannonEntropy: data.token_shannon_entropy,
        pub_key: data.public_key,
        enc_priv_key: data.encrypted_private_key,
        copiedToken: data.found ? true : robot.copiedToken,
      });
    });
  };

  useEffect(() => {
    if (robot.token && robot.nickname === null) {
      fetchRobot();
    }
  }, []);

  console.log(page);

  return (
    <Router basename={basename}>
      {/* load robot avatar image, set avatarLoaded: true */}
      <RobotAvatar
        style={{ display: 'none' }}
        nickname={robot.nickname}
        onLoad={() => setRobot({ ...robot, avatarLoaded: true })}
      />
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(0,  -${navbarHeight / 2}em`,
        }}
      >
        <Switch>
          <Route
            path='/robot/:refCode?'
            render={(props: any) => (
              <Slide
                direction={page === 'robot' ? slideDirection.in : slideDirection.out}
                in={page === 'robot'}
                appear={slideDirection.in != undefined}
              >
                <div>
                  <UserGenPage
                    setPage={setPage}
                    order={order}
                    setOrder={setOrder}
                    match={props.match}
                    theme={theme}
                    robot={robot}
                    setRobot={setRobot}
                  />
                </div>
              </Slide>
            )}
          />

          <Route exact path={['/offers', '/']}>
            <Slide
              direction={page === 'offers' ? slideDirection.in : slideDirection.out}
              in={page === 'offers'}
              appear={slideDirection.in != undefined}
            >
              <div>
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
                  hasRobot={robot.avatarLoaded}
                  setPage={setPage}
                  setOrder={setOrder}
                />
              </div>
            </Slide>
          </Route>

          <Route path='/create'>
            <Slide
              direction={page === 'create' ? slideDirection.in : slideDirection.out}
              in={page === 'create'}
              appear={slideDirection.in != undefined}
            >
              <div>
                <MakerPage
                  book={book}
                  limits={limits}
                  fetchLimits={fetchLimits}
                  maker={maker}
                  setMaker={setMaker}
                  setPage={setPage}
                  setOrder={setOrder}
                  fav={fav}
                  setFav={setFav}
                  windowSize={{ ...windowSize, height: windowSize.height - navbarHeight }}
                  hasRobot={robot.avatarLoaded}
                />
              </div>
            </Slide>
          </Route>

          <Route
            path='/order/:orderId'
            render={(props: any) => (
              <Slide
                direction={page === 'order' ? slideDirection.in : slideDirection.out}
                in={page === 'order'}
                appear={slideDirection.in != undefined}
              >
                <div>
                  <OrderPage theme={theme} history={history} {...props} />
                </div>
              </Slide>
            )}
          />

          <Route path='/settings'>
            <Slide
              direction={page === 'settings' ? slideDirection.in : slideDirection.out}
              in={page === 'settings'}
              appear={slideDirection.in != undefined}
            >
              <div>
                <SettingsPage
                  settings={settings}
                  setSettings={setSettings}
                  windowSize={{ ...windowSize, height: windowSize.height - navbarHeight }}
                />
              </div>
            </Slide>
          </Route>
        </Switch>
      </Box>
      <NavBar
        nickname={robot.avatarLoaded ? robot.nickname : null}
        width={windowSize.width}
        height={navbarHeight}
        page={page}
        setPage={setPage}
        open={open}
        setOpen={setOpen}
        closeAll={closeAll}
        setSlideDirection={setSlideDirection}
        order={order}
        hasRobot={robot.avatarLoaded}
      />
      <MainDialogs
        open={open}
        setOpen={setOpen}
        setRobot={setRobot}
        info={info}
        robot={robot}
        closeAll={closeAll}
      />
    </Router>
  );
};

export default Main;
