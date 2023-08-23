import React, { createContext, useEffect, useState } from 'react';
import { type Page } from '../basic/NavBar';
import { type OpenDialogs } from '../basic/MainDialogs';

import {
  type Book,
  type LimitList,
  type Maker,
  Robot,
  Garage,
  type Info,
  Settings,
  type Favorites,
  defaultMaker,
  defaultInfo,
  type Coordinator,
  type Order,
} from '../models';

import { apiClient } from '../services/api';
import { checkVer, getHost, hexToBase91, validateTokenEntropy } from '../utils';
import { sha256 } from 'js-sha256';

import defaultCoordinators from '../../static/federation.json';
import { createTheme, type Theme } from '@mui/material/styles';
import i18n from '../i18n/Web';
import { systemClient } from '../services/System';

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
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

export type TorStatus = 'OFF' | 'STARTING' | 'ON' | 'STOPPING' | 'ERROR';

let entryPage: Page | '' | 'index.html' =
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
  const [torStatus, setTorStatus] = useState<TorStatus>('OFF');
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<{ list: LimitList; loading: boolean }>({
    list: [],
    loading: true,
  });
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
  const [info, setInfo] = useState<Info>(defaultInfo);
  const [coordinators, setCoordinators] = useState<Coordinator[]>(defaultCoordinators);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [fav, setFav] = useState<Favorites>({ type: null, mode: 'fiat', currency: 0 });

  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(setInterval(() => null, delay));
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [badOrder, setBadOrder] = useState<string | undefined>(undefined);

  const [page, setPage] = useState<Page>(
    entryPage == '' || entryPage == 'index.html' ? 'robot' : entryPage,
  );
  const [slideDirection, setSlideDirection] = useState<SlideDirection>({
    in: undefined,
    out: undefined,
  });
  const [currentOrder, setCurrentOrder] = useState<number | undefined>(undefined);

  const navbarHeight = 2.5;
  const [open, setOpen] = useState<OpenDialogs>(closeAll);

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    window.addEventListener('torStatus', (event) => {
      // Trick to improve UX on Android webview: delay the "Connected to Tor" status by 5 secs to avoid long waits on the first request.
      setTimeout(
        () => {
          setTorStatus(event?.detail);
        },
        event?.detail === 'ON' ? 5000 : 0,
      );
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
    let protocol = '';
    if (window.NativeRobosats === undefined) {
      host = getHost();
      protocol = location.protocol;
    } else {
      protocol = 'http:';
      host =
        settings.network === 'mainnet'
          ? coordinators[0].mainnetOnion
          : coordinators[0].testnetOnion;
    }
    setBaseUrl(`${protocol}//${host}`);
  }, [settings.network]);

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  const fetchBook = function () {
    setBook((book) => {
      return { ...book, loading: true };
    });
    apiClient.get(baseUrl, '/api/book/').then((data: any) => {
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      });
    });
  };

  const fetchLimits = async () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get(baseUrl, '/api/limits/').then((data) => {
      setLimits({ list: data ?? [], loading: false });
      return data;
    });
    return await data;
  };

  const fetchInfo = function () {
    setInfo({ ...info, loading: true });
    apiClient.get(baseUrl, '/api/info/').then((data: Info) => {
      const versionInfo: any = checkVer(data.version.major, data.version.minor, data.version.patch);
      setInfo({
        ...data,
        openUpdateClient: versionInfo.updateAvailable,
        coordinatorVersion: versionInfo.coordinatorVersion,
        clientVersion: versionInfo.clientVersion,
        loading: false,
      });
      setSettings({ ...settings, network: data.network });
    });
  };

  useEffect(() => {
    if (open.stats || open.coordinator || info.coordinatorVersion == 'v?.?.?') {
      if (window.NativeRobosats === undefined || torStatus == 'ON') {
        fetchInfo();
      }
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

  // Fetch current order at load and in a loop
  useEffect(() => {
    if (currentOrder != undefined && (page == 'order' || (order == badOrder) == undefined)) {
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
    if (currentOrder) {
      apiClient
        .get(baseUrl, '/api/order/?order_id=' + currentOrder, { tokenSHA256: robot.tokenSHA256 })
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
      .get(baseUrl, '/api/robot/', auth)
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
    if (baseUrl != '' && page != 'robot') {
      if (open.profile && robot.avatarLoaded) {
        fetchRobot({ isRefresh: true }); // refresh/update existing robot
      } else if (!robot.avatarLoaded && robot.token && robot.encPrivKey && robot.pubKey) {
        fetchRobot({}); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, baseUrl]);

  return {
    theme,
    torStatus,
    settings,
    setSettings,
    book,
    setBook,
    garage,
    setGarage,
    currentSlot,
    setCurrentSlot,
    fetchBook,
    limits,
    info,
    setLimits,
    fetchLimits,
    maker,
    setMaker,
    clearOrder,
    robot,
    setRobot,
    fetchRobot,
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
    open,
    setOpen,
    windowSize,
  };
};

export type UseAppStoreType = ReturnType<typeof useAppStore>;

export const AppContext = createContext<UseAppStoreType | null>(null);
