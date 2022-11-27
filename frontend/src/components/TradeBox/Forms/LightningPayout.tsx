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
  IconButton,
  FormHelperText,
} from '@mui/material';

import { Order, Settings } from '../../../models';
import { decode } from 'light-bolt11-decoder';
import WalletsButton from '../WalletsButton';
import { LoadingButton } from '@mui/lab';
import { pn } from '../../../utils';

import { ContentCopy, Help, SelfImprovement } from '@mui/icons-material';
import { apiClient } from '../../../services/api';

import lnproxies from '../../../../static/lnproxies.json';
import { systemClient } from '../../../services/System';

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
  settings: Settings;
}

export const LightningPayoutForm = ({
  order,
  loading,
  onClickSubmit,
  lightning,
  setLightning,
  settings,
}: LightningPayoutFormProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [loadingLnproxy, setLoadingLnproxy] = useState<boolean>(false);
  const [badLnproxyServer, setBadLnproxyServer] = useState<string>('');

  const computeInvoiceAmount = function () {
    const tradeAmount = order.trade_satoshis;
    return Math.floor(tradeAmount - tradeAmount * (lightning.routingBudgetPPM / 1000000));
  };

  const validateInvoice = function (invoice: string, targetAmount: number) {
    try {
      const decoded = decode(invoice);
      const invoiceAmount = Math.floor(decoded['sections'][2]['value'] / 1000);
      if (targetAmount != invoiceAmount) {
        return 'Invalid invoice amount';
      } else {
        return '';
      }
    } catch (err) {
      const error = err.toString();
      return `${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`;
    }
  };

  useEffect(() => {
    const amount = computeInvoiceAmount();
    setLightning({
      ...lightning,
      amount,
      lnproxyAmount: amount - lightning.lnproxyBudgetSats,
      routingBudgetSats:
        lightning.routingBudgetSats == undefined
          ? Math.ceil((amount / 1000000) * lightning.routingBudgetPPM)
          : lightning.routingBudgetSats,
    });
  }, [lightning.routingBudgetPPM]);

  useEffect(() => {
    if (lightning.invoice != '') {
      setLightning({
        ...lightning,
        badInvoice: validateInvoice(lightning.invoice, lightning.amount),
      });
    }
  }, [lightning.invoice, lightning.amount]);

  useEffect(() => {
    if (lightning.lnproxyInvoice != '') {
      setLightning({
        ...lightning,
        badLnproxy: validateInvoice(lightning.lnproxyInvoice, lightning.lnproxyAmount),
      });
    }
  }, [lightning.lnproxyInvoice, lightning.lnproxyAmount]);

  const lnproxyUrl = function () {
    const bitcoinNetwork = settings?.network ?? 'mainnet';
    let internetNetwork: 'Clearnet' | 'I2P' | 'TOR' = 'Clearnet';
    if (settings.host?.includes('.i2p')) {
      internetNetwork = 'I2P';
    } else if (settings.host?.includes('.onion') || window.NativeRobosats != undefined) {
      internetNetwork = 'TOR';
    }

    const url = lnproxies[lightning.lnproxyServer][`${bitcoinNetwork}${internetNetwork}`];
    if (url != 'undefined') {
      return url;
    } else {
      setBadLnproxyServer(
        t(`Server not available for {{bitcoinNetwork}} bitcoin over {{internetNetwork}}`, {
          bitcoinNetwork,
          internetNetwork: t(internetNetwork),
        }),
      );
    }
  };

  useEffect(() => {
    setBadLnproxyServer('');
    lnproxyUrl();
  }, [lightning.lnproxyServer]);

  // const fetchLnproxy = function () {
  //   setLoadingLnproxy(true);
  //   apiClient
  //     .get(
  //       lnproxyUrl(),
  //       `/api/${lightning.lnproxyInvoice}${lightning.lnproxyBudgetSats > 0 ? `?routing_msat=${lightning.lnproxyBudgetSats * 1000}` : ''}`,
  //     )
  // };

  // Lnproxy API does not return JSON, therefore not compatible with current apiClient service
  // Does not work on Android robosats!
  const fetchLnproxy = function () {
    setLoadingLnproxy(true);
    fetch(
      lnproxyUrl() +
        `/api/${lightning.lnproxyInvoice.toLocaleLowerCase()}${
          lightning.lnproxyBudgetSats > 0
            ? `?routing_msat=${lightning.lnproxyBudgetSats * 1000}`
            : ''
        }`,
    )
      .then((response) => response.text())
      .then((text) => {
        if (text.includes('lnproxy error')) {
          setLightning({ ...lightning, badLnproxy: text });
        } else {
          const invoice = text.replace('\n', '');
          setLightning({ ...lightning, invoice, badLnproxy: '' });
        }
      })
      .catch(() => {
        setLightning({ ...lightning, badLnproxy: 'Lnproxy server uncaught error' });
      })
      .finally(() => {
        setLoadingLnproxy(false);
      });
  };

  const handleAdvancedOptions = function (checked: boolean) {
    if (checked) {
      setLightning({
        ...lightning,
        advancedOptions: true,
      });
    } else {
      setLightning({
        ...defaultLightning,
        invoice: lightning.invoice,
        amount: lightning.amount,
      });
    }
  };

  const onProxyBudgetChange = function (e) {
    if (isFinite(e.target.value) && e.target.value >= 0) {
      let lnproxyBudgetSats;
      let lnproxyBudgetPPM;

      if (lightning.lnproxyBudgetUnit === 'Sats') {
        lnproxyBudgetSats = Math.floor(e.target.value);
        lnproxyBudgetPPM = Math.round((lnproxyBudgetSats * 1000000) / lightning.amount);
      } else {
        lnproxyBudgetPPM = e.target.value;
        lnproxyBudgetSats = Math.ceil((lightning.amount / 1000000) * lnproxyBudgetPPM);
      }

      if (lnproxyBudgetPPM < 99999) {
        const lnproxyAmount = lightning.amount - lnproxyBudgetSats;
        setLightning({ ...lightning, lnproxyBudgetSats, lnproxyBudgetPPM, lnproxyAmount });
      }
    }
  };

  const onRoutingBudgetChange = function (e) {
    const tradeAmount = order.trade_satoshis;
    if (isFinite(e.target.value) && e.target.value >= 0) {
      let routingBudgetSats;
      let routingBudgetPPM;

      if (lightning.routingBudgetUnit === 'Sats') {
        routingBudgetSats = Math.floor(e.target.value);
        routingBudgetPPM = Math.round((routingBudgetSats * 1000000) / tradeAmount);
      } else {
        routingBudgetPPM = e.target.value;
        routingBudgetSats = Math.ceil((lightning.amount / 1000000) * routingBudgetPPM);
      }

      if (routingBudgetPPM < 99999) {
        const amount = Math.floor(
          tradeAmount - tradeAmount * (lightning.routingBudgetPPM / 1000000),
        );
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
          onChange={(e) => handleAdvancedOptions(e.target.checked)}
        />
        <SelfImprovement sx={{ color: 'text.primary' }} />
      </Grid>

      <Grid item>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            width: '18em',
            borderRadius: '0.3em',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            padding: '1em',
          }}
        >
          <Grid
            container
            direction='column'
            justifyContent='flex-start'
            alignItems='center'
            spacing={0.5}
          >
            <Collapse in={lightning.advancedOptions}>
              <Grid
                container
                direction='column'
                justifyContent='flex-start'
                alignItems='center'
                spacing={0.5}
                padding={0.5}
              >
                <Grid item>
                  <TextField
                    sx={{ width: '14em' }}
                    disabled={!lightning.advancedOptions}
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
                </Grid>

                {window.NativeRobosats === undefined ? (
                  <Grid item>
                    <Tooltip
                      enterTouchDelay={0}
                      leaveTouchDelay={4000}
                      placement='top'
                      title={t(
                        `Wrap this invoice using a Lnproxy server to protect your privacy (hides the receiving wallet).`,
                      )}
                    >
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
                        />{' '}
                        <IconButton
                          component='a'
                          target='_blank'
                          href='https://www.lnproxy.org/about'
                          rel='noreferrer'
                        >
                          <Help sx={{ width: '0.9em', height: '0.9em', color: 'text.secondary' }} />
                        </IconButton>
                      </div>
                    </Tooltip>
                  </Grid>
                ) : (
                  <></>
                )}

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
                        <FormControl error={badLnproxyServer != ''}>
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
                          {badLnproxyServer != '' ? (
                            <FormHelperText>{t(badLnproxyServer)}</FormHelperText>
                          ) : (
                            <></>
                          )}
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
                    </Grid>
                  </Collapse>
                </Grid>
              </Grid>
            </Collapse>

            <Grid item>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography align='center' variant='body2'>
                  {t('Submit invoice for {{amountSats}} Sats', {
                    amountSats: pn(
                      lightning.useLnproxy ? lightning.lnproxyAmount : lightning.amount,
                    ),
                  })}
                </Typography>
                <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                  <IconButton
                    sx={{ height: '0.5em' }}
                    onClick={() =>
                      systemClient.copyToClipboard(
                        lightning.useLnproxy
                          ? String(lightning.lnproxyAmount)
                          : String(lightning.amount),
                      )
                    }
                  >
                    <ContentCopy sx={{ width: '0.8em' }} />
                  </IconButton>
                </Tooltip>
              </div>
            </Grid>

            <Grid item>
              {lightning.useLnproxy ? (
                <TextField
                  fullWidth={true}
                  disabled={!lightning.useLnproxy}
                  error={lightning.badLnproxy != ''}
                  FormHelperTextProps={{ style: { wordBreak: 'break-all' } }}
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
              ) : (
                <></>
              )}
              <TextField
                fullWidth={true}
                sx={lightning.useLnproxy ? { borderRadius: 0 } : {}}
                disabled={lightning.useLnproxy}
                error={lightning.badInvoice != ''}
                helperText={lightning.badInvoice ? t(lightning.badInvoice) : ''}
                FormHelperTextProps={{ style: { wordBreak: 'break-all' } }}
                label={lightning.useLnproxy ? t('Wrapped invoice') : t('Payout Lightning Invoice')}
                required
                value={lightning.invoice}
                inputProps={{
                  style: { textAlign: 'center', maxHeight: '8em' },
                }}
                variant={lightning.useLnproxy ? 'filled' : 'standard'}
                multiline={lightning.useLnproxy ? false : true}
                minRows={3}
                maxRows={5}
                onChange={(e) => setLightning({ ...lightning, invoice: e.target.value ?? '' })}
              />
            </Grid>

            <Grid item>
              {lightning.useLnproxy ? (
                <LoadingButton
                  loading={loadingLnproxy}
                  disabled={
                    lightning.lnproxyInvoice.length < 20 ||
                    badLnproxyServer != '' ||
                    lightning.badLnproxy != ''
                  }
                  onClick={fetchLnproxy}
                  variant='outlined'
                  color='primary'
                >
                  {t('Wrap')}
                </LoadingButton>
              ) : (
                <></>
              )}
              <LoadingButton
                loading={loading}
                disabled={lightning.invoice.length < 20 || lightning.badInvoice != ''}
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
