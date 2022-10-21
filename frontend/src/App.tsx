import React, { Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Main from './basic/Main';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from './components/UnsafeAlert';
import TorConnection from './components/TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';

import { systemClient } from './services/System';

const defaultTheme = createTheme({
  palette: {
    mode:
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    background: {
      default:
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? '#070707'
          : '#fff',
    },
  },
});

const App = (): JSX.Element => {
  const [theme, setTheme] = useState(defaultTheme);

  const handleModeChange = function () {
    if (theme.palette.mode === 'light') {
      setTheme(
        createTheme({
          palette: {
            mode: 'dark',
            background: {
              default: '#070707',
            },
          },
        }),
      );
    } else if (theme.palette.mode === 'dark') {
      setTheme(
        createTheme({
          palette: {
            mode: 'light',
            background: {
              default: '#fff',
            },
          },
        }),
      );
    }
  };

  return (
    <Suspense fallback='loading language'>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <TorConnection />
          <UnsafeAlert className='unsafeAlert' />
          <Main handleModeChange={handleModeChange} />
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
