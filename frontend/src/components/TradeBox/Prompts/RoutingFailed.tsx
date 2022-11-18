import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Grid, List, ListItemText, Typography } from '@mui/material';
import Countdown, { CountdownRenderProps, zeroPad } from 'react-countdown';

import { Order } from '../../../models';
import { LightningForm, LightningPayoutForm } from '../Forms';

interface RoutingFailedPromptProps {
  order: Order;
  onClickSubmitInvoice: (invoice: string) => void;
  lightning: LightningForm;
  loadingLightning: boolean;
  setLightning: (state: LightningForm) => void;
}

interface FailureReasonProps {
  failureReason: string;
}

const FailureReason = ({ failureReason }: FailureReasonProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Grid>
      <Typography variant='body2' align='center'>
        <b>{t('Failure reason:')}</b>
      </Typography>
      <Typography variant='body2' align='center'>
        {t(failureReason)}
      </Typography>
    </Grid>
  );
};

export const RoutingFailedPrompt = ({
  order,
  onClickSubmitInvoice,
  loadingLightning,
  lightning,
  setLightning,
}: RoutingFailedPromptProps): JSX.Element => {
  const { t } = useTranslation();

  const countdownRenderer = function ({ minutes, seconds, completed }: CountdownRenderProps) {
    if (completed) {
      return (
        <Grid container direction='column' justifyContent='center' spacing={1}>
          <Grid item>
            <Typography>{t('Retrying!')}</Typography>
          </Grid>
          <Grid item>
            <CircularProgress />
          </Grid>
        </Grid>
      );
    } else {
      return <span>{`${zeroPad(minutes)}m ${zeroPad(seconds)}s `}</span>;
    }
  };

  if (order.invoice_expired && order.failure_reason) {
    return (
      <Grid
        container
        direction='column'
        justifyContent='flex-start'
        alignItems='center'
        spacing={0.5}
        padding={1}
      >
        <Grid item>
          <FailureReason failureReason={order.failure_reason} />
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            {t(
              'Your invoice has expired or more than 3 payment attempts have been made. Submit a new invoice.',
            )}
          </Typography>
        </Grid>

        <Grid item>
          <LightningPayoutForm
            order={order}
            loading={loadingLightning}
            lightning={lightning}
            setLightning={setLightning}
            onClickSubmit={onClickSubmitInvoice}
          />
        </Grid>
      </Grid>
    );
  } else {
    return (
      <Grid
        container
        direction='column'
        justifyContent='flex-start'
        alignItems='center'
        spacing={0.5}
        padding={1}
      >
        <Grid item>
          <FailureReason failureReason={order.failure_reason} />
        </Grid>
        <Grid item>
          <Typography variant='body2' align='center'>
            {t(
              'RoboSats will try to pay your invoice 3 times with a one minute pause in between. If it keeps failing, you will be able to submit a new invoice. Check whether you have enough inbound liquidity. Remember that lightning nodes must be online in order to receive payments.',
            )}
          </Typography>
        </Grid>
        <Grid item>
          <List>
            <ListItemText secondary={t('Next attempt in')}>
              <Countdown date={new Date(order.next_retry_time)} renderer={countdownRenderer} />
            </ListItemText>
          </List>
        </Grid>
      </Grid>
    );
  }
};

export default RoutingFailedPrompt;
