import React, { StrictMode, Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Main from './basic/Main';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppContext, useAppStore } from './contexts/AppContext';
import HostAlert from './components/HostAlert';
import TorConnectionBadge from './components/TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';

import { systemClient } from './services/System';
import ErrorBoundary from './components/ErrorBoundary';
import { GarageContext, useGarageStore } from './contexts/GarageContext';
import { FederationContext, useFederationStore } from './contexts/FederationContext';

const App = (): JSX.Element => {
  const appStore = useAppStore();
  const garageStore = useGarageStore();
  const federationStore = useFederationStore();

  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback='loading'>
          <I18nextProvider i18n={i18n}>
            <AppContext.Provider value={appStore}>
              <GarageContext.Provider value={garageStore}>
                <FederationContext.Provider value={federationStore}>
                  <ThemeProvider theme={appStore.theme}>
                    <CssBaseline />
                    {window.NativeRobosats === undefined ? <HostAlert /> : <TorConnectionBadge />}
                    <Main />
                  </ThemeProvider>
                </FederationContext.Provider>
              </GarageContext.Provider>
            </AppContext.Provider>
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
