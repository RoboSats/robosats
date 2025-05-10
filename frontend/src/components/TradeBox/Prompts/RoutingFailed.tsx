import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import Countdown, { type CountdownRenderProps, zeroPad } from 'react-countdown';

import { type Order, type Settings } from '../../../models';
import { type LightningForm, LightningPayoutForm } from '../Forms';

interface RoutingFailedPromptProps {
  order: Order;
  onClickSubmitInvoice: (invoice: string) => void;
  lightning: LightningForm;
  loadingLightning: boolean;
  setLightning: (state: LightningForm) => void;
  settings: Settings;
}

interface FailureReasonProps {
  failureReason: string;
}

const FailureReason = ({ failureReason }: FailureReasonProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      style={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '0.3em',
        border: `1px solid ${theme.palette.text.secondary}`,
        padding: '0.5em',
      }}
    >
      <Typography variant='body2' align='center'>
        <b>{t('Failure reason:')}</b>
      </Typography>
      <Typography variant='body2' align='center'>
        {t(failureReason)}
      </Typography>
    </Box>
  );
};

export const RoutingFailedPrompt = ({
  order,
  onClickSubmitInvoice,
  loadingLightning,
  lightning,
  setLightning,
  settings,
}: RoutingFailedPromptProps): React.JSX.Element => {
  const { t } = useTranslation();

  const countdownRenderer = function ({
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps): React.JSX.Element {
    if (completed) {
      return (
        <Grid container direction='column' alignItems='center' justifyContent='center' spacing={1}>
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

  if (order.invoice_expired) {
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
          <Typography variant='body2'>
            {t(
              'Your invoice has expired or more than 3 payment attempts have been made. Submit a new invoice.',
            )}
          </Typography>
        </Grid>

        {order.failure_reason != null ? (
          <Grid item>
            <FailureReason failureReason={order.failure_reason} />
          </Grid>
        ) : (
          <></>
        )}

        <Grid item>
          <LightningPayoutForm
            order={order}
            settings={settings}
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
        spacing={1}
        padding={1}
      >
        <Grid item>
          <FailureReason failureReason={order.failure_reason} />
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            {t(
              'RoboSats will try to pay your invoice 3 times with a one minute pause in between. If it keeps failing, you will be able to submit a new invoice. Check whether you have enough inbound liquidity. Remember that lightning nodes must be online in order to receive payments.',
            )}
          </Typography>
        </Grid>
        <div style={{ height: '0.6em' }} />
        <Grid item>
          <Typography align='center'>
            <b>{t('Next attempt in')}</b>
          </Typography>
        </Grid>
        <Grid item>
          <Countdown date={new Date(order.next_retry_time)} renderer={countdownRenderer} />
        </Grid>
      </Grid>
    );
  }
};

export default RoutingFailedPrompt;
