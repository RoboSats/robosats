import React, { Component } from 'react';
import { withTranslation, Trans } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button, Link } from '@mui/material';
import MediaQuery from 'react-responsive';
import { getHost } from '../utils';

class UnsafeAlert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
      isSelfhosted: this.isSelfhosted(),
    };
  }

  isSelfhosted() {
    const http = new XMLHttpRequest();
    try {
      http.open('HEAD', `${location.protocol}//${getHost()}/selfhosted`, false);
      http.send();
      return http.status === 200;
    } catch {
      return false;
    }
  }

  safe_urls = [
    'robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion',
    'robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion',
    'robodevs7ixniseezbv7uryxhamtz3hvcelzfwpx3rvoipttjomrmpqd.onion',
    'robosats.i2p',
    'r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p',
  ];

  render() {
    const { t } = this.props;

    // If alert is hidden return null
    if (!this.state.show) {
      return null;
    }

    // Show selfhosted notice
    if (this.state.isSelfhosted) {
      return (
        <div>
          <Paper elevation={6} className='alertUnsafe'>
            <Alert
              severity='success'
              sx={{ maxHeight: '120px' }}
              action={
                <Button color='success' onClick={() => this.setState({ show: false })}>
                  {t('Hide')}
                </Button>
              }
            >
              <AlertTitle>{t('You are self-hosting RoboSats')}</AlertTitle>
              {t(
                'RoboSats client is served from your own node granting you the strongest security and privacy.',
              )}
            </Alert>
          </Paper>
        </div>
      );
    }

    // Show unsafe alert
    if (!window.NativeRobosats && !this.safe_urls.includes(getHost())) {
      return (
        <div>
          <MediaQuery minWidth={800}>
            <Paper elevation={6} className='alertUnsafe'>
              <Alert
                severity='warning'
                sx={{ maxHeight: '100px' }}
                action={<Button onClick={() => this.setState({ show: false })}>{t('Hide')}</Button>}
              >
                <AlertTitle>{t('You are not using RoboSats privately')}</AlertTitle>
                <Trans i18nKey='desktop_unsafe_alert'>
                  <a>
                    Some features are disabled for your protection (e.g. chat) and you will not be
                    able to complete a trade without them. To protect your privacy and fully enable
                    RoboSats, use{' '}
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
            </Paper>
          </MediaQuery>

          <MediaQuery maxWidth={799}>
            <Paper elevation={6} className='alertUnsafe'>
              <Alert severity='warning' sx={{ maxHeight: '120px' }}>
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
                <div style={{ width: '100%' }}></div>
                <div align='center'>
                  <Button
                    className='hideAlertButton'
                    onClick={() => this.setState({ show: false })}
                  >
                    {t('Hide')}
                  </Button>
                </div>
              </Alert>
            </Paper>
          </MediaQuery>
        </div>
      );
    }
  }
}

export default withTranslation()(UnsafeAlert);
