import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Main from './basic/Main';
import { CssBaseline } from '@mui/material';
import HostAlert from './components/HostAlert';
import TorConnectionBadge from './components/TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';

import { systemClient } from './services/System';
import ErrorBoundary from './components/ErrorBoundary';
import { AppContextProvider } from './contexts/AppContext';
import { GarageContextProvider } from './contexts/GarageContext';
import { FederationContextProvider } from './contexts/FederationContext';

const App = (): JSX.Element => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback='loading'>
          <I18nextProvider i18n={i18n}>
            <AppContextProvider>
              <GarageContextProvider>
                <FederationContextProvider>
                  <CssBaseline />
                  {window.NativeRobosats === undefined ? <HostAlert /> : <TorConnectionBadge />}
                  <Main />
                </FederationContextProvider>
              </GarageContextProvider>
            </AppContextProvider>
          </I18nextProvider>
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
};

const loadApp = (): void => {
  // waits until the environment is ready for the Android WebView app
  if (systemClient.loading) {
    setTimeout(loadApp, 200);
  } else {
    const root = ReactDOM.createRoot(document.getElementById('app') ?? new HTMLElement());
    root.render(<App />);
  }
};

loadApp();
