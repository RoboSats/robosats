import React, { useContext } from 'react';
import { HashRouter, BrowserRouter, Switch, Route } from 'react-router-dom';
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
import { AppContextProps, AppContext } from '../contexts/AppContext';

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
    closeAll,
    setOpen,
    windowSize,
    navbarHeight,
  } = useContext<AppContextProps>(AppContext);

  const Router = window.NativeRobosats === undefined ? BrowserRouter : HashRouter;
  const basename = window.NativeRobosats === undefined ? '' : window.location.pathname;
<<<<<<< HEAD
=======
  const entryPage: Page | '' =
    window.NativeRobosats === undefined ? window.location.pathname.split('/')[1] : '';
  const [page, setPage] = useState<Page>(entryPage == '' ? 'robot' : entryPage);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>({
    in: undefined,
    out: undefined,
  });

  const [currentOrder, setCurrentOrder] = useState<number | undefined>(undefined);

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

    if (baseUrl != '') {
      setBook({ ...book, orders: [] });
      fetchBook();
      fetchLimits();
    }

    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, [baseUrl]);

  useEffect(() => {
    let host = '';
    if (window.NativeRobosats === undefined) {
      host = getHost();
    } else {
      host = coordinators[0][`${settings.network}Onion`];
    }
    setBaseUrl(`http://${host}`);
  }, [settings.network]);

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  const fetchBook = function () {
    setBook({ ...book, loading: true });
    apiClient.get(baseUrl, '/api/book/').then((data: any) =>
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      }),
    );
  };

  const fetchLimits = async () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get(baseUrl, '/api/limits/').then((data) => {
      setLimits({ list: data ?? [], loading: false });
      return data;
    });
    return await data;
  };

  const fetchInfo = function (setNetwork?: boolean) {
    coordinators.map((coordinator, i) => {
      if (coordinator.enabled === true) {
        const baseUrl = coordinator[`mainnetClearnet`];
        apiClient
          .get(baseUrl, '/api/info/', { mode: 'no-cors' })
          .then((data: Info) => {
            let info: Info;
            const versionInfo: any = checkVer(
              data.version.major,
              data.version.minor,
              data.version.patch,
            );
            info = {
              ...data,
              openUpdateClient: versionInfo.updateAvailable,
              coordinatorVersion: versionInfo.coordinatorVersion,
              clientVersion: versionInfo.clientVersion,
              loading: false,
            };
            setInfo(info);
            setCoordinators((coordinators) => {
              coordinators[i].info = info;
              return coordinators;
            });
          })
          .finally(() => {
            setCoordinators((coordinators) => {
              coordinators[i].loadingInfo = false;
              return coordinators;
            });
          });
      }
    });
  };

  // const fetchInfo = function () {
  //   setInfo({ ...info, loading: true });
  //   apiClient.get(baseUrl, '/api/info/').then((data: Info) => {
  //     const versionInfo: any = checkVer(data.version.major, data.version.minor, data.version.patch);
  //     const info = {
  //       ...data,
  //       openUpdateClient: versionInfo.updateAvailable,
  //       coordinatorVersion: versionInfo.coordinatorVersion,
  //       clientVersion: versionInfo.clientVersion,
  //       loading: false,
  //     };
  //     setInfo(info);
  //     const newCoordinators = coordinators.map((coordinator) => {
  //       return { ...coordinator, info };
  //     });
  //     setCoordinators(newCoordinators);
  //   });
  // };

  useEffect(() => {
    if (open.stats || open.coordinator || info.coordinatorVersion == 'v?.?.?') {
      fetchInfo();
    }
  }, [open.stats, open.coordinator]);

  useEffect(() => {
    // Sets Setting network from coordinator API param if accessing via web
    if (settings.network == undefined && info.network) {
      setSettings((settings: Settings) => {
        return { ...settings, network: info.network };
      });
    }
  }, [info]);

  const fetchRobot = function ({ keys = false }) {
    const requestBody = {
      token_sha256: sha256(robot.token),
    };
    if (keys) {
      requestBody.pub_key = robot.pubKey;
      requestBody.enc_priv_key = robot.encPrivKey;
    }

    setRobot({ ...robot, loading: true });
    apiClient.post(baseUrl, '/api/user/', requestBody).then((data: any) => {
      setCurrentOrder(
        data.active_order_id
          ? data.active_order_id
          : data.last_order_id
          ? data.last_order_id
          : null,
      );
      setRobot({
        ...robot,
        nickname: data.nickname,
        token: robot.token,
        loading: false,
        avatarLoaded: robot.nickname === data.nickname,
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
        pubKey: data.public_key,
        encPrivKey: data.encrypted_private_key,
        copiedToken: data.found ? true : robot.copiedToken,
      });
    });
  };

  useEffect(() => {
    if (baseUrl != '' && page != 'robot') {
      if (open.profile || (robot.token && robot.nickname === null)) {
        fetchRobot({ keys: false }); // fetch existing robot
      } else if (robot.token && robot.encPrivKey && robot.pubKey) {
        fetchRobot({ keys: true }); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, baseUrl]);

  // Fetch current order at load and in a loop
  useEffect(() => {
    if (currentOrder != undefined && (page == 'order' || (order == badOrder) == undefined)) {
      fetchOrder();
    }
  }, [currentOrder, page]);

  useEffect(() => {
    clearInterval(timer);
    setTimer(setInterval(fetchOrder, delay));
    return () => clearInterval(timer);
  }, [delay, currentOrder, page, badOrder]);

  const orderReceived = function (data: any) {
    if (data.bad_request != undefined) {
      setBadOrder(data.bad_request);
      setDelay(99999999);
      setOrder(undefined);
    } else {
      setDelay(
        data.status >= 0 && data.status <= 18
          ? page == 'order'
            ? statusToDelay[data.status]
            : statusToDelay[data.status] * 5
          : 99999999,
      );
      setOrder(data);
      setBadOrder(undefined);
    }
  };

  const fetchOrder = function () {
    if (currentOrder != undefined) {
      apiClient.get(baseUrl, '/api/order/?order_id=' + currentOrder).then(orderReceived);
    }
  };

  const clearOrder = function () {
    setOrder(undefined);
    setBadOrder(undefined);
  };
>>>>>>> Fetch info from multiple coordinators, allow no-cors and all origins

  return (
    <Router basename={basename}>
      <RobotAvatar
        style={{ display: 'none' }}
        nickname={robot.nickname}
        baseUrl={baseUrl}
        onLoad={() => setRobot({ ...robot, avatarLoaded: true })}
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
        <Switch>
          <Route
            path={['/robot/:refCode?', '/']}
            exact
            render={(props: any) => (
              <Slide
                direction={page === 'robot' ? slideDirection.in : slideDirection.out}
                in={page === 'robot'}
                appear={slideDirection.in != undefined}
              >
                <div>
                  <RobotPage />
                </div>
              </Slide>
            )}
          />

          <Route path={'/offers'}>
            <Slide
              direction={page === 'offers' ? slideDirection.in : slideDirection.out}
              in={page === 'offers'}
              appear={slideDirection.in != undefined}
            >
              <div>
                <BookPage />
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
                <MakerPage />
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
                  <OrderPage locationOrderId={props.match.params.orderId} />
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
                <SettingsPage />
              </div>
            </Slide>
          </Route>
        </Switch>
      </Box>
      <div style={{ alignContent: 'center', display: 'flex' }}>
        <NavBar width={windowSize.width} height={navbarHeight} />
      </div>
      <MainDialogs />
    </Router>
  );
};

export default Main;
