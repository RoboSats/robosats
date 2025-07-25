import React, { useState, useEffect, useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTranslation, Trans } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button, Link } from '@mui/material';
import { getHost } from '../../utils';
import defaultFederation from '../../../static/federation.json';
import { systemClient } from '../../services/System';

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

  // web hosted frontend without coordinator
  urls.push('robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion');
  return urls;
}

export const safeUrls = federationUrls();

const UnsafeAlert = (): React.JSX.Element => {
  const { hostUrl } = useContext<UseAppStoreType>(AppContext);
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false);

  const [unsafeClient, setUnsafeClient] = useState<boolean>(false);

  useEffect(() => {
    systemClient.getItem('unsafe-alert').then((result) => {
      if (!result) setShow(true);
    });
  }, []);

  const checkClient = (): void => {
    const unsafe = !safeUrls.includes(getHost());
    setUnsafeClient(unsafe);
  };

  useEffect(() => {
    checkClient();
  }, []);

  if (hostUrl.endsWith('.onion') || !show) {
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
                systemClient.setItem('unsafe-alert', 'false');
              }}
            >
              {t('Hide')}
            </Button>
          }
        >
          <AlertTitle>{t('You are not using RoboSats privately')}</AlertTitle>
          <Trans i18nKey='unsafe_alert'>
            <a>To fully enable RoboSats and protect your data and privacy, use </a>
            <Link href='https://www.torproject.org/download/' target='_blank'>
              Tor Browser
            </Link>
            <a> and visit the federation hosted </a>
            <Link
              href='http://robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion'
              target='_blank'
            >
              <b>Onion</b>
            </Link>
            <a> site or </a>
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
