import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, TextField, List, Divider, ListItemText, ListItem } from '@mui/material';
import { Order } from '../../../models';
import WalletsButton from '../WalletsButton';
import { LoadingButton } from '@mui/lab';
import { pn } from '../../../utils';

export interface OnchainForm {
  address: string;
  miningFee: number;
  badAddress: string;
}

export const defaultOnchain: OnchainForm = {
  address: '',
  miningFee: 10,
  badAddress: '',
};

interface OnchainPayoutFormProps {
  order: Order;
  loading: boolean;
  onchain: OnchainForm;
  setOnchain: (state: OnchainForm) => void;
  onClickSubmit: () => void;
}

export const OnchainPayoutForm = ({
  order,
  loading,
  onClickSubmit,
  onchain,
  setOnchain,
}: OnchainPayoutFormProps): JSX.Element => {
  const { t } = useTranslation();

  const invalidFee = onchain.miningFee < 1 || onchain.miningFee > 50;
  const costPerVByte = 141;

  useEffect(() => {
    setOnchain({ ...onchain, miningFee: order.suggested_mining_fee_rate });
  }, []);

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
    >
      <List dense={true}>
        <ListItem>
          <Typography variant='body2'>
            {t('RoboSats coordinator will do a swap and send the Sats to your onchain address.')}
          </Typography>
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemText
            primary={
              pn(Math.floor((order.invoice_amount * order.swap_fee_rate) / 100)) +
              ' Sats (' +
              order.swap_fee_rate +
              '%)'
            }
            secondary={t('Swap fee')}
          />
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemText
            primary={
              pn(Math.floor(Math.max(1, onchain.miningFee) * costPerVByte)) +
              ' Sats (' +
              Math.max(1, onchain.miningFee) +
              ' Sats/vByte)'
            }
            secondary={t('Mining fee')}
          />
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemText
            primary={
              <b>
                {pn(
                  Math.floor(
                    order.invoice_amount -
                      Math.max(1, onchain.miningFee) * costPerVByte -
                      (order.invoice_amount * order.swap_fee_rate) / 100,
                  ),
                ) + ' Sats'}
              </b>
            }
            secondary={t('Final amount you will receive')}
          />
        </ListItem>
      </List>

      <Grid item>
        <Grid container direction='row' justifyContent='center' alignItems='flex-start' spacing={0}>
          <Grid item xs={7}>
            <TextField
              error={onchain.badAddress != ''}
              helperText={onchain.badAddress ? t(onchain.badAddress) : ''}
              label={t('Bitcoin Address')}
              required
              value={onchain.address}
              fullWidth={true}
              inputProps={{
                style: { textAlign: 'center' },
              }}
              onChange={(e) => setOnchain({ ...onchain, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              error={invalidFee}
              helperText={invalidFee ? t('Invalid') : ''}
              label={t('Mining Fee')}
              required
              fullWidth={true}
              value={onchain.miningFee}
              type='number'
              inputProps={{
                max: 50,
                min: 1,
                style: { textAlign: 'center' },
              }}
              onChange={(e) => setOnchain({ ...onchain, miningFee: Number(e.target.value) })}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item>
        <LoadingButton
          loading={loading}
          onClick={onClickSubmit}
          disabled={invalidFee}
          variant='outlined'
          color='primary'
        >
          {t('Submit')}
        </LoadingButton>
      </Grid>
    </Grid>
  );
};

export default OnchainPayoutForm;
