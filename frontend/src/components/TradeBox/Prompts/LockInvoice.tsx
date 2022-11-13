import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, Link, Typography, TextField, Tooltip, useTheme } from '@mui/material';
import { AccountBalanceWallet, ContentCopy } from '@mui/icons-material';
import { NewTabIcon } from '../../Icons';
import QRCode from 'react-qr-code';
import { Order } from '../../../models';
import { systemClient } from '../../../services/System';
import currencies from '../../../../static/assets/currencies.json';

interface LockInvoicePromptProps {
  order: Order;
  concept: 'bond' | 'escrow';
}

export const LockInvoicePrompt = ({ order, concept }: LockInvoicePromptProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const currencyCode: string = currencies[`${order.currency}`];

  const invoice = concept === 'bond' ? order.bond_invoice : order.escrow_invoice;
  const helperText =
    concept === 'bond'
      ? t(
          'This is a hold invoice, it will freeze in your wallet. It will be charged only if you cancel or lose a dispute.',
        )
      : t(
          'This is a hold invoice, it will freeze in your wallet. It will be released to the buyer once you confirm to have received the {{currencyCode}}.',
          { currencyCode },
        );

  const CompatibleWalletsButton = function () {
    return (
      <Button
        color='primary'
        component={Link}
        href={'https://learn.robosats.com/docs/wallets/'}
        target='_blank'
        align='center'
      >
        <AccountBalanceWallet />
        {t('See Compatible Wallets')}
        <NewTabIcon sx={{ width: '0.7em', height: '0.7em' }} />
      </Button>
    );
  };

  const depositHoursMinutes = function () {
    const hours = Math.floor(order.escrow_duration / 3600);
    const minutes = Math.floor((order.escrow_duration - hours * 3600) / 60);
    const dict = { deposit_timer_hours: hours, deposit_timer_minutes: minutes };
    return dict;
  };

  const ExpirationWarning = function () {
    return (
      <Typography variant='body2'>
        {t(
          'You risk losing your bond if you do not lock the collateral. Total time available is {{deposit_timer_hours}}h {{deposit_timer_minutes}}m.',
          depositHoursMinutes(),
        )}
      </Typography>
    );
  };

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
    >
      <Grid item xs={12}>
        {concept === 'bond' ? <CompatibleWalletsButton /> : <ExpirationWarning />}
      </Grid>

      <Grid item xs={12}>
        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
          <div>
            <QRCode
              bgColor={'rgba(255, 255, 255, 0)'}
              fgColor={theme.palette.text.primary}
              value={invoice}
              size={theme.typography.fontSize * 21.8}
              onClick={() => {
                systemClient.copyToClipboard(invoice);
              }}
            />
          </div>
        </Tooltip>
      </Grid>
      <Grid item xs={12}>
        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
          <Button
            size='small'
            color='inherit'
            onClick={() => {
              systemClient.copyToClipboard(invoice);
            }}
          >
            <ContentCopy />
            {t('Copy to clipboard')}
          </Button>
        </Tooltip>
      </Grid>

      <Grid item xs={12}>
        <TextField
          hiddenLabel
          variant='standard'
          size='small'
          defaultValue={invoice}
          disabled={true}
          helperText={helperText}
          color='secondary'
        />
      </Grid>
    </Grid>
  );
};

export default LockInvoicePrompt;
