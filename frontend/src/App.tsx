import React, { StrictMode, Suspense, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import BasicMain from './basic/Main';
import ProMain from './pro/Main';
import { CssBaseline, Snackbar, Alert } from '@mui/material';
import HostAlert from './components/HostAlert';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';

import { systemClient } from './services/System';
import ErrorBoundary from './components/ErrorBoundary';
import { AppContextProvider } from './contexts/AppContext';
import { GarageContextProvider } from './contexts/GarageContext';
import { FederationContextProvider } from './contexts/FederationContext';

const App = (): React.JSX.Element => {
  const [client, view] = window.RobosatsSettings.split('-');
  const isPro = view === 'pro';

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent;
      setErrorMessage(customEvent.detail);
      setErrorOpen(true);
    };

    window.addEventListener('ROBOSATS_API_ERROR', handleApiError);

    return () => {
      window.removeEventListener('ROBOSATS_API_ERROR', handleApiError);
    };
  }, []);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorOpen(false);
  };

  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback='loading'>
          <I18nextProvider i18n={i18n}>
            <AppContextProvider>
              <FederationContextProvider>
                <GarageContextProvider>
                  <CssBaseline />
                  {client !== 'mobile' && <HostAlert />}
                  {isPro ? <ProMain /> : <BasicMain />}

                  <Snackbar
                    open={errorOpen}
                    autoHideDuration={6000}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  >
                    <Alert
                      onClose={handleClose}
                      severity='error'
                      sx={{ width: '100%' }}
                      variant='filled'
                    >
                      {errorMessage}
                    </Alert>
                  </Snackbar>
                </GarageContextProvider>
              </FederationContextProvider>
            </AppContextProvider>
          </I18nextProvider>
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
};

const loadApp = (): void => {
  if (systemClient.loading) {
    setTimeout(loadApp, 200);
  } else {
    const root = ReactDOM.createRoot(document.getElementById('app') ?? new HTMLElement());
    root.render(<App />);
  }
};

loadApp();
