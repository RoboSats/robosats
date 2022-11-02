import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Grid,
  Link,
  Typography,
  TextField,
  Tooltip,
  useTheme,
  Divider,
} from '@mui/material';
import { AccountBalanceWallet, ContentCopy } from '@mui/icons-material';
import { NewTabIcon } from '../Icons';
import QRCode from 'react-qr-code';
import { Order } from '../../models';
import { systemClient } from '../../services/System';
import currencyDict from '../../../static/assets/currencies.json';
import stepXofY from './stepXofY';
import { pn } from '../../utils';

interface LockInvoiceBoxProps {
  order: Order;
  concept: 'bond' | 'escrow';
}

export const LockInvoiceBox = ({ order, concept }: LockInvoiceBoxProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const currencyCode = currencyDict[order.currency.toString()];

  const invoice = concept === 'bond' ? order.bond_invoice : order.escrow_invoice;
  const amountSats = concept === 'bond' ? order.bond_satoshis : order.escrow_satoshis;
  const helperText =
    concept === 'bond'
      ? t(
          'This is a hold invoice, it will freeze in your wallet. It will be charged only if you cancel or lose a dispute.',
        )
      : t(
          'This is a hold invoice, it will freeze in your wallet. It will be released to the buyer once you confirm to have received the {{currencyCode}}.',
          { currencyCode },
        );

  const Title = function () {
    let text = `Lock {{amountSats}} Sats to ${order.is_maker ? 'PUBLISH' : 'TAKE'} order`;
    if (concept === 'escrow') {
      text = 'Lock {{amountSats}} Sats as collateral';
    }
    return (
      <Typography color='primary' variant='subtitle1'>
        <b>
          {t(text, {
            amountSats: pn(amountSats),
          })}
        </b>
        {` ${stepXofY(order)}`}
      </Typography>
    );
  };
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
        <NewTabIcon sx={{ width: '1.1em', height: '1.1em' }} />
      </Button>
    );
  };

  const depositHoursMinutes = function () {
    const hours = parseInt(order.escrow_duration / 3600);
    const minutes = parseInt((order.escrow_duration - hours * 3600) / 60);
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
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Title />
      </Grid>

      <Divider />

      <Grid item xs={12}>
        {concept === 'bond' ? <CompatibleWalletsButton /> : <ExpirationWarning />}
      </Grid>

      <Grid item xs={12}>
        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
          <QRCode
            bgColor={'rgba(255, 255, 255, 0)'}
            fgColor={theme.palette.text.primary}
            value={invoice}
            size={theme.typography.fontSize * 21.8}
            onClick={() => {
              systemClient.copyToClipboard(invoice);
            }}
          />
        </Tooltip>

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

export default LockInvoiceBox;
