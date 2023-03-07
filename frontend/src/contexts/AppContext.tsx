import React, { useEffect, useState } from 'react';
import { Page } from '../basic/NavBar';
import { OpenDialogs } from '../basic/MainDialogs';

import {
  Book,
  LimitList,
  Maker,
  Robot,
  Garage,
  Settings,
  Favorites,
  defaultMaker,
  Coordinator,
  Exchange,
  Order,
  Version,
} from '../models';

import { apiClient } from '../services/api';
import { systemClient } from '../services/System';
import { getClientVersion, getHost, tokenStrength } from '../utils';
import { sha256 } from 'js-sha256';

import defaultFederation from '../../static/federation.json';
import { useTheme } from '@mui/material';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

// Refresh delays (ms) according to Order status
const statusToDelay = [
  3000, // 'Waiting for maker bond'
  35000, // 'Public'
  180000, // 'Paused'
  3000, // 'Waiting for taker bond'
  999999, // 'Cancelled'
  999999, // 'Expired'
  8000, // 'Waiting for trade collateral and buyer invoice'
  8000, // 'Waiting only for seller trade collateral'
  8000, // 'Waiting only for buyer invoice'
  10000, // 'Sending fiat - In chatroom'
  10000, // 'Fiat sent - In chatroom'
  100000, // 'In dispute'
  999999, // 'Collaboratively cancelled'
  10000, // 'Sending satoshis to buyer'
  60000, // 'Sucessful trade'
  30000, // 'Failed lightning network routing'
  300000, // 'Wait for dispute resolution'
  300000, // 'Maker lost dispute'
  300000, // 'Taker lost dispute'
];

export interface SlideDirection {
  in: 'left' | 'right' | undefined;
  out: 'left' | 'right' | undefined;
}

export interface fetchRobotProps {
  action?: 'login' | 'generate' | 'refresh';
  newKeys?: { encPrivKey: string; pubKey: string } | null;
  newToken?: string | null;
  refCode?: string | null;
  slot?: number | null;
  setBadRequest?: (state: string) => void;
}

export type TorStatus = 'NOTINIT' | 'STARTING' | '"Done"' | 'DONE';

export interface AppContextProps {
  torStatus: TorStatus;
  federation: Coordinator[];
  setFederation: (state: Coordinator[]) => void;
  settings: Settings;
  setSettings: (state: Settings) => void;
  book: Book;
  garage: Garage;
  setGarage: (state: Garage) => void;
  currentSlot: number;
  setCurrentSlot: (state: number) => void;
  setBook: (state: Book) => void;
  fetchBook: () => void;
  limits: { list: LimitList; loading: boolean };
  setLimits: (state: { list: LimitList; loading: boolean }) => void;
  fetchLimits: () => void;
  maker: Maker;
  setMaker: (state: Maker) => void;
  clearOrder: () => void;
  robot: Robot;
  setRobot: (state: Robot) => void;
  exchange: Exchange;
  setExchange: (state: Exchange) => void;
  focusedCoordinator: number;
  setFocusedCoordinator: (state: number) => void;
  baseUrl: string;
  setBaseUrl: (state: string) => void;
  fav: Favorites;
  setFav: (state: Favorites) => void;
  order: Order | undefined;
  setOrder: (state: Order | undefined) => void;
  badOrder: string;
  setBadOrder: (state: string | undefined) => void;
  setDelay: (state: number) => void;
  page: Page;
  setPage: (state: Page) => void;
  slideDirection: SlideDirection;
  setSlideDirection: (state: SlideDirection) => void;
  currentOrder: number | undefined;
  setCurrentOrder: (state: number) => void;
  navbarHeight: number;
  closeAll: OpenDialogs;
  open: OpenDialogs;
  setOpen: (state: OpenDialogs) => void;
  windowSize: { width: number; height: number };
  clientVersion: {
    semver: Version;
    short: string;
    long: string;
  };
}

const entryPage: Page | '' =
  window.NativeRobosats === undefined ? window.location.pathname.split('/')[1] : '';

const closeAll = {
  more: false,
  learn: false,
  community: false,
  info: false,
  coordinator: false,
  exchange: false,
  client: false,
  update: false,
  profile: false,
};

