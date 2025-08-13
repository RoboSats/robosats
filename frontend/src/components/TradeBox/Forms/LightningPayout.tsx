import React, { useContext, useEffect, useState, ClipboardEvent } from 'react';
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

import { type Order, type Settings } from '../../../models';
import { decode } from 'light-bolt11-decoder';
import WalletsButton from '../WalletsButton';
import { LoadingButton } from '@mui/lab';
import { pn } from '../../../utils';

import { ContentCopy, Help, SelfImprovement } from '@mui/icons-material';
import { apiClient } from '../../../services/api';

import { systemClient } from '../../../services/System';

import lnproxies from '../../../../static/lnproxies.json';
import { type UseAppStoreType, AppContext } from '../../../contexts/AppContext';
let filteredProxies: Array<Record<string, object>> = [];
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
}: LightningPayoutFormProps): React.JSX.Element => {
  const { client } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const theme = useTheme();

  const [loadingLnproxy, setLoadingLnproxy] = useState<boolean>(false);
  const [noMatchingLnProxies, setNoMatchingLnProxies] = useState<string>('');

  const computeInvoiceAmount = (): number => {
    const tradeAmount = order.trade_satoshis;
    return Math.floor(tradeAmount - tradeAmount * (lightning.routingBudgetPPM / 1000000));
  };

  const validateInvoice = (invoice: string, targetAmount: number): string => {
    try {
      const decoded = decode(invoice);
      const invoiceAmount = Math.floor(decoded.sections[2].value / 1000);
      if (targetAmount !== invoiceAmount) {
        return 'Invalid invoice amount';
      } else {
        return '';
      }
    } catch (err) {
      const error = err.toString();
      return `${String(error).substring(0, 100)}${error.length > 100 ? '...' : ''}`;
    }
  };

  useEffect(() => {
    const amount = computeInvoiceAmount();
    setLightning({
      ...lightning,
      amount,
      lnproxyAmount: amount - lightning.lnproxyBudgetSats,
      routingBudgetSats:
        lightning.routingBudgetSats === undefined
          ? Math.ceil((amount / 1000000) * lightning.routingBudgetPPM)
          : lightning.routingBudgetSats,
    });
  }, [lightning.routingBudgetPPM]);

  useEffect(() => {
    if (lightning.invoice !== '') {
      setLightning({
        ...lightning,
        badInvoice: validateInvoice(lightning.invoice, lightning.amount),
      });
    }
  }, [lightning.invoice, lightning.amount]);

  useEffect(() => {
    if (lightning.lnproxyInvoice !== '') {
      setLightning({
        ...lightning,
        badLnproxy: validateInvoice(lightning.lnproxyInvoice, lightning.lnproxyAmount),
      });
    }
  }, [lightning.lnproxyInvoice, lightning.lnproxyAmount]);

  // filter lnproxies when the network settings are updated
  let bitcoinNetwork: string = 'mainnet';
  let internetNetwork: 'Clearnet' | 'I2P' | 'TOR' = 'Clearnet';

  useEffect(() => {
    bitcoinNetwork = settings?.network ?? 'mainnet';
    if (settings.host?.includes('.i2p') === true) {
      internetNetwork = 'I2P';
    } else if (settings.host?.includes('.onion') === true || client === 'mobile') {
      internetNetwork = 'TOR';
    }

    filteredProxies = lnproxies
      .filter((node) => node.relayType === internetNetwork)
      .filter((node) => node.network === bitcoinNetwork);
  }, [settings]);

  // if "use lnproxy" checkbox is enabled, but there are no matching proxies, enter error state
  useEffect(() => {
    setNoMatchingLnProxies('');
    if (filteredProxies.length === 0) {
      setNoMatchingLnProxies(
        t(`No proxies available for {{bitcoinNetwork}} bitcoin over {{internetNetwork}}`, {
          bitcoinNetwork: settings?.network ?? 'mainnet',
          internetNetwork: t(internetNetwork),
        }),
      );
    }
  }, [lightning.useLnproxy]);

  const fetchLnproxy = function (): void {
    setLoadingLnproxy(true);
    const body: { invoice: string; description: string; routing_msat?: string } = {
      invoice: lightning.lnproxyInvoice,
      description: '',
    };
    if (lightning.lnproxyBudgetSats > 0) {
      body.routing_msat = String(lightning.lnproxyBudgetSats * 1000);
    }
    apiClient
      .post(filteredProxies[lightning.lnproxyServer].url, '', body)
      .then((data) => {
        if (data.reason !== undefined) {
          setLightning({ ...lightning, badLnproxy: data.reason });
        } else if (data.proxy_invoice !== undefined) {
          setLightning({ ...lightning, invoice: data.proxy_invoice, badLnproxy: '' });
        } else {
          setLightning({ ...lightning, badLnproxy: 'Unknown lnproxy response' });
        }
      })
      .catch(() => {
        setLightning({ ...lightning, badLnproxy: 'Lnproxy server uncaught error' });
      })
      .finally(() => {
        setLoadingLnproxy(false);
      });
  };

  const handleAdvancedOptions = function (checked: boolean): void {
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

  const onProxyBudgetChange = function (e: React.ChangeEventHandler<HTMLInputElement>): void {
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

  const onRoutingBudgetChange = function (e: React.ChangeEventHandler<HTMLInputElement>): void {
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

  const lnProxyBudgetHelper = function (): string {
    let text = '';
    if (lightning.lnproxyBudgetSats < 0) {
      text = 'Must be positive';
    } else if (lightning.lnproxyBudgetPPM > 10000) {
      text = 'Too high! (That is more than 1%)';
    }
    return text;
  };

  const routingBudgetHelper = function (): string {
    let text = '';
    if (lightning.routingBudgetSats < 0) {
      text = 'Must be positive';
    } else if (lightning.routingBudgetPPM > 10000) {
      text = 'Too high! (That is more than 1%)';
    }
    return text;
  };

  const handlePasteProxy = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    setLightning({ ...lightning, lnproxyInvoice: pastedData ?? '' });

    setTimeout(() => {
      const input = document.getElementById('proxy-textfield') as HTMLInputElement;
      input.setSelectionRange(0, 0);
    }, 0);
  };

  const handlePasteInvoice = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    setLightning({ ...lightning, invoice: pastedData ?? '' });

    setTimeout(() => {
      const input = document.getElementById('invoice-textfield') as HTMLInputElement;
      input.setSelectionRange(0, 0);
    }, 0);
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
            handleAdvancedOptions(e.target.checked);
          }}
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
                    error={routingBudgetHelper() !== ''}
                    helperText={routingBudgetHelper()}
                    label={t('Routing Budget')}
                    required={true}
                    value={
                      lightning.routingBudgetUnit === 'PPM'
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
                                  lightning.routingBudgetUnit === 'PPM' ? 'Sats' : 'PPM',
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
                        onChange={(e, checked) => {
                          setLightning({
                            ...lightning,
                            useLnproxy: checked,
                            invoice: checked ? '' : lightning.invoice,
                          });
                        }}
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
                        <FormControl error={noMatchingLnProxies !== ''}>
                          <InputLabel id='select-label'>{t('Server')}</InputLabel>
                          <Select
                            sx={{ width: '14em' }}
                            label={t('Server')}
                            labelId='select-label'
                            value={lightning.lnproxyServer}
                            onChange={(e) => {
                              setLightning({ ...lightning, lnproxyServer: Number(e.target.value) });
                            }}
                          >
                            {filteredProxies.map((lnproxyServer, index) => (
                              <MenuItem key={index} value={index}>
                                <Typography>{lnproxyServer.name}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                          {noMatchingLnProxies !== '' ? (
                            <FormHelperText>{t(noMatchingLnProxies)}</FormHelperText>
                          ) : (
                            <></>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item>
                        <TextField
                          sx={{ width: '14em' }}
                          disabled={!lightning.useLnproxy}
                          error={lnProxyBudgetHelper() !== ''}
                          helperText={lnProxyBudgetHelper()}
                          label={t('Proxy Budget')}
                          value={
                            lightning.lnproxyBudgetUnit === 'PPM'
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
                                        lightning.lnproxyBudgetUnit === 'PPM' ? 'Sats' : 'PPM',
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
                    onClick={() => {
                      systemClient.copyToClipboard(
                        lightning.useLnproxy
                          ? String(lightning.lnproxyAmount)
                          : String(lightning.amount),
                      );
                    }}
                  >
                    <ContentCopy sx={{ width: '0.8em' }} />
                  </IconButton>
                </Tooltip>
              </div>
            </Grid>

            <Grid item>
              {lightning.useLnproxy ? (
                <TextField
                  id='proxy-textfield'
                  fullWidth
                  disabled={!lightning.useLnproxy}
                  error={lightning.badLnproxy !== ''}
                  helperText={lightning.badLnproxy !== '' ? t(lightning.badLnproxy) : ''}
                  label={t('Invoice to wrap')}
                  required
                  value={lightning.lnproxyInvoice}
                  variant='outlined'
                  maxRows={1}
                  onChange={(e) => {
                    setLightning({ ...lightning, lnproxyInvoice: e.target.value ?? '' });
                  }}
                  onPaste={(e) => handlePasteProxy(e)}
                />
              ) : (
                <></>
              )}
              <TextField
                id='invoice-textfield'
                fullWidth
                sx={lightning.useLnproxy ? { borderRadius: 0 } : {}}
                disabled={lightning.useLnproxy}
                error={lightning.badInvoice !== ''}
                helperText={lightning.badInvoice !== '' ? t(lightning.badInvoice) : ''}
                label={lightning.useLnproxy ? t('Wrapped invoice') : t('Payout Lightning Invoice')}
                required
                value={lightning.invoice}
                variant={lightning.useLnproxy ? 'filled' : 'standard'}
                multiline={!lightning.useLnproxy}
                maxRows={1}
                onChange={(e) => {
                  setLightning({ ...lightning, invoice: e.target.value ?? '' });
                }}
                onPaste={(e) => handlePasteInvoice(e, false)}
              />
            </Grid>

            <Grid item style={{ marginTop: 16 }}>
              {lightning.useLnproxy ? (
                <LoadingButton
                  loading={loadingLnproxy}
                  disabled={
                    lightning.lnproxyInvoice.length < 20 ||
                    noMatchingLnProxies !== '' ||
                    lightning.badLnproxy !== ''
                  }
                  onClick={fetchLnproxy}
                  variant='outlined'
                  color='primary'
                  size='large'
                >
                  {t('Wrap')}
                </LoadingButton>
              ) : (
                <></>
              )}
              <LoadingButton
                loading={loading}
                disabled={lightning.invoice.length < 20 || lightning.badInvoice !== ''}
                onClick={() => {
                  onClickSubmit(lightning.invoice);
                }}
                variant='outlined'
                color='primary'
                size='large'
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
