import React, { createContext, useEffect, useReducer, useState } from 'react';
import { type Page } from '../basic/NavBar';
import { type OpenDialogs } from '../basic/MainDialogs';

import {
  type Book,
  type Maker,
  Robot,
  Garage,
  Settings,
  type Favorites,
  defaultMaker,
  Coordinator,
  type Exchange,
  type Order,
  type PublicOrder,
  type Limits,
  defaultExchange,
  type Federation,
} from '../models';

import { apiClient } from '../services/api';
import { systemClient } from '../services/System';
import { getClientVersion, getHost, hexToBase91, validateTokenEntropy } from '../utils';
import { sha256 } from 'js-sha256';

import defaultFederation from '../../static/federation.json';
import { updateExchangeInfo } from '../models/Exchange.model';
import { createTheme, type Theme } from '@mui/material/styles';
import i18n from '../i18n/Web';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

const getHostUrl = (network = 'mainnet') => {
  let host = '';
  let protocol = '';
  let origin = '';
  if (window.NativeRobosats === undefined) {
    host = getHost();
    protocol = location.protocol;
  } else {
    host = defaultFederation.exp[network].Onion;
    protocol = 'http:';
  }
  const hostUrl = `${protocol}//${host}`;
  if (window.NativeRobosats != undefined || host.includes('.onion')) {
    origin = 'onion';
  } else if (host.includes('i2p')) {
    origin = 'i2p';
  } else {
    origin = 'clearnet';
  }

  return [hostUrl, origin];
};

export const [hostUrl, origin] = getHostUrl();

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
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

export type TorStatus = 'NOTINIT' | 'STARTING' | '"Done"' | 'DONE';

const initialFederation: Federation = Object.entries(defaultFederation).reduce(
  (acc, [key, value]) => {
    acc[key] = new Coordinator(value);
    return acc;
  },
  {},
);

interface ActionFederation {
  type: 'reset' | 'enable' | 'disable' | 'updateBook' | 'updateLimits' | 'updateInfo';
  action: any; // TODO
}

