import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Link } from '@mui/material';

import { AccountBalanceWallet } from '@mui/icons-material';
import { NewTabIcon } from '../Icons';

const WalletsButton = (): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <Button
      color='primary'
      component={Link}
      href={'https://learn.robosats.org/docs/wallets/'}
      target='_blank'
      align='center'
    >
      <AccountBalanceWallet />
      {t('See Compatible Wallets')}
      <NewTabIcon sx={{ width: '0.7em', height: '0.7em' }} />
    </Button>
  );
};

export default WalletsButton;
