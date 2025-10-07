import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { type Order } from '../../../models';

interface ExpiredPromptProps {
  order: Order;
  loadingRenew: boolean;
  onClickRenew: (password?: string) => void;
}

export const ExpiredPrompt = ({
  loadingRenew,
  order,
  onClickRenew,
}: ExpiredPromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [password, setPassword] = useState<string>();
  const [error, setError] = useState<boolean>(false);

  return (
    <Grid container direction='row'>
      <Grid item style={{ width: '100%' }}>
        <Typography variant='body2' align='center'>
          {t(order.expiry_message)}
        </Typography>
      </Grid>
      {order.is_maker ? (
        <>
          {order.has_password && (
            <Grid item sx={{ width: '100%' }}>
              <Tooltip
                placement='top'
                enterTouchDelay={300}
                enterDelay={700}
                enterNextDelay={2000}
                title={t('Enter a password again')}
              >
                <TextField
                  fullWidth
                  label={`${t('Password')}`}
                  type='password'
                  value={password}
                  style={{ marginBottom: 8 }}
                  error={error}
                  required
                  inputProps={{
                    style: {
                      textAlign: 'center',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 4,
                    },
                  }}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                />
              </Tooltip>
            </Grid>
          )}
          <Grid
            item
            style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '8px' }}
          >
            <LoadingButton
              loading={loadingRenew}
              variant='outlined'
              color='primary'
              onClick={() => {
                if (order.has_password) {
                  if (password && password !== '') {
                    setError(false)
                    onClickRenew(password)
                  } else {
                    setError(true)
                  }
                } else {
                  onClickRenew()
                }
                
              }}
            >
              {t('Renew Order')}
            </LoadingButton>
          </Grid>
        </>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export default ExpiredPrompt;
