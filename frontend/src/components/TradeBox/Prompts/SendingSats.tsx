import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, CircularProgress } from '@mui/material';

export const SendingSatsPrompt = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={1}
      padding={1}
    >
      <Grid item>
        <Typography variant='body2'>
          {t(
            'RoboSats is trying to pay your lightning invoice. Remember that lightning nodes must be online in order to receive payments.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  );
};

export default SendingSatsPrompt;
