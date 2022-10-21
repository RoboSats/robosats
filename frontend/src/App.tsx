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
import { Settings, defaultSettings } from './models';

const defaultTheme: Theme = createTheme({
  palette: {
    mode: defaultSettings.mode,
    background: {
      default: defaultSettings.mode === 'dark' ? '#070707' : '#fff',
    },
  },
  typography: { fontSize: defaultSettings.fontSize },
});

const App = (): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateTheme = function () {
    setTheme(
      createTheme({
        palette: {
          mode: settings.mode,
          background: {
            default: settings.mode === 'dark' ? '#070707' : '#fff',
          },
        },
        typography: { fontSize: settings.fontSize },
      }),
    );
  };

  useEffect(() => {
    updateTheme();
  }, [settings]);

  return (
    <Suspense fallback='loading language'>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <TorConnection />
          <UnsafeAlert className='unsafeAlert' />
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
