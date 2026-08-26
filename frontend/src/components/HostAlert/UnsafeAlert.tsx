import React, { useState, useEffect, useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { useTranslation, Trans } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button, Link } from '@mui/material';
import { getHost } from '../../utils';
import { systemClient } from '../../services/System';

const removeProtocol = (url: string): string => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const UnsafeAlert = (): React.JSX.Element => {
  const { hostUrl } = useContext<UseAppStoreType>(AppContext);
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false);
  const [unsafeClient, setUnsafeClient] = useState<boolean>(false);

  useEffect(() => {
    systemClient.getItem('unsafe-alert').then((result) => {
      if (!result) setShow(true);
    });
  }, []);

  useEffect(() => {
    // Build safe URL list from the live coordinator list in the Federation model.
    const safeUrls: string[] = federation.getCoordinators().flatMap((c) => {
      const urls: string[] = [];
      for (const net of [c.mainnet, c.testnet] as unknown as Array<Record<string, string>>) {
        if (net?.onion) urls.push(removeProtocol(net.onion));
        if (net?.i2p) urls.push(removeProtocol(net.i2p));
      }
      return urls;
    });
    // web hosted frontend without coordinator
    safeUrls.push('robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion');
    setUnsafeClient(!safeUrls.includes(getHost()));
  }, [federation.getCoordinators().length]);

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
