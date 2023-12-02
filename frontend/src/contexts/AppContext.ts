import { createContext, type Dispatch, useEffect, useState, type SetStateAction } from 'react';
import { type Page } from '../basic/NavBar';
import { type OpenDialogs } from '../basic/MainDialogs';

import { Settings, type Version, type Origin, type Favorites } from '../models';

import { getClientVersion, getHost } from '../utils';

import defaultFederation from '../../static/federation.json';
import { createTheme, type Theme } from '@mui/material/styles';
import i18n from '../i18n/Web';

const getWindowSize = function (fontSize: number): { width: number; height: number } {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

export interface SlideDirection {
  in: 'left' | 'right' | undefined;
  out: 'left' | 'right' | undefined;
}

export type TorStatus = 'NOTINIT' | 'STARTING' | '"Done"' | 'DONE';

export const isNativeRoboSats = !(window.NativeRobosats === undefined);

const pageFromPath = window.location.pathname.split('/')[1];
const isPagePathEmpty = pageFromPath === '';
const entryPage: Page = !isNativeRoboSats
  ? ((isPagePathEmpty ? 'robot' : pageFromPath) as Page)
  : 'robot';

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

const makeTheme = function (settings: Settings): Theme {
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

const getHostUrl = (network = 'mainnet'): string => {
  let host = '';
  let protocol = '';
  if (window.NativeRobosats === undefined) {
    host = getHost();
    protocol = location.protocol;
  } else {
    host = defaultFederation.exp[network].Onion;
    protocol = 'http:';
  }
  const hostUrl = `${protocol}//${host}`;

  return hostUrl;
};

const getOrigin = (network = 'mainnet'): Origin => {
  const host = getHostUrl(network);
  let origin: Origin = 'onion';

  if (window.NativeRobosats !== undefined || host.includes('.onion')) {
    origin = 'onion';
  } else if (host.includes('i2p')) {
    origin = 'i2p';
  } else {
    origin = 'clearnet';
  }

  return origin;
};

export interface WindowSize {
  width: number;
  height: number;
}

export interface UseAppStoreType {
  theme?: Theme;
  torStatus: TorStatus;
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  page: Page;
  setPage: Dispatch<SetStateAction<Page>>;
  slideDirection: SlideDirection;
  setSlideDirection: Dispatch<SetStateAction<SlideDirection>>;
  navbarHeight: number;
  open: OpenDialogs;
  setOpen: Dispatch<SetStateAction<OpenDialogs>>;
  windowSize?: WindowSize;
  clientVersion: {
    semver: Version;
    short: string;
    long: string;
  };
  origin: Origin;
  hostUrl: string;
  fav: Favorites;
  setFav: Dispatch<SetStateAction<Favorites>>;
}

export const initialAppContext: UseAppStoreType = {
  theme: undefined,
  torStatus: 'NOTINIT',
  settings: new Settings(),
  setSettings: () => {},
  page: entryPage,
  setPage: () => {},
  slideDirection: {
    in: undefined,
    out: undefined,
  },
  setSlideDirection: () => {},
  navbarHeight: 2.5,
  open: closeAll,
  setOpen: () => {},
  windowSize: undefined,
  origin: getOrigin(),
  hostUrl: getHostUrl(),
  clientVersion: getClientVersion(),
  fav: { type: null, currency: 0, mode: 'fiat' },
  setFav: () => {},
};

export const AppContext = createContext<UseAppStoreType>(initialAppContext);

export const useAppStore = (): UseAppStoreType => {
  // State provided right at the top level of the app. A chaotic bucket of everything.
  // Contains app-wide state and functions. Triggers re-renders on the full tree often.

  // All app data structured
  const navbarHeight = initialAppContext.navbarHeight;
  const clientVersion = initialAppContext.clientVersion;
  const hostUrl = initialAppContext.hostUrl;
  const origin = initialAppContext.origin;

  const [settings, setSettings] = useState<Settings>(initialAppContext.settings);
  const [theme, setTheme] = useState<Theme>(() => {
    return makeTheme(settings);
  });
  const [torStatus, setTorStatus] = useState<TorStatus>(initialAppContext.torStatus);
  const [page, setPage] = useState<Page>(initialAppContext.page);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(
    initialAppContext.slideDirection,
  );
  const [open, setOpen] = useState<OpenDialogs>(initialAppContext.open);
  const [windowSize, setWindowSize] = useState<WindowSize>(() =>
    getWindowSize(theme.typography.fontSize),
  );
  const [fav, setFav] = useState<Favorites>(initialAppContext.fav);

  useEffect(() => {
    setTheme(makeTheme(settings));
  }, [settings.fontSize, settings.mode, settings.lightQRs]);

  useEffect(() => {
    void i18n.changeLanguage(settings.language);
  }, []);

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
    if (window !== undefined) {
      window.addEventListener('resize', onResize);
    }

    return () => {
      if (window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

  const onResize = function (): void {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  return {
    theme,
    torStatus,
    settings,
    setSettings,
    page,
    setPage,
    slideDirection,
    setSlideDirection,
    navbarHeight,
    open,
    setOpen,
    windowSize,
    clientVersion,
    hostUrl,
    origin,
    fav,
    setFav,
  };
};