// export const initialState = {
//   federation: defaultFederation,
//   setFederation: () => null,
//   settings: new Settings(),
//   setSettings: () => null,
//   book: { orders: [], loading: true },
//   setBook: () => null,
//   fetchBook: () => null,
//   limits: {
//     list: [],
//     loading: true,
//   },
//   setLimits:() => null,
//   fetchLimits: ()=> null,
//   maker: defaultMaker,
//   setMaker: () => null,
//   clearOrder: () => null,
//   robot: new Robot(),
//   setRobot: () => null,
//   setExchange: () => null,
//   focusedCoordinator: 0,
//   setFocusedCoordinator: () => null,
//   baseUrl: '',
//   setBaseUrl: () => null,
//   fav: { type: null, currency: 0 },
//   setFav: () => null,
//   order: undefined,
//   setOrder: () => null,
//   badOrder: '',
//   setBadOrder: () => null,
//   setDelay: () => null,
//   page: entryPage == '' ? 'robot' : entryPage,
//   setPage: () => null,
//   slideDirection: {
//     in: undefined,
//     out: undefined,
//   },
//   setSlideDirection: () => null,
//   currentOrder: undefined,
//   setCurrentOrder: () => null,
//   navbarHeight: 2.5,
//   closeAll,
//   open: closeAll,
//   setOpen: () => null,
//   windowSize: getWindowSize(14),
// }

export interface AppContextProviderProps {
  children: React.ReactNode;
  settings: Settings;
  setSettings: (state: Settings) => void;
}

