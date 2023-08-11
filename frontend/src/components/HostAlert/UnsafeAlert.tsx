import React, { useState, useEffect, useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTranslation, Trans } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button, Link } from '@mui/material';
import { getHost } from '../../utils';

const UnsafeAlert = (): JSX.Element => {
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(true);

  const [unsafeClient, setUnsafeClient] = useState<boolean>(false);

  // To do. Read from Coordinators Obj.
  const safeUrls = [
    'robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion',
    'robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion',
    'robodevs7ixniseezbv7uryxhamtz3hvcelzfwpx3rvoipttjomrmpqd.onion',
    'robosats.i2p',
    'r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p',
  ];

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
        {windowSize.width > 57 ? (
          <Alert
            severity='warning'
            sx={{ maxHeight: '7em' }}
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
            <Trans i18nKey='desktop_unsafe_alert'>
              <a>
                Some features are disabled for your protection (e.g. chat) and you will not be able
                to complete a trade without them. To protect your privacy and fully enable RoboSats,
                use{' '}
              </a>
              <Link href='https://www.torproject.org/download/' target='_blank'>
                Tor Browser
              </Link>
              <a> and visit the </a>
              <Link
                href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion'
                target='_blank'
              >
                Onion
              </Link>
              <a> site.</a>
            </Trans>
          </Alert>
        ) : (
          <Alert severity='warning' sx={{ maxHeight: '8em' }}>
            <AlertTitle>{t('You are not using RoboSats privately')}</AlertTitle>
            <Trans i18nKey='phone_unsafe_alert'>
              <a>You will not be able to complete a trade. Use </a>
              <Link href='https://www.torproject.org/download/' target='_blank'>
                Tor Browser
              </Link>
              <a> and visit the </a>
              <Link
                href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion'
                target='_blank'
              >
                Onion
              </Link>{' '}
              <a> site.</a>
            </Trans>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                className='hideAlertButton'
                onClick={() => {
                  setShow(false);
                }}
              >
                {t('Hide')}
              </Button>
            </div>
          </Alert>
        )}
      </Paper>
    );
  } else {
    return <></>;
  }
};

export default UnsafeAlert;
