import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Box, Grid, Typography, TextField, Tooltip, useTheme } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { type Order } from '../../../models';
import { systemClient } from '../../../services/System';
import currencies from '../../../../static/assets/currencies.json';
import WalletsButton from '../WalletsButton';
import { AppContext, type UseAppStoreType } from '../../../contexts/AppContext';

interface LockInvoicePromptProps {
  order: Order;
  concept: 'bond' | 'escrow';
}

export const LockInvoicePrompt = ({ order, concept }: LockInvoicePromptProps): JSX.Element => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
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

  const depositHoursMinutes = function (): {
    deposit_timer_hours: number;
    deposit_timer_minutes: number;
  } {
    const hours = Math.floor(order.escrow_duration / 3600);
    const minutes = Math.floor((order.escrow_duration - hours * 3600) / 60);
    const dict = { deposit_timer_hours: hours, deposit_timer_minutes: minutes };
    return dict;
  };

  const ExpirationWarning = function (): JSX.Element {
    return (
      <Typography variant='body2'>
        {t(
          'You risk losing your bond if you do not lock the collateral. Total time available is {{deposit_timer_hours}}h {{deposit_timer_minutes}}m.',
          depositHoursMinutes(),
        )}
      </Typography>
    );
  };

  const handleClickQR = (): void => {
    window.open(`lightning:${invoice}`);
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
        {concept === 'bond' ? <WalletsButton /> : <ExpirationWarning />}
      </Grid>

      {concept === 'bond' ? (
        <Typography color='secondary' variant='h6' align='center'>
          <b>
            {order.currency === 1000
              ? t(`${order.is_buyer ? 'SWAPPING INTO' : 'SWAPPING OUT of'} Lightning`)
              : t(`You are ${order.is_buyer ? 'BUYING' : 'SELLING'} BTC`)}
          </b>
        </Typography>
      ) : (
        <></>
      )}

      <Grid item xs={12}>
        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
          <Box
            sx={{
              display: 'flex',
              backgroundColor: settings.lightQRs ? '#fff' : theme.palette.background.paper,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5em',
              borderRadius: '0.3em',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
              },
            }}
          >
            <QRCode
              bgColor={'rgba(255, 255, 255, 0)'}
              fgColor={settings.lightQRs ? '#000000' : theme.palette.text.primary}
              value={invoice?.toUpperCase() ?? 'Undefined: BOLT11 invoice not received'}
              size={theme.typography.fontSize * 21.8}
              onClick={handleClickQR}
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
          value={invoice ?? 'Undefined: BOLT11 invoice not received'}
          disabled={true}
          helperText={helperText}
          color='secondary'
        />
      </Grid>
    </Grid>
  );
};

export default LockInvoicePrompt;
