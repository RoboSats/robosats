import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { type Order } from '../../../models';

interface ExpiredPromptProps {
  order: Order;
  loadingRenew: boolean;
  onClickRenew: () => void;
}

export const ExpiredPrompt = ({
  loadingRenew,
  order,
  onClickRenew,
}: ExpiredPromptProps): React.JSX.Element => {
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
            loading={loadingRenew}
            variant='outlined'
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