export const AppContextProvider = ({
  children,
  settings,
  setSettings,
}: AppContextProviderProps): JSX.Element => {
  const theme = useTheme();

  // All app data structured
  const [torStatus, setTorStatus] = useState<TorStatus>('NOTINIT');
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<{ list: LimitList; loading: boolean }>({
    list: [],
    loading: true,
  });
  const [garage, setGarage] = useState<Garage>(() => {
    const initialState = { setGarage };
    const newGarage = new Garage(initialState);
    return newGarage;
  });
  const [currentSlot, setCurrentSlot] = useState<number>(garage.slots.length - 1);
  const [robot, setRobot] = useState<Robot>(new Robot(garage.slots[currentSlot].robot));
  const [maker, setMaker] = useState<Maker>(defaultMaker);
  const [exchange, setExchange] = useState<Exchange>(new Exchange());
  const [federation, setFederation] = useState<Coordinator[]>(
    defaultFederation.map((c) => new Coordinator(c)),
  );
  console.log(federation);
  const [focusedCoordinator, setFocusedCoordinator] = useState<number>(0);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [fav, setFav] = useState<Favorites>({ type: null, currency: 0, mode: 'fiat' });

  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [badOrder, setBadOrder] = useState<string | undefined>(undefined);

  const [page, setPage] = useState<Page>(entryPage == '' ? 'robot' : entryPage);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>({
    in: undefined,
    out: undefined,
  });
  const [currentOrder, setCurrentOrder] = useState<number | undefined>(undefined);

  const navbarHeight = 2.5;
  const clientVersion = getClientVersion();

  const [open, setOpen] = useState<OpenDialogs>(closeAll);

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() =>
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    window.addEventListener('torStatus', (event) => {
      // UX improv: delay the "Conencted" status by 10 secs to avoid long waits for first requests
      setTimeout(() => setTorStatus(event?.detail), event?.detail === '"Done"' ? 5000 : 0);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }

    if (baseUrl != '') {
      setBook({ orders: [], loading: true });
      setLimits({ list: [], loading: true });
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
      host = federation[0][`${settings.network}Onion`];
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

  const fetchLimits = function () {
    federation.map((coordinator, i) => {
      if (coordinator.enabled === true) {
        coordinator.fetchLimits({ bitcoin: 'mainnet', network: 'Clearnet' }, () =>
          setFederation((f) => {
            return f;
          }),
        );
      }
    });
  };

  const fetchInfo = function () {
    federation.map((coordinator, i) => {
      if (coordinator.enabled === true) {
        coordinator.fetchInfo({ bitcoin: 'mainnet', network: 'Clearnet' }, () =>
          setFederation((f) => {
            return f;
          }),
        );
      }
    });
  };

  useEffect(() => {
    exchange.updateInfo(federation, () =>
      setExchange((i) => {
        return i;
      }),
    );
    exchange.updateLimits(federation, () =>
      setExchange((i) => {
        return i;
      }),
    );
    //exchange.updateBook(federation, () => setExchange((i)=> {return i}));
  }); //, [federation]);

  useEffect(() => {
    if (open.exchange) {
      fetchInfo();
    }
  }, [open.exchange, open.coordinator, torStatus]);

  useEffect(() => {
    fetchInfo();
  }, []);

  // useEffect(() => {
  //   // Sets Setting network from coordinator API param if accessing via web
  //   if (settings.network == undefined && info.network) {
  //     setSettings((settings: Settings) => {
  //       return { ...settings, network: info.network };
  //     });
  //   }
  // }, [info]);

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

  const fetchRobot = function ({
    action = 'login',
    newKeys = null,
    newToken = null,
    refCode = null,
    slot = null,
    setBadRequest = () => {},
  }: fetchRobotProps) {
    const oldRobot = robot;
    const targetSlot = slot ?? currentSlot;
    const token = newToken ?? oldRobot.token;
    if (action != 'refresh') {
      setRobot(new Robot());
    }
    setBadRequest('');

    const requestBody = {};
    if (action == 'login' || action == 'refresh') {
      requestBody.token_sha256 = sha256(token);
    } else if (action == 'generate' && token != null) {
      const strength = tokenStrength(token);
      requestBody.token_sha256 = sha256(token);
      requestBody.unique_values = strength.uniqueValues;
      requestBody.counts = strength.counts;
      requestBody.length = token.length;
      requestBody.ref_code = refCode;
      requestBody.public_key = newKeys?.pubKey ?? oldRobot.pubKey;
      requestBody.encrypted_private_key = newKeys?.encPrivKey ?? oldRobot.encPrivKey;
    }

    apiClient.post(baseUrl, '/api/user/', requestBody).then((data: any) => {
      let newRobot = robot;
      setCurrentOrder(
        data.active_order_id
          ? data.active_order_id
          : data.last_order_id
          ? data.last_order_id
          : null,
      );
      if (data.bad_request) {
        setBadRequest(data.bad_request);
        newRobot = {
          ...oldRobot,
          loading: false,
          nickname: data.nickname ?? oldRobot.nickname,
          activeOrderId: data.active_order_id ?? null,
          referralCode: data.referral_code ?? oldRobot.referralCode,
          earnedRewards: data.earned_rewards ?? oldRobot.earnedRewards,
          lastOrderId: data.last_order_id ?? oldRobot.lastOrderId,
          stealthInvoices: data.wants_stealth ?? robot.stealthInvoices,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: false,
        };
      } else {
        newRobot = {
          ...oldRobot,
          nickname: data.nickname,
          token,
          loading: false,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          referralCode: data.referral_code,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          bitsEntropy: data.token_bits_entropy,
          shannonEntropy: data.token_shannon_entropy,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
          copiedToken: !!data.found,
        };
        setRobot(newRobot);
        garage.updateRobot(newRobot, targetSlot);
        setCurrentSlot(targetSlot);
        systemClient.setItem('robot_token', token);
      }
    });
  };

  useEffect(() => {
    if (baseUrl != '' && page != 'robot') {
      if (open.profile && robot.avatarLoaded) {
        fetchRobot({ action: 'refresh' }); // refresh/update existing robot
      } else if (!robot.avatarLoaded && robot.token && robot.encPrivKey && robot.pubKey) {
        fetchRobot({ action: 'generate' }); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, baseUrl]);

  return (
    <AppContext.Provider
      value={{
        torStatus,
        settings,
        setSettings,
        book,
        setBook,
        federation,
        setFederation,
        garage,
        setGarage,
        currentSlot,
        setCurrentSlot,
        fetchBook,
        limits,
        setLimits,
        fetchLimits,
        maker,
        setMaker,
        clearOrder,
        robot,
        setRobot,
        fetchRobot,
        exchange,
        setExchange,
        focusedCoordinator,
        setFocusedCoordinator,
        baseUrl,
        setBaseUrl,
        fav,
        setFav,
        order,
        setOrder,
        badOrder,
        setBadOrder,
        setDelay,
        page,
        setPage,
        slideDirection,
        setSlideDirection,
        currentOrder,
        setCurrentOrder,
        navbarHeight,
        closeAll,
        open,
        setOpen,
        windowSize,
        clientVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppContext = React.createContext();
