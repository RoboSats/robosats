import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Tooltip,
  FormControlLabel,
  Checkbox,
  useTheme,
  Collapse,
  Switch,
} from '@mui/material';
import { Order } from '../../../models';
import WalletsButton from '../WalletsButton';
import { LoadingButton } from '@mui/lab';
import { pn } from '../../../utils';

import { RoundaboutRight, Route, SelfImprovement } from '@mui/icons-material';
import { apiClient } from '../../../services/api';

import lnproxies from '../../../../static/lnproxies.json';

export interface LightningForm {
  invoice: string;
  amount: number;
  advancedOptions: boolean;
  useCustomBudget: boolean;
  routingBudgetUnit: 'PPM' | 'Sats';
  routingBudgetPPM: number;
  routingBudgetSats: number;
  badInvoice: string;
  useLnproxy: boolean;
  lnproxyInvoice: string;
  lnproxyServer: number;
  lnproxyBudgetUnit: 'PPM' | 'Sats';
  lnproxyBudgetPPM: number;
  lnproxyBudgetSats: number;
  badLnproxy: string;
}

export const defaultLightning: LightningForm = {
  invoice: '',
  amount: 0,
  advancedOptions: false,
  useCustomBudget: false,
  routingBudgetUnit: 'PPM',
  routingBudgetPPM: 1000,
  routingBudgetSats: 0,
  badInvoice: '',
  useLnproxy: false,
  lnproxyInvoice: '',
  lnproxyServer: 0,
  lnproxyBudgetUnit: 'PPM',
  lnproxyBudgetPPM: 0,
  lnproxyBudgetSats: 0,
  badLnproxy: '',
};

interface LightningPayoutFormProps {
  order: Order;
  loading: boolean;
  lightning: LightningForm;
  setLightning: (state: LightningForm) => void;
  onClickSubmit: (invoice: string) => void;
}

export const LightningPayoutForm = ({
  order,
  loading,
  onClickSubmit,
  lightning,
  setLightning,
}: LightningPayoutFormProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const computeInvoiceAmount = function () {
    return (
      order.trade_satoshis -
      Math.round((order.trade_satoshis / 1000000) * lightning.routingBudgetPPM)
    );
  };

  useEffect(() => {
    setLightning({
      ...lightning,
      amount: computeInvoiceAmount(),
    });
  }, []);

  const fetchLnproxy = function () {
    apiClient
      .get(
        `http://${lnproxies[lightning.lnproxyServer].mainnetOnion}`,
        `/api/${lightning.lnproxyInvoice}?routing_msat=${lightning.lnproxyBudgetSats * 1000}`,
      )
      .then((data) => {
        setLightning({ ...lightning, invoice: String(data) });
      })
      .catch(() => {
        setLightning({ ...lightning, badLnproxy: 'Lnproxy error' });
      });
  };

  return (
    <Grid container direction='column' justifyContent='flex-start' alignItems='center' spacing={1}>
      <Grid item>
        <Typography variant='body2'>
          {t('Submit a valid invoice for {{amountSats}} Satoshis.', {
            amountSats: pn(lightning.amount),
          })}
        </Typography>
      </Grid>

      <Grid item>
        <WalletsButton />
      </Grid>

      <Grid
        item
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '1.1em',
        }}
      >
        {' '}
        <Typography color='text.secondary'>{t('Advanced options')}</Typography>
        <Switch
          size='small'
          checked={lightning.advancedOptions}
          onChange={(e) => {
            const checked = e.target.checked;
            setLightning({
              ...lightning,
              advancedOptions: checked,
              useLnproxy: checked ? lightning.useLnproxy : false,
              useCustomBudget: checked ? lightning.useCustomBudget : false,
            });
          }}
        />
        <SelfImprovement sx={{ color: 'text.secondary' }} />
      </Grid>

      <Grid item>
        <Collapse in={lightning.advancedOptions}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              width: '18em',
              borderRadius: '4px',
              borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
              },
            }}
          >
            <Grid
              container
              direction='column'
              justifyContent='flex-start'
              alignItems='center'
              spacing={0.5}
              padding={0.5}
            >
              <Grid item>
                <Tooltip
                  enterTouchDelay={0}
                  leaveTouchDelay={4000}
                  placement='top'
                  title={t(
                    `Wrap this invoice using a Lnproxy service to protect privacy (hides receiving wallet).`,
                  )}
                >
                  <FormControlLabel
                    onChange={(e) =>
                      setLightning({
                        ...lightning,
                        useLnproxy: e.target.checked,
                        invoice: e.target.checked ? '' : lightning.invoice,
                      })
                    }
                    checked={lightning.useLnproxy}
                    control={<Checkbox />}
                    label={
                      <Typography color={lightning.useLnproxy ? 'primary' : 'text.secondary'}>
                        {t('Use Lnproxy')}
                      </Typography>
                    }
                  />
                </Tooltip>
              </Grid>
              <Collapse in={lightning.useLnproxy}>
                <Grid item>
                  <LoadingButton
                    loading={loading}
                    onClick={fetchLnproxy}
                    variant='outlined'
                    color='primary'
                  >
                    {t('Submit')}
                  </LoadingButton>
                </Grid>
              </Collapse>
            </Grid>
          </Box>
        </Collapse>
      </Grid>

      <Grid item>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '4px',
            width: '18em',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
            },
          }}
        >
          <Grid
            container
            direction='column'
            justifyContent='flex-start'
            alignItems='center'
            spacing={0.5}
            padding={0.5}
          >
            <Collapse in={lightning.advancedOptions}>
              <Tooltip
                enterTouchDelay={0}
                leaveTouchDelay={4000}
                placement='top'
                title={t(
                  `Set custom routing budget for the payout. If you don't know what this is, simply do not touch.`,
                )}
              >
                <FormControlLabel
                  checked={lightning.useCustomBudget}
                  onChange={(e) =>
                    setLightning({ ...lightning, useCustomBudget: e.target.checked })
                  }
                  control={<Checkbox />}
                  label={
                    <Typography
                      style={{ display: 'flex', alignItems: 'center' }}
                      color={lightning.useCustomBudget ? 'primary' : 'text.secondary'}
                    >
                      {t('Use custom routing budget')}
                    </Typography>
                  }
                />
              </Tooltip>
            </Collapse>

            <Grid item>
              <TextField
                fullWidth={true}
                disabled={lightning.useLnproxy}
                error={lightning.badInvoice != ''}
                helperText={lightning.badInvoice ? t(lightning.badInvoice) : ''}
                label={t('Payout Lightning Invoice')}
                required
                value={lightning.invoice}
                inputProps={{
                  style: { textAlign: 'center', maxHeight: '6em' },
                }}
                variant='standard'
                multiline
                minRows={2}
                maxRows={4}
                onChange={(e) => setLightning({ ...lightning, invoice: e.target.value ?? '' })}
              />
            </Grid>
            <Grid item>
              <LoadingButton
                loading={loading}
                onClick={() => onClickSubmit(lightning.invoice)}
                variant='outlined'
                color='primary'
              >
                {t('Submit')}
              </LoadingButton>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default LightningPayoutForm;
