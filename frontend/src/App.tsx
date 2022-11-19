import React, { Suspense, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Main from './basic/Main';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import UnsafeAlert from './components/UnsafeAlert';
import TorConnection from './components/TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';

import { systemClient } from './services/System';
import { Settings } from './models';

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

const App = (): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(makeTheme(new Settings()));
  const [settings, setSettings] = useState<Settings>(new Settings());

  useEffect(() => {
    setTheme(makeTheme(settings));
  }, [settings.fontSize, settings.mode]);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, []);

  return (
    <Suspense fallback='loading language'>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {window.NativeRobosats === undefined ? (
            <UnsafeAlert settings={settings} setSettings={setSettings} />
          ) : (
            <TorConnection />
          )}
          <Main settings={settings} setSettings={setSettings} />
        </ThemeProvider>
      </I18nextProvider>
    </Suspense>
  );
};

const loadApp = () => {
  if (systemClient.loading) {
    setTimeout(loadApp, 200);
  } else {
    const root = ReactDOM.createRoot(document.getElementById('app') ?? new HTMLElement());
    root.render(<App />);
  }
};

loadApp();
