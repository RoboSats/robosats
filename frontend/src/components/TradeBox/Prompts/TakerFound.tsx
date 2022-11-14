import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { Order } from '../../../models';

export const TakerFoundPrompt = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Typography variant='body2'>
      {t(
        'Please wait for the taker to lock a bond. If the taker does not lock a bond in time, the order will be made public again.',
      )}
    </Typography>
  );
};

export default TakerFoundPrompt;
