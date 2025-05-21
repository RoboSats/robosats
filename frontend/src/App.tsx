import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Main from './basic/Main';
import { CssBaseline } from '@mui/material';
import HostAlert from './components/HostAlert';
import TorConnectionBadge from './components/TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/Web';
import * as CryptoJS from 'crypto-js';

import { systemClient } from './services/System';
import ErrorBoundary from './components/ErrorBoundary';
import { AppContextProvider } from './contexts/AppContext';
import { GarageContextProvider } from './contexts/GarageContext';
import { FederationContextProvider } from './contexts/FederationContext';
import NotificationSwitchBadge from './components/NotificationSwitch';

interface SubtleCrypto {
  digest(algorithm: string, data: ArrayBuffer | Uint8Array | string): Promise<Uint8Array>;
}

interface Crypto {
  getRandomValues(arr: Uint8Array): Uint8Array;
  subtle: SubtleCrypto;
}

const App = (): React.JSX.Element => {
  // Necesary for OpenPGP JS
  const getWebCrypto = (): { subtle: SubtleCrypto } => {
    return {
      subtle: {
        digest: (
          algorithm: string,
          data: ArrayBuffer | Uint8Array | string,
        ): Promise<Uint8Array> => {
          return new Promise((resolve, reject) => {
            if (algorithm === 'SHA-256') {
              let message: string;
              if (data instanceof Uint8Array) {
                message = new TextDecoder().decode(data);
              } else if (data instanceof ArrayBuffer) {
                message = new TextDecoder().decode(new Uint8Array(data));
              } else {
                message = data;
              }

              const hash = CryptoJS.SHA256(message).toString();
              const match = hash.match(/.{1,2}/g);
              if (!match) {
                return reject(new Error('Hash computation failed'));
              }
              const hashArray = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
              resolve(hashArray);
            } else {
              reject(new Error('Algorithm not supported'));
            }
          });
        },
      },
    };
  };

  if (typeof window !== 'undefined' && !window.crypto.subtle) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).crypto = {
      getRandomValues: (arr: Uint8Array): Uint8Array => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: getWebCrypto().subtle,
    } as Crypto;
  }

  const [client] = window.RobosatsSettings.split('-');
  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback='loading'>
          <I18nextProvider i18n={i18n}>
            <AppContextProvider>
              <FederationContextProvider>
                <GarageContextProvider>
                  <CssBaseline />
                  {client === 'mobile' ? (
                    <div style={{ display: 'inline-flex', position: 'fixed', top: '0.5em' }}>
                      <TorConnectionBadge />
                      <NotificationSwitchBadge />
                    </div>
                  ) : (
                    <HostAlert />
                  )}
                  <Main />
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
  // waits until the environment is ready for the Android WebView app
  if (systemClient.loading) {
    setTimeout(loadApp, 200);
  } else {
    const root = ReactDOM.createRoot(document.getElementById('app') ?? new HTMLElement());
    root.render(<App />);
  }
};

loadApp();
