import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { Order } from '../../../models';

interface ExpiredPrompProps {
  order: Order;
  renewLoading: boolean;
  onClickRenew: () => void;
}

export const ExpiredPrompt = ({
  renewLoading,
  order,
  onClickRenew,
}: ExpiredPrompProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Typography variant='body2' align='center'>
          {t(order.expiry_message)}
        </Typography>
      </Grid>
      {order.is_maker ? (
        <Grid item xs={12} style={{ display: 'flex', justifyContent: 'center' }}>
          <LoadingButton
            loading={renewLoading}
            variant='contained'
            color='primary'
            onClick={onClickRenew}
          >
            {t('Renew Order')}
          </LoadingButton>
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export default ExpiredPrompt;