const reduceFederation = (federation: Federation, action: ActionFederation) => {
  switch (action.type) {
    case 'reset':
      return initialFederation;
    case 'enable':
      return {
        ...federation,
        [action.payload.shortAlias]: {
          ...federation[action.payload.shortAlias],
          enabled: true,
        },
      };
    case 'disable':
      return {
        ...federation,
        [action.payload.shortAlias]: {
          ...federation[action.payload.shortAlias],
          enabled: false,
          info: undefined,
        },
      };
    case 'updateBook':
      return {
        ...federation,
        [action.payload.shortAlias]: {
          ...federation[action.payload.shortAlias],
          book: action.payload.book,
          loadingBook: action.payload.loadingBook,
        },
      };
    case 'updateLimits':
      return {
        ...federation,
        [action.payload.shortAlias]: {
          ...federation[action.payload.shortAlias],
          limits: action.payload.limits,
          loadingLimits: action.payload.loadingLimits,
        },
      };
    case 'updateInfo':
      return {
        ...federation,
        [action.payload.shortAlias]: {
          ...federation[action.payload.shortAlias],
          info: action.payload.info,
          loadingInfo: action.payload.loadingInfo,
        },
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const totalCoordinators = Object.keys(initialFederation).length;

const initialBook: Book = {
  orders: [],
  loading: true,
  loadedCoordinators: 0,
  totalCoordinators,
};

const initialLimits: Limits = {
  list: [],
  loading: true,
  loadedCoordinators: 0,
  totalCoordinators,
};

const initialExchange: Exchange = { ...defaultExchange, totalCoordinators };

const entryPage: Page | '' | 'index.html' =
  window.NativeRobosats === undefined ? window.location.pathname.split('/')[1] : '';

export const closeAll = {
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

const makeTheme = function (settings: Settings) {
  const theme: Theme = createTheme({
    palette: {
      mode: settings.mode,
      background: {
        default: settings.mode === 'dark' ? '#070707' : '#fff',
      },
    },
    typography: { fontSize: settings.fontSize },
  });

  return theme;
};

export const useAppStore = () => {
  // State provided right at the top level of the app. A chaotic bucket of everything.
  // Contains app-wide state and functions. Triggers re-renders on the full tree often.

  const [settings, setSettings] = useState<Settings>(() => {
    return new Settings();
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return makeTheme(settings);
  });

  useEffect(() => {
    setTheme(makeTheme(settings));
  }, [settings.fontSize, settings.mode, settings.lightQRs]);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, []);

  // All app data structured
  const [torStatus, setTorStatus] = useState<TorStatus>('NOTINIT');
  const [book, setBook] = useState<Book>(initialBook);
  const [limits, setLimits] = useState<Limits>(initialLimits);
  const [garage, setGarage] = useState<Garage>(() => {
    return new Garage();
  });
  const [currentSlot, setCurrentSlot] = useState<number>(() => {
    return garage.slots.length - 1;
  });
  const [robot, setRobot] = useState<Robot>(() => {
    return new Robot(garage.slots[currentSlot].robot);
  });
  const [maker, setMaker] = useState<Maker>(defaultMaker);
  const [exchange, setExchange] = useState<Exchange>(initialExchange);
  const [federation, dispatchFederation] = useReducer(reduceFederation, initialFederation);

  const [focusedCoordinator, setFocusedCoordinator] = useState<string>('');
  const [fav, setFav] = useState<Favorites>({ type: null, currency: 0, mode: 'fiat' });

  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [badOrder, setBadOrder] = useState<string | undefined>(undefined);

  const [page, setPage] = useState<Page>(
    entryPage == '' || entryPage == 'index.html' ? 'robot' : entryPage,
  );
  const [slideDirection, setSlideDirection] = useState<SlideDirection>({
    in: undefined,
    out: undefined,
  });
  const [currentOrder, setCurrentOrder] = useState<{
    shortAlias: string | null;
    id: number | null;
  }>({ shortAlias: null, id: null });

  const navbarHeight = 2.5;
  const clientVersion = getClientVersion();

  const [open, setOpen] = useState<OpenDialogs>(closeAll);

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() =>
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    window.addEventListener('torStatus', (event) => {
      // Trick to improve UX on Android webview: delay the "Connected to TOR" status by 5 secs to avoid long waits on the first request.
      setTimeout(
        () => {
          setTorStatus(event?.detail);
        },
        event?.detail === '"Done"' ? 5000 : 0,
      );
    });
  }, []);

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }

    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  useEffect(() => {
    // On bitcoin network change we reset book, limits and federation info and fetch everything again
    setBook(initialBook);
    setLimits(initialLimits);
    dispatchFederation({ type: 'reset' });
    fetchFederationBook();
    fetchFederationInfo();
    fetchFederationLimits();
  }, [settings.network]);

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  // fetch Limits
  const fetchCoordinatorLimits = async (coordinator: Coordinator) => {
    const url = coordinator[settings.network][origin];
    const limits = await apiClient
      .get(url, '/api/limits/')
      .then((data) => {
        return data;
      })
      .catch(() => {
        return undefined;
      });
    dispatchFederation({
      type: 'updateLimits',
      payload: { shortAlias: coordinator.shortAlias, limits, loadingLimits: false },
    });
  };

  const fetchFederationLimits = function () {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        // set limitLoading=true
        dispatchFederation({
          type: 'updateLimits',
          payload: { shortAlias, limits: coordinator.limits, loadingLimits: true },
        });
        // fetch new limits
        fetchCoordinatorLimits(coordinator);
      }
    });
  };

  // fetch Books
  const fetchCoordinatorBook = async (coordinator: Coordinator) => {
    const url = coordinator[settings.network][origin];
    const book = await apiClient
      .get(url, '/api/book/')
      .then((data) => {
        return data.not_found ? [] : data;
      })
      .catch(() => {
        return [];
      });
    dispatchFederation({
      type: 'updateBook',
      payload: { shortAlias: coordinator.shortAlias, book, loadingBook: false },
    });
  };

  const fetchFederationBook = function () {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        dispatchFederation({
          type: 'updateBook',
          payload: { shortAlias, book: coordinator.book, loadingBook: true },
        });
        fetchCoordinatorBook(coordinator);
      }
    });
  };

  // fetch Info
  const fetchCoordinatorInfo = async (coordinator: Coordinator) => {
    const url = coordinator[settings.network][origin];
    const info = await apiClient
      .get(url, '/api/info/')
      .then((data) => {
        return data;
      })
      .catch(() => {
        return undefined;
      });
    dispatchFederation({
      type: 'updateInfo',
      payload: { shortAlias: coordinator.shortAlias, info, loadingInfo: false },
    });
  };

  const fetchFederationInfo = function () {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        dispatchFederation({
          type: 'updateInfo',
          payload: { shortAlias, info: coordinator.info, loadingInfo: true },
        });
        fetchCoordinatorInfo(coordinator);
      }
    });
  };

  const updateBook = () => {
    setBook((book) => {
      return { ...book, loading: true, loadedCoordinators: 0 };
    });
    let orders: PublicOrder[] = book.orders;
    let loadedCoordinators: number = 0;
    let totalCoordinators: number = 0;
    Object.values(federation).map((coordinator) => {
      if (coordinator.enabled) {
        totalCoordinators = totalCoordinators + 1;
        if (!coordinator.loadingBook) {
          const existingOrders = orders.filter(
            (order) => order.coordinatorShortAlias !== coordinator.shortAlias,
          );
          console.log('Existing Orders', existingOrders);
          const newOrders: PublicOrder[] = coordinator.book.map((order) => ({
            ...order,
            coordinatorShortAlias: coordinator.shortAlias,
          }));
          orders = [...existingOrders, ...newOrders];
          // orders.push.apply(existingOrders, newOrders);
          loadedCoordinators = loadedCoordinators + 1;
        }
      }
      const loading = loadedCoordinators != totalCoordinators;
      setBook({ orders, loading, loadedCoordinators, totalCoordinators });
    });
  };

  const updateLimits = () => {
    const newLimits: LimitList | never[] = [];
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.limits) {
        for (const currency in coordinator.limits) {
          newLimits[currency] = compareUpdateLimit(
            newLimits[currency],
            coordinator.limits[currency],
          );
        }
      }
    });
    setLimits(newLimits);
  };

  const updateExchange = () => {
    const onlineCoordinators = Object.keys(federation).reduce((count, shortAlias) => {
      if (!federation[shortAlias].loadingInfo && federation[shortAlias].info) {
        return count + 1;
      } else {
        return count;
      }
    }, 0);
    const totalCoordinators = Object.keys(federation).reduce((count, shortAlias) => {
      return federation[shortAlias].enabled ? count + 1 : count;
    }, 0);
    setExchange({ info: updateExchangeInfo(federation), onlineCoordinators, totalCoordinators });
  };

  useEffect(() => {
    updateBook();
    // updateLimits();
    updateExchange();
  }, [federation]);

  useEffect(() => {
    if (open.exchange) {
      fetchFederationInfo();
    }
  }, [open.exchange, torStatus]);

  useEffect(() => {
    fetchFederationInfo();
  }, []);

  // Fetch current order at load and in a loop
  useEffect(() => {
    if (currentOrder.id != null && (page == 'order' || (order == badOrder) == undefined)) {
      fetchOrder();
    }
  }, [currentOrder, page]);

  useEffect(() => {
    clearInterval(timer);
    setTimer(setInterval(fetchOrder, delay));
    return () => {
      clearInterval(timer);
    };
  }, [delay, currentOrder, page, badOrder]);

  const orderReceived = function (data: any) {
    if (data.bad_request) {
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
    if (currentOrder.shortAlias != null) {
      apiClient
        .get(
          federation[currentOrder.shortAlias][settings.network][origin],
          '/api/order/?order_id=' + currentOrder.id,
          { tokenSHA256: robot.tokenSHA256 },
        )
        .then(orderReceived);
    }
  };

  const clearOrder = function () {
    setOrder(undefined);
    setBadOrder(undefined);
  };

  const fetchRobot = function ({
    newToken,
    newKeys,
    slot,
    isRefresh = false,
  }: fetchRobotProps): void {
    const token = newToken ?? robot.token ?? '';

    const { hasEnoughEntropy, bitsEntropy, shannonEntropy } = validateTokenEntropy(token);

    if (!hasEnoughEntropy) {
      return;
    }

    const tokenSHA256 = hexToBase91(sha256(token));
    const targetSlot = slot ?? currentSlot;
    const encPrivKey = newKeys?.encPrivKey ?? robot.encPrivKey ?? '';
    const pubKey = newKeys?.pubKey ?? robot.pubKey ?? '';

    // On first authenticated requests, pubkey and privkey are needed in header cookies
    const auth = {
      tokenSHA256,
      keys: {
        pubKey: pubKey.split('\n').join('\\'),
        encPrivKey: encPrivKey.split('\n').join('\\'),
      },
    };

    if (!isRefresh) {
      setRobot((robot) => {
        return {
          ...robot,
          loading: true,
          avatarLoaded: false,
        };
      });
    }

    apiClient
      .get(hostUrl, '/api/robot/', auth)
      .then((data: any) => {
        const newRobot = {
          avatarLoaded: isRefresh ? robot.avatarLoaded : false,
          nickname: data.nickname,
          token,
          tokenSHA256,
          loading: false,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          last_login: data.last_login,
          bitsEntropy,
          shannonEntropy,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
          copiedToken: !!data.found,
        };
        if (currentOrder === undefined) {
          setCurrentOrder(
            data.active_order_id
              ? data.active_order_id
              : data.last_order_id
              ? data.last_order_id
              : null,
          );
        }
        setRobot(newRobot);
        garage.updateRobot(newRobot, targetSlot);
        setCurrentSlot(targetSlot);
      })
      .finally(() => {
        systemClient.deleteCookie('public_key');
        systemClient.deleteCookie('encrypted_private_key');
      });
  };

  useEffect(() => {
    if (hostUrl != '' && page != 'robot') {
      if (open.profile && robot.avatarLoaded) {
        fetchRobot({ isRefresh: true }); // refresh/update existing robot
      } else if (!robot.avatarLoaded && robot.token && robot.encPrivKey && robot.pubKey) {
        fetchRobot({}); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, hostUrl]);

  return {
    theme,
    torStatus,
    settings,
    setSettings,
    book,
    setBook,
    federation,
    dispatchFederation,
    garage,
    setGarage,
    currentSlot,
    setCurrentSlot,
    fetchFederationBook,
    limits,
    setLimits,
    fetchFederationLimits,
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
    open,
    setOpen,
    windowSize,
    clientVersion,
  };
};

export type UseAppStoreType = ReturnType<typeof useAppStore>;

export const AppContext = createContext<UseAppStoreType | null>(null);
