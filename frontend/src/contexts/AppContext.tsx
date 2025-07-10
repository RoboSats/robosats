import React, {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  type ReactNode,
} from 'react';
import { type Page } from '../basic/NavBar';
import { type OpenDialogs } from '../basic/MainDialogs';
import { ThemeProvider } from '@mui/material';

import { Settings, type Version, type Origin, type Favorites } from '../models';

import { getClientVersion, getHost } from '../utils';

import defaultFederation from '../../static/federation.json';
import { createTheme, type Theme } from '@mui/material/styles';
import i18n from '../i18n/Web';
import SettingsSelfhosted from '../models/Settings.default.basic.selfhosted';
import SettingsSelfhostedPro from '../models/Settings.default.pro.selfhosted';
import SettingsPro from '../models/Settings.default.pro';

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

export type TorStatus = 'ON' | 'STARTING' | 'STOPPING' | 'OFF';

export const isNativeRoboSats = !(window.NativeRobosats === undefined);

const pageFromPath = window.location.pathname.split('/')[1];
const isPagePathEmpty = pageFromPath === '';
const entryPage: Page = !isNativeRoboSats
  ? ((isPagePathEmpty ? 'garage' : pageFromPath) as Page)
  : 'garage';

export const closeAll: OpenDialogs = {
  more: false,
  learn: false,
  community: false,
  info: false,
  coordinator: '',
  warning: false,
  exchange: false,
  client: false,
  update: false,
  profile: false,
  recovery: false,
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
  const [client] = window.RobosatsSettings.split('-');
  const randomAlias =
    Object.keys(defaultFederation)[
      Math.floor(Math.random() * Object.keys(defaultFederation).length)
    ];
  let host: string = defaultFederation[randomAlias][network].onion;
  let protocol: string = 'http:';
  if (client !== 'mobile') {
    host = getHost();
    protocol = location.protocol;
  }
  const hostUrl = `${protocol}//${host}`;
  return hostUrl;
};

const getOrigin = (network = 'mainnet'): Origin => {
  const host = getHostUrl(network);
  let origin: Origin = 'onion';
  const [client] = window.RobosatsSettings.split('-');
  if (
    client === 'mobile' ||
    client === 'desktop' ||
    host.includes('.onion') ||
    host.includes(':8888')
  ) {
    origin = 'onion';
  } else if (host.includes('i2p')) {
    origin = 'i2p';
  } else {
    origin = 'clearnet';
  }

  return origin;
};

const getSettings = (): Settings => {
  let settings;

  const [client, view] = window.RobosatsSettings.split('-');
  if (client === 'selfhosted') {
    settings = view === 'pro' ? new SettingsSelfhostedPro() : new SettingsSelfhosted();
  } else {
    settings = view === 'pro' ? new SettingsPro() : new Settings();
  }
  return settings;
};

export interface WindowSize {
  width: number;
  height: number;
}

export interface AppContextProviderProps {
  children: ReactNode;
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
  windowSize: WindowSize;
  acknowledgedWarning: boolean;
  setAcknowledgedWarning: Dispatch<SetStateAction<boolean>>;
  clientVersion: {
    semver: Version;
    short: string;
    long: string;
  };
  origin: Origin;
  hostUrl: string;
  fav: Favorites;
  setFav: Dispatch<SetStateAction<Favorites>>;
  client: 'mobile' | 'web' | 'desktop' | string;
  view: 'basic' | 'pro' | string;
}

export const initialAppContext: UseAppStoreType = {
  theme: undefined,
  torStatus: 'STARTING',
  settings: getSettings(),
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
  setAcknowledgedWarning: () => {},
  acknowledgedWarning: false,
  fav: { type: null, currency: 0, mode: 'fiat', coordinator: 'robosats' },
  setFav: () => {},
  worldmap: undefined,
  client: 'web',
  view: 'basic',
};

export const AppContext = createContext<UseAppStoreType>(initialAppContext);

export const AppContextProvider = ({ children }: AppContextProviderProps): React.JSX.Element => {
  // State provided right at the top level of the app. A chaotic bucket of everything.
  // Contains app-wide state and functions. Triggers re-renders on the full tree often.

  // All app data structured
  const navbarHeight = initialAppContext.navbarHeight;
  const clientVersion = initialAppContext.clientVersion;
  const hostUrl = initialAppContext.hostUrl;
  const origin = initialAppContext.origin;
  const [client, view] = window.RobosatsSettings.split('-');

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
  const [windowSize, setWindowSize] = useState<WindowSize>(
    () => getWindowSize(theme.typography.fontSize) ?? { width: 0, height: 0 },
  );
  const [fav, setFav] = useState<Favorites>(initialAppContext.fav);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState<boolean>(
    initialAppContext.acknowledgedWarning,
  );

  useEffect(() => {
    setTheme(makeTheme(settings));
  }, [settings.fontSize, settings.mode, settings.lightQRs]);

  useEffect(() => {
    setSettings(getSettings());
    void i18n.changeLanguage(settings.language);
    window.addEventListener('torStatus', (event) => {
      // Trick to improve UX on Android webview: delay the "Connected to TOR" status by 5 secs to avoid long waits on the first request.
      setTimeout(
        () => {
          setTorStatus(event?.detail);
        },
        event?.detail === 'ON' ? 5000 : 0,
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

  return (
    <AppContext.Provider
      value={{
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
        acknowledgedWarning,
        setAcknowledgedWarning,
        hostUrl,
        origin,
        fav,
        setFav,
        client,
        view,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppContext.Provider>
  );
};
