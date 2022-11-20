import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Box, Grid, Typography, TextField, Tooltip, useTheme } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { Order } from '../../../models';
import { systemClient } from '../../../services/System';
import currencies from '../../../../static/assets/currencies.json';
import WalletsButton from '../WalletsButton';

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
      {order.is_taker && concept == 'bond' ? (
        <Grid item xs={12}>
          <Typography color='primary'>
            {t(`You are ${order.is_buyer ? 'BUYING' : 'SELLING'} BTC`)}
          </Typography>
        </Grid>
      ) : (
        <></>
      )}

      <Grid item xs={12}>
        {concept === 'bond' ? <WalletsButton /> : <ExpirationWarning />}
      </Grid>

      <Grid item xs={12}>
        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
          <Box
            sx={{
              display: 'flex',
              backgroundColor: theme.palette.background.paper,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5em',
              borderRadius: '0.3em',
            }}
          >
            <QRCode
              bgColor={'rgba(255, 255, 255, 0)'}
              fgColor={theme.palette.text.primary}
              value={invoice ?? 'Undefined: BOLT11 invoice not received'}
              size={theme.typography.fontSize * 21.8}
              onClick={() => {
                systemClient.copyToClipboard(invoice);
              }}
            />
          </Box>
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
          defaultValue={invoice ?? 'Undefined: BOLT11 invoice not received'}
          disabled={true}
          helperText={helperText}
          color='secondary'
        />
      </Grid>
    </Grid>
  );
};

export default LockInvoicePrompt;
