import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, CircularProgress } from '@mui/material';

export const SendingSatsPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Grid
      container
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        padding: 1,
      }}
    >
      <Grid item>
        <Typography variant='body2'>
          {t(
            'RoboSats is trying to pay your lightning invoice. Remember that lightning nodes must be online in order to receive payments.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='body2'>
          <b>{t('Taking too long?')}</b>{' '}
          {t(
            'Lightning payments are usually instantaneous, but sometimes a node in the route may be down, which can cause your payout to take up to 24 hours to arrive in your wallet.',
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
