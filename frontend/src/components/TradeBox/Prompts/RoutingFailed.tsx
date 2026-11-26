import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { ContentCopy, SupportAgent } from '@mui/icons-material';
import Countdown, { type CountdownRenderProps } from 'react-countdown';

import { type Order, type Settings } from '../../../models';
import { type LightningForm, LightningPayoutForm } from '../Forms';
import { AppContext, type UseAppStoreType } from '../../../contexts/AppContext';
import { systemClient } from '../../../services/System';
import {
  formatRetryCountdown,
  getRoutingFailureKind,
  getRoutingRetryProgress,
  routingFailureReport,
  type RoutingFailureKind,
} from '../../../utils/routingFailure';

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

interface NextStepsProps {
  order: Order;
}

const NextSteps = ({ order }: NextStepsProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { setOpen } = useContext<UseAppStoreType>(AppContext);

  const routeHints = [
    t('Check that your wallet is online and has enough inbound liquidity for this amount.'),
    t('Try a higher routing budget in the advanced options below.'),
    t('Try an invoice from a different wallet.'),
  ];
  const hints: Record<RoutingFailureKind, string[]> = {
    route: routeHints,
    unknown: routeHints,
    invoice: [
      t('Your wallet rejected the payment. Generate a new invoice and submit it below.'),
      t('Try an invoice from a different wallet.'),
    ],
    coordinator: [
      t(
        'The coordinator could not send this payment. Contact the coordinator and share the error details.',
      ),
    ],
  };

  return (
    <Box sx={{ px: 1 }}>
      <Typography variant='body2'>
        <b>{t('What you can do:')}</b>
      </Typography>
      <Box component='ul' sx={{ mt: 0.5, mb: 1, pl: 2.5 }}>
        {hints[getRoutingFailureKind(order.failure_reason)].map((hint) => (
          <Typography component='li' variant='body2' key={hint}>
            {hint}
          </Typography>
        ))}
      </Box>
      <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
        <Grid>
          <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
            <Button
              size='small'
              color='inherit'
              startIcon={<ContentCopy />}
              onClick={() => {
                systemClient.copyToClipboard(routingFailureReport(order));
              }}
            >
              {t('Copy error details')}
            </Button>
          </Tooltip>
        </Grid>
        <Grid>
          <Button
            size='small'
            startIcon={<SupportAgent />}
            onClick={() => {
              setOpen((open) => ({ ...open, coordinator: order.shortAlias }));
            }}
          >
            {t('Contact coordinator')}
          </Button>
        </Grid>
      </Grid>
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
  const retryProgress = getRoutingRetryProgress(order.retries);

  const countdownRenderer = function ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps): React.JSX.Element {
    if (completed) {
      return (
        <Grid
          container
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
        >
          <Grid>
            <Typography>{t('Retrying!')}</Typography>
          </Grid>
          <Grid>
            <CircularProgress />
          </Grid>
        </Grid>
      );
    } else {
      return <span>{formatRetryCountdown({ days, hours, minutes, seconds })}</span>;
    }
  };

  if (order.invoice_expired) {
    return (
      <Grid
        container
        spacing={0.5}
        sx={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          padding: 1,
        }}
      >
        <Grid>
          <Typography variant='body2'>
            {t(
              'Your invoice has expired or more than 3 payment attempts have been made. Submit a new invoice.',
            )}
          </Typography>
        </Grid>

        {order.failure_reason ? (
          <Grid>
            <FailureReason failureReason={order.failure_reason} />
          </Grid>
        ) : (
          <></>
        )}

        <Grid>
          <NextSteps order={order} />
        </Grid>

        <Grid>
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
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          padding: 1,
        }}
      >
        {order.failure_reason ? (
          <Grid>
            <FailureReason failureReason={order.failure_reason} />
          </Grid>
        ) : (
          <></>
        )}
        {retryProgress != null ? (
          <Grid>
            <Typography variant='body2' align='center'>
              <b>
                {t('Payment attempt {{attempt}} of {{total}} failed', {
                  attempt: retryProgress.attempt,
                  total: retryProgress.total,
                })}
              </b>
            </Typography>
          </Grid>
        ) : (
          <></>
        )}
        <Grid>
          <Typography variant='body2'>
            {t(
              'RoboSats will try to pay your invoice 3 times with a one minute pause in between. If it keeps failing, you will be able to submit a new invoice. Check whether you have enough inbound liquidity. Remember that lightning nodes must be online in order to receive payments.',
            )}
          </Typography>
        </Grid>
        <div style={{ height: '0.6em' }} />
        <Grid>
          <Typography align='center'>
            <b>{t('Next attempt in')}</b>
          </Typography>
        </Grid>
        <Grid>
          <Countdown date={new Date(order.next_retry_time)} renderer={countdownRenderer} />
        </Grid>
      </Grid>
    );
  }
};

export default RoutingFailedPrompt;
