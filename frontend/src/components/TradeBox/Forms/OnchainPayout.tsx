import React from 'react';
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
  miningFee: 141,
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

  return (
    <>
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
              pn(Math.floor(Math.max(1, onchain.miningFee) * defaultOnchain.miningFee)) +
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
                      Math.max(1, onchain.miningFee) * defaultOnchain.miningFee -
                      (order.invoice_amount * order.swap_fee_rate) / 100,
                  ),
                ) + ' Sats'}
              </b>
            }
            secondary={t('Final amount you will receive')}
          />
        </ListItem>

        <ListItem>
          <TextField
            error={onchain.badAddress != '' ? true : false}
            helperText={onchain.badAddress ? t(onchain.badAddress) : ''}
            label={t('Bitcoin Address')}
            required
            value={onchain.address}
            sx={{ width: '12.14em' }}
            inputProps={{
              style: { textAlign: 'center' },
            }}
            onChange={(e) => setOnchain({ ...onchain, address: e.target.value })}
          />
          <TextField
            error={invalidFee}
            helperText={invalidFee ? t('Invalid') : ''}
            label={t('Mining Fee')}
            required
            sx={{ width: '7.85em' }}
            value={onchain.miningFee}
            type='number'
            inputProps={{
              max: 50,
              min: 1,
              style: { textAlign: 'center' },
            }}
            onChange={(e) => setOnchain({ ...onchain, miningFee: Number(e.target.value) })}
          />
        </ListItem>
      </List>

      <Grid item xs={12}>
        <LoadingButton
          loading={loading}
          onClick={onClickSubmit}
          disabled={invalidFee}
          variant='contained'
          color='primary'
        >
          {t('Submit')}
        </LoadingButton>
      </Grid>
    </>
  );
};

export default OnchainPayoutForm;
