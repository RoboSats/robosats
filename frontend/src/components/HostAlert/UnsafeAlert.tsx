import React, { useState, useEffect, useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTranslation, Trans } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button, Link } from '@mui/material';
import { getHost } from '../../utils';
import defaultFederation from '../../../static/federation.json';

function federationUrls(): string[] {
  const urls: string[] = [];

  const removeProtocol = (url: string): string => {
    return url.replace(/^https?:\/\/|\/\/$/, '');
  };

  for (const key in defaultFederation) {
    const mainnet = defaultFederation[key].mainnet;
    const testnet = defaultFederation[key].testnet;

    // Add the URLs from the 'mainnet' and 'testnet' objects to the urls array
    // if these are onion or i2p addresses
    for (const safeOrigin of ['onion', 'i2p']) {
      if (mainnet?.[safeOrigin]) urls.push(removeProtocol(mainnet[safeOrigin]));
      if (testnet?.[safeOrigin]) urls.push(removeProtocol(testnet[safeOrigin]));
    }
  }

  return urls;
}

export const safeUrls = federationUrls();

const UnsafeAlert = (): JSX.Element => {
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(true);

  const [unsafeClient, setUnsafeClient] = useState<boolean>(false);

  const checkClient = (): void => {
    const unsafe = !safeUrls.includes(getHost());
    setUnsafeClient(unsafe);
  };

  useEffect(() => {
    checkClient();
  }, []);

  // If alert is hidden return null
  if (!show) {
    return <></>;
  }

  // Show unsafe alert
  else if (unsafeClient) {
    return (
      <Paper elevation={6} className='unsafeAlert'>
        <Alert
          severity='warning'
          sx={{ maxHeight: windowSize?.width > 57 ? '7em' : '8em' }}
          action={
            <Button
              onClick={() => {
                setShow(false);
              }}
            >
              {t('Hide')}
            </Button>
          }
        >
          <AlertTitle>{t('You are not using RoboSats privately')}</AlertTitle>
          <Trans i18nKey='unsafe_alert'>
            <a>To protect your data and privacy use </a>
            <Link href='https://www.torproject.org/download/' target='_blank'>
              Tor Browser
            </Link>
            <a> and visit a federation hosted </a>
            <Link
              href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion'
              target='_blank'
            >
              Onion
            </Link>
            <a> site. Or </a>
            <Link href='https://apps.umbrel.com/app/robosats' target='_blank'>
              host your own app.
            </Link>
          </Trans>
        </Alert>
      </Paper>
    );
  } else {
    return <></>;
  }
};

export default UnsafeAlert;
