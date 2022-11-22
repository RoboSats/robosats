import React, { useEffect, useState } from 'react';
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
  MenuItem,
  Select,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
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
  routingBudgetSats: number | undefined;
  badInvoice: string;
  useLnproxy: boolean;
  lnproxyInvoice: string;
  lnproxyAmount: number;
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
  routingBudgetSats: undefined,
  badInvoice: '',
  useLnproxy: false,
  lnproxyInvoice: '',
  lnproxyAmount: 0,
  lnproxyServer: 0,
  lnproxyBudgetUnit: 'Sats',
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

  const [loadingLnproxy, setLoadingLnproxy] = useState<boolean>(false);

  const computeInvoiceAmount = function () {
    //const tradeAmount = order.trade_satoshis
    const tradeAmount = 10000;
    return tradeAmount - Math.round((tradeAmount / 1000000) * lightning.routingBudgetPPM);
  };

  useEffect(() => {
    const amount = computeInvoiceAmount();
    setLightning({
      ...lightning,
      amount,
      lnproxyAmount: amount - lightning.lnproxyBudgetSats,
      routingBudgetSats:
        lightning.routingBudgetSats == undefined
          ? (amount / 1000000) * lightning.routingBudgetPPM
          : lightning.routingBudgetSats,
    });
  }, [lightning.routingBudgetPPM]);

  const lnproxyUrl = function () {
    return `http://${lnproxies[lightning.lnproxyServer].mainnetOnion}`;
  };

  const fetchLnproxy = function () {
    setLoadingLnproxy(true);
    apiClient
      .get(
        lnproxyUrl(),
        `/api/${lightning.lnproxyInvoice}?routing_msat=${lightning.lnproxyBudgetSats * 1000}`,
      )
      .then((data) => {
        const response = String(data);
        if (response.includes('lnproxy error')) {
          setLightning({ ...lightning, badLnproxy: response });
        } else {
          setLightning({ ...lightning, invoice: String(data), badLnproxy: '' });
        }
      })
      // .catch(() => {
      //   setLightning({ ...lightning, badLnproxy: 'Lnproxy server uncaught error' });
      // })
      .finally(() => {
        setLoadingLnproxy(false);
      });
  };

  const onProxyBudgetChange = function (e) {
    if (isFinite(e.target.value)) {
      if (lightning.lnproxyBudgetUnit === 'Sats') {
        const lnproxyBudgetSats = Math.floor(e.target.value);
        const lnproxyBudgetPPM = Math.round((lnproxyBudgetSats * 1000000) / lightning.amount);
        const lnproxyAmount = lightning.amount - lnproxyBudgetSats;
        setLightning({ ...lightning, lnproxyBudgetSats, lnproxyBudgetPPM, lnproxyAmount });
      } else {
        const lnproxyBudgetPPM = e.target.value;
        const lnproxyBudgetSats = Math.round((lightning.amount / 1000000) * lnproxyBudgetPPM);
        const lnproxyAmount = lightning.amount - lnproxyBudgetSats;
        setLightning({ ...lightning, lnproxyBudgetSats, lnproxyBudgetPPM, lnproxyAmount });
      }
    }
  };

  const onRoutingBudgetChange = function (e) {
    if (isFinite(e.target.value)) {
      if (lightning.routingBudgetUnit === 'Sats') {
        const routingBudgetSats = Math.floor(e.target.value);
        const routingBudgetPPM = Math.round((routingBudgetSats * 1000000) / lightning.amount);
        const amount = lightning.amount - routingBudgetSats;
        setLightning({ ...lightning, routingBudgetSats, routingBudgetPPM, amount });
      } else {
        const routingBudgetPPM = e.target.value;
        const routingBudgetSats = Math.round((lightning.amount / 1000000) * routingBudgetPPM);
        const amount = lightning.amount - routingBudgetSats;
        setLightning({ ...lightning, routingBudgetSats, routingBudgetPPM, amount });
      }
    }
  };

  const lnProxyBudgetHelper = function () {
    let text = '';
    if (lightning.lnproxyBudgetSats < 0) {
      text = 'Must be positive';
    } else if (lightning.lnproxyBudgetPPM > 10000) {
      text = 'Too high! (That is more than 1%)';
    }
    return text;
  };

  const routingBudgetHelper = function () {
    let text = '';
    if (lightning.routingBudgetSats < 0) {
      text = 'Must be positive';
    } else if (lightning.routingBudgetPPM > 10000) {
      text = 'Too high! (That is more than 1%)';
    }
    return text;
  };

  return (
    <Grid container direction='column' justifyContent='flex-start' alignItems='center' spacing={1}>
      <div style={{ height: '0.3em' }} />
      <Grid
        item
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '1.1em',
        }}
      >
        <Typography color='text.primary'>{t('Advanced options')}</Typography>
        <Switch
          size='small'
          checked={lightning.advancedOptions}
          onChange={(e) => {
            const checked = e.target.checked;
            setLightning({
              ...lightning,
              advancedOptions: checked,
              useLnproxy: checked ? lightning.useLnproxy : false,
              invoice: checked ? '' : lightning.invoice,
              useCustomBudget: checked ? lightning.useCustomBudget : false,
            });
          }}
        />
        <SelfImprovement sx={{ color: 'text.primary' }} />
      </Grid>

      <Grid item>
        <Collapse in={lightning.advancedOptions}>
          <Tooltip
            enterTouchDelay={0}
            leaveTouchDelay={4000}
            placement='top'
            title={t(
              `Wrap this invoice using a Lnproxy server to protect your privacy (hides the receiving wallet).`,
            )}
          >
            <Box
              sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                width: '18em',
                borderRadius: '0.3em',
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
                  <div>
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
                  </div>
                </Grid>
                <Grid item>
                  <Collapse in={lightning.useLnproxy}>
                    <Grid
                      container
                      direction='column'
                      justifyContent='flex-start'
                      alignItems='center'
                      spacing={1}
                    >
                      <Grid item>
                        <FormControl>
                          <InputLabel id='select-label'>{t('Server')}</InputLabel>
                          <Select
                            sx={{ width: '14em' }}
                            label={t('Server')}
                            labelId='select-label'
                            value={lightning.lnproxyServer}
                            onChange={(e) =>
                              setLightning({ ...lightning, lnproxyServer: Number(e.target.value) })
                            }
                          >
                            {lnproxies.map((lnproxyServer, index) => (
                              <MenuItem key={index} value={index}>
                                <Typography>{lnproxyServer.name}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item>
                        <TextField
                          sx={{ width: '14em' }}
                          disabled={!lightning.useLnproxy}
                          error={lnProxyBudgetHelper() != ''}
                          helperText={lnProxyBudgetHelper()}
                          label={t('Proxy Budget')}
                          value={
                            lightning.lnproxyBudgetUnit == 'PPM'
                              ? lightning.lnproxyBudgetPPM
                              : lightning.lnproxyBudgetSats
                          }
                          variant='outlined'
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position='end'>
                                <Button
                                  variant='text'
                                  onClick={() => {
                                    setLightning({
                                      ...lightning,
                                      lnproxyBudgetUnit:
                                        lightning.lnproxyBudgetUnit == 'PPM' ? 'Sats' : 'PPM',
                                    });
                                  }}
                                >
                                  {lightning.lnproxyBudgetUnit}
                                </Button>
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{
                            style: {
                              textAlign: 'center',
                            },
                          }}
                          onChange={onProxyBudgetChange}
                        />
                      </Grid>

                      <Grid item>
                        <Typography variant='body2'>
                          {t('Submit a valid invoice for {{amountSats}} Satoshis.', {
                            amountSats: pn(lightning.lnproxyAmount),
                          })}
                        </Typography>
                      </Grid>

                      <Grid item>
                        <TextField
                          disabled={!lightning.useLnproxy}
                          error={lightning.badLnproxy != ''}
                          helperText={lightning.badLnproxy ? t(lightning.badLnproxy) : ''}
                          label={t('Invoice to wrap')}
                          required
                          value={lightning.lnproxyInvoice}
                          inputProps={{
                            style: { textAlign: 'center' },
                          }}
                          variant='outlined'
                          onChange={(e) =>
                            setLightning({ ...lightning, lnproxyInvoice: e.target.value ?? '' })
                          }
                        />
                      </Grid>

                      <Grid item>
                        <LoadingButton
                          loading={loadingLnproxy}
                          onClick={fetchLnproxy}
                          variant='outlined'
                          color='primary'
                        >
                          {t('Wrap invoice')}
                        </LoadingButton>
                      </Grid>
                    </Grid>
                  </Collapse>
                </Grid>
              </Grid>
            </Box>
          </Tooltip>
        </Collapse>
      </Grid>

      <Grid item>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '0.3em',
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
                <div>
                  <FormControlLabel
                    checked={lightning.useCustomBudget}
                    onChange={(e) =>
                      setLightning({
                        ...lightning,
                        useCustomBudget: e.target.checked,
                        routingBudgetSats: defaultLightning.routingBudgetSats,
                        routingBudgetPPM: defaultLightning.routingBudgetPPM,
                      })
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
                </div>
              </Tooltip>
            </Collapse>

            <Grid item>
              <Collapse in={lightning.useCustomBudget}>
                <TextField
                  sx={{ width: '14em' }}
                  disabled={!lightning.useCustomBudget}
                  error={routingBudgetHelper() != ''}
                  helperText={routingBudgetHelper()}
                  label={t('Routing Budget')}
                  required={true}
                  value={
                    lightning.routingBudgetUnit == 'PPM'
                      ? lightning.routingBudgetPPM
                      : lightning.routingBudgetSats
                  }
                  variant='outlined'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <Button
                          variant='text'
                          onClick={() => {
                            setLightning({
                              ...lightning,
                              routingBudgetUnit:
                                lightning.routingBudgetUnit == 'PPM' ? 'Sats' : 'PPM',
                            });
                          }}
                        >
                          {lightning.routingBudgetUnit}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      textAlign: 'center',
                    },
                  }}
                  onChange={onRoutingBudgetChange}
                />
              </Collapse>
            </Grid>

            <Grid item>
              <Collapse in={!lightning.useLnproxy}>
                <Typography variant='body2'>
                  {t('Submit a valid invoice for {{amountSats}} Satoshis.', {
                    amountSats: pn(lightning.amount),
                  })}
                </Typography>
              </Collapse>
            </Grid>

            <Grid item>
              <TextField
                fullWidth={true}
                disabled={lightning.useLnproxy}
                error={lightning.badInvoice != ''}
                helperText={lightning.badInvoice ? t(lightning.badInvoice) : ''}
                label={lightning.useLnproxy ? t('Wrapped invoice') : t('Payout Lightning Invoice')}
                required
                value={lightning.invoice}
                inputProps={{
                  style: { textAlign: 'center', maxHeight: '6em' },
                }}
                variant={
                  lightning.useLnproxy
                    ? 'filled'
                    : lightning.useCustomBudget
                    ? 'outlined'
                    : 'standard'
                }
                multiline={lightning.useLnproxy ? false : true}
                minRows={2}
                maxRows={4}
                onChange={(e) => setLightning({ ...lightning, invoice: e.target.value ?? '' })}
              />
            </Grid>
            <Grid item>
              <LoadingButton
                loading={loading}
                disabled={lightning.invoice == ''}
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

      <Grid item>
        <WalletsButton />
      </Grid>
    </Grid>
  );
};

export default LightningPayoutForm;
