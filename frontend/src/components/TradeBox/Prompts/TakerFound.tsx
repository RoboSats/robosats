import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { Order } from '../../../models';
import stepXofY from '../stepXofY';

interface TakerFoundPrompProps {
  order: Order;
}

export const TakerFoundPrompt = ({ order }: TakerFoundPrompProps): JSX.Element => {
  const { t } = useTranslation();

  const Title = function () {
    return (
      <Typography color='primary' variant='subtitle1'>
        <b>{t('A taker has been found!')}</b>
        {` ${stepXofY(order)}`}
      </Typography>
    );
  };

  return (
    <Grid container spacing={1}>
      <Grid item>
        <Typography variant='body2'>
          {t(
            'Please wait for the taker to lock a bond. If the taker does not lock a bond in time, the order will be made public again.',
          )}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default TakerFoundPrompt;
