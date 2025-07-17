import React, {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  type ReactNode,
} from 'react';
import { type OpenDialogs } from '../basic/MainDialogs';
import { ThemeProvider } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import { Settings, type Version, type Origin, type Favorites } from '../models';

import { getClientVersion } from '../utils';

import { type Theme } from '@mui/material/styles';
import i18n from '../i18n/Web';
import { NavigateFunction } from 'react-router-dom';
import { getHostUrl, getOrigin } from '../utils/getHost';
import makeTheme, { getWindowSize } from '../utils/theme';
import getSettings from '../utils/settings';

export type TorStatus = 'ON' | 'STARTING' | 'STOPPING' | 'OFF';

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
  thirdParty: '',
};

export type Page = 'garage' | 'order' | 'create' | 'offers' | 'settings' | 'none';

export function isPage(page: string): page is Page {
  return ['garage', 'order', 'create', 'offers', 'settings', 'none'].includes(page.split('/')[0]);
}

const pageFromPath = window.location.pathname.split('/')[1];
const isPagePathEmpty = pageFromPath === '';
const entryPage: Page =
  getSettings().client == 'mobile'
    ? 'garage'
    : ((isPagePathEmpty ? 'garage' : pageFromPath) as Page);

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
  navigateToPage: (newPage: Page | string, navigate: NavigateFunction) => void;
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
  torStatus: 'ON',
  settings: getSettings(),
  setSettings: () => {},
  page: entryPage,
  navigateToPage: () => {},
  navbarHeight: 2.5,
  open: closeAll,
  setOpen: () => {},
  windowSize: { width: 0, height: 0 },
  origin: getOrigin(),
  hostUrl: getHostUrl(),
  clientVersion: getClientVersion(),
  setAcknowledgedWarning: () => {},
  acknowledgedWarning: false,
  fav: { type: null, currency: 0, mode: 'fiat', coordinator: 'robosats' },
  setFav: () => {},
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
  const [open, setOpen] = useState<OpenDialogs>(initialAppContext.open);
  const [windowSize, setWindowSize] = useState<WindowSize>(
    () => getWindowSize(theme.typography.fontSize) ?? { width: 0, height: 0 },
  );
  const [fav, setFav] = useState<Favorites>(initialAppContext.fav);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState<boolean>(
    initialAppContext.acknowledgedWarning,
  );

  const navigateToPage: (newPage: Page, navigate: NavigateFunction) => void = (
    newPage,
    navigate,
  ) => {
    const pathPage: Page | string = newPage.split('/')[0];
    if (isPage(pathPage)) {
      setPage(pathPage);
      navigate(`/${newPage}`);
    }
  };

  useEffect(() => {
    setTheme(makeTheme(settings));
  }, [settings.fontSize, settings.mode, settings.lightQRs]);

  useEffect(() => {
    setSettings(getSettings());
    void i18n.changeLanguage(settings.language);
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
    const getTorstaus = () => {
      new Promise<TorStatus>((resolve, reject) => {
        const uuid: string = uuidv4();
        window.AndroidAppRobosats?.getTorStatus(uuid);
        window.AndroidRobosats?.storePromise(uuid, resolve, reject);
      }).then((result) => {
        setTorStatus(result);
      });
    };

    if (client === 'mobile') {
      getTorstaus();
      const interval = setInterval(getTorstaus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  }, [theme.typography.fontSize]);

  const onResize = function (): void {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  useEffect(() => {
    setOpen(closeAll);
  }, [page, setOpen]);

  return (
    <AppContext.Provider
      value={{
        theme,
        torStatus,
        settings,
        setSettings,
        page,
        navigateToPage,
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
