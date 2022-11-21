import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, TextField } from '@mui/material';
import { Order } from '../../../models';
import WalletsButton from '../WalletsButton';
import { LoadingButton } from '@mui/lab';
import { pn } from '../../../utils';

export interface LightningForm {
  invoice: string;
  routingBudget: number;
  badInvoice: string;
  useLnproxy: boolean;
  lnproxyServer: string;
  lnproxyBudget: number;
  badLnproxy: string;
}

export const defaultLightning: LightningForm = {
  invoice: '',
  routingBudget: 0,
  badInvoice: '',
  useLnproxy: false,
  lnproxyServer: '',
  lnproxyBudget: 0,
  badLnproxy: '',
};

interface LightningPayoutFormProps {
  order: Order;
  loading: boolean;
  lightning: LightningForm;
  setLightning: (state: LightningForm) => void;
  onClickSubmit: (invoice: string) => void;
}

export const LightningPayoutForm = ({
  order,
  loading,
  onClickSubmit,
  lightning,
  setLightning,
}: LightningPayoutFormProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Grid container direction='column' justifyContent='flex-start' alignItems='center' spacing={1}>
      <Grid item xs={12}>
        <Typography variant='body2'>
          {t('Submit a valid invoice for {{amountSats}} Satoshis.', {
            amountSats: pn(order.invoice_amount),
          })}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <WalletsButton />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth={true}
          error={lightning.badInvoice != ''}
          helperText={lightning.badInvoice ? t(lightning.badInvoice) : ''}
          label={t('Payout Lightning Invoice')}
          required
          value={lightning.invoice}
          inputProps={{
            style: { textAlign: 'center', maxHeight: '14.28em' },
          }}
          multiline
          minRows={4}
          maxRows={8}
          onChange={(e) => setLightning({ ...lightning, invoice: e.target.value ?? '' })}
        />
      </Grid>
      <Grid item xs={12}>
        <LoadingButton
          loading={loading}
          onClick={() => onClickSubmit(lightning.invoice)}
          variant='outlined'
          color='primary'
        >
          {t('Submit')}
        </LoadingButton>
      </Grid>
    </Grid>
  );
};

export default LightningPayoutForm;
