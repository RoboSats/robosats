import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAdornment,
  LinearProgress,
  ButtonGroup,
  Slider,
  SliderThumb,
  Switch,
  Tooltip,
  Button,
  Grid,
  Typography,
  TextField,
  Select,
  FormHelperText,
  MenuItem,
  FormControl,
  Radio,
  FormControlLabel,
  RadioGroup,
  Box,
  useTheme,
  Collapse,
} from '@mui/material';
import { LimitList } from '../models/Limit.model';
import Maker from '../models/Maker.model';

import RangeSlider from './RangeSlider';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useHistory } from 'react-router-dom';
import { StoreTokenDialog, NoRobotDialog } from './Dialogs';
import { apiClient } from '../services/api';

import FlagWithProps from './FlagWithProps';
import AutocompletePayments from './AutocompletePayments';
import currencyDict from '../../static/assets/currencies.json';

import { SelfImprovement, Lock, HourglassTop } from '@mui/icons-material';

import { getCookie } from '../utils/cookies';
import { pn } from '../utils/prettyNumbers';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  limits: LimitList;
  loadingLimits: boolean;
  pricingMethods: boolean;
  maker: Maker;
  type: number;
  currency: number;
  setAppState: (state: object) => void;
  setMaker: (state: object) => void;
}

const MakerForm = ({
  limits,
  loadingLimits,
  pricingMethods,
  currency,
  type,
  setAppState,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();
  const [maker, setMaker] = useState<Maker>({
    isExplicit: false,
    amount: '',
    paymentMethod: new Array(),
    paymentMethodText: 'Not specified',
    badPaymentMethod: false,
    premium: '',
    satoshis: '',
    publicExpiryTime: new Date(0, 0, 0, 23, 59),
    publicDuration: 86340,
    escrowExpiryTime: new Date(0, 0, 0, 3, 0),
    escrowDuration: 10800,
    bondSize: 3,
    amountRange: false,
    minAmount: '',
    maxAmount: '',
    badPremiumText: '',
    badSatoshisText: '',
  });
  const [badRequest, setBadRequest] = useState<string | null>(null);
  const [advancedOptions, setAdvancedOptions] = useState<boolean>(false);
  const [amountLimits, setAmountLimits] = useState<number[]>([1, 1000]);
  const [satoshisLimits, setSatoshisLimits] = useState<number[]>([20000, 4000000]);
  const [currentPrice, setCurrentPrice] = useState<number | string>('...');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  const maxRangeAmountMultiple = 7.8;
  const minRangeAmountMultiple = 1.6;

  useEffect(() => {
    if (Object.keys(limits).length === 0) {
      setAppState({ loadingLimits: true });
      apiClient.get('/api/limits/').then((data) => {
        setAppState({ limits: data, loadingLimits: false });
        updateAmountLimits(data, currency, maker.premium);
        updateCurrentPrice(data, currency, maker.premium);
        updateSatoshisLimits(data);
      });
    } else {
      updateAmountLimits(limits, currency, maker.premium);
      updateCurrentPrice(limits, currency, maker.premium);
      updateSatoshisLimits(limits);

      apiClient
        .get('/api/limits/')
        .then((data) => setAppState({ limits: data, loadingLimits: false }));
    }
  }, []);

  const updateAmountLimits = function (limits: LimitList, currency: number, premium: number) {
    const index = currency === 0 ? 1 : currency;
    var minAmountLimit: number = limits[index].min_amount * (1 + premium / 100);
    var maxAmountLimit: number = limits[index].max_amount * (1 + premium / 100);

    // times 1.1 to allow a bit of margin with respect to the backend minimum
    minAmountLimit = minAmountLimit * 1.1;
    // times 0.98 to allow a bit of margin with respect to the backend minimum
    maxAmountLimit = maxAmountLimit * 0.98;
    setAmountLimits([minAmountLimit, maxAmountLimit]);
  };

  const updateSatoshisLimits = function (limits: LimitList) {
    var minAmount: number = limits[1000].min_amount * 100000000;
    var maxAmount: number = limits[1000].max_amount * 100000000;
    setSatoshisLimits([minAmount, maxAmount]);
  };

  const updateCurrentPrice = function (limits: LimitList, currency: number, premium: number) {
    const index = currency === 0 ? 1 : currency;
    let price = '...';
    if (maker.is_explicit && maker.amount > 0 && maker.satoshis > 0) {
      price = maker.amount / (maker.satoshis / 100000000);
    } else if (!maker.is_explicit) {
      price = limits[index].price * (1 + premium / 100);
    }
    setCurrentPrice(parseFloat(Number(price).toPrecision(5)));
  };

  const handleCurrencyChange = function (newCurrency: number) {
    const currencyCode: string = currencyDict[newCurrency];
    setCurrencyCode(currencyCode);
    setAppState({
      currency: newCurrency,
      bookCurrencyCode: currencyCode,
    });
    updateAmountLimits(limits, newCurrency, maker.premium);
    updateCurrentPrice(limits, newCurrency, maker.premium);
    if (advancedOptions) {
      setMaker({
        ...maker,
        minAmount: parseFloat(Number(limits[newCurrency].max_amount * 0.25).toPrecision(2)),
        maxAmount: parseFloat(Number(limits[newCurrency].max_amount * 0.75).toPrecision(2)),
      });
    }
  };

  const handlePaymentMethodChange = function (paymentArray: string[], paymentString: string) {
    setMaker({
      ...maker,
      paymentMethod: paymentArray,
      paymentMethodText: paymentString.substring(0, 53),
      badPaymentMethod: paymentString.length > 50,
    });
  };

  const handleMinAmountChange = function (e) {
    setMaker({
      ...maker,
      minAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
    });
  };

  const handleMaxAmountChange = function (e) {
    setMaker({
      ...maker,
      maxAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
    });
  };

  const handlePremiumChange = function (e: object) {
    const max = 999;
    const min = -100;
    const newPremium = Math.floor(e.target.value * Math.pow(10, 2)) / Math.pow(10, 2);
    let premium: number = newPremium;
    let badPremiumText: string = '';
    if (newPremium > 999) {
      badPremiumText = t('Must be less than {{max}}%', { max });
      premium = 999;
    } else if (newPremium <= -100) {
      badPremiumText = t('Must be more than {{min}}%', { min });
      premium = -99.99;
    }
    updateCurrentPrice(limits, currency, premium);
    updateAmountLimits(limits, currency, premium);
    setMaker({
      ...maker,
      premium,
      badPremiumText,
    });
  };

  const handleSatoshisChange = function (e: object) {
    const newSatoshis = e.target.value;
    let badSatoshisText: string = '';
    let satoshis: string = newSatoshis;
    if (newSatoshis > satoshisLimits[1]) {
      badSatoshisText = t('Must be less than {{maxSats}', { maxSats: pn(satoshisLimits[1]) });
      satoshis = satoshisLimits[1];
    }
    if (newSatoshis < satoshisLimits[0]) {
      badSatoshisText = t('Must be more than {{minSats}}', { minSats: pn(satoshisLimits[0]) });
      satoshis = satoshisLimits[0];
    }

    setMaker({
      ...maker,
      satoshis,
      badSatoshisText,
    });
  };

  const handleClickRelative = function () {
    setMaker({
      ...maker,
      isExplicit: false,
    });
  };

  const handleClickExplicit = function () {
    if (!maker.advancedOptions) {
      setMaker({
        ...maker,
        isExplicit: true,
      });
    }
  };

  const handleSubmit = function () {
    const body = {
      type: type == 0 ? 1 : 0,
      currency: currency == 0 ? 1 : currency,
      amount: advancedOptions ? null : maker.amount,
      has_range: advancedOptions,
      min_amount: advancedOptions ? maker.minAmount : null,
      max_amount: advancedOptions ? maker.maxAmount : null,
      payment_method: maker.paymentMethodText === '' ? 'Not specified' : maker.paymentMethodText,
      is_explicit: maker.isExplicit,
      premium: maker.isExplicit ? null : maker.premium == '' ? 0 : maker.premium,
      satoshis: maker.isExplicit ? maker.satoshis : null,
      public_duration: maker.publicDuration,
      escrow_duration: maker.escrowDuration,
      bond_size: maker.bondSize,
    };
    console.log(body);
    apiClient.post('/api/make/', body).then((data: object) => {
      setBadRequest(data.bad_request);
      data.id ? history.push('/order/' + data.id) : '';
    });
    // this.setState({ openStoreToken: false });
  };

  const handleChangePublicDuration = function (date: Date) {
    const d = new Date(date);
    const hours: number = d.getHours();
    const minutes: number = d.getMinutes();

    const total_secs: number = hours * 60 * 60 + minutes * 60;

    setMaker({
      ...maker,
      publicExpiryTime: date,
      publicDuration: total_secs,
    });
  };

  const handleChangeEscrowDuration = function (date: Date) {
    const d = new Date(date);
    const hours: number = d.getHours();
    const minutes: number = d.getMinutes();

    const total_secs: number = hours * 60 * 60 + minutes * 60;

    setMaker({
      ...maker,
      escrowExpiryTime: date,
      escrowDuration: total_secs,
    });
  };

  const RangeThumbComponent = function (props: object) {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <span className='range-bar' />
        <span className='range-bar' />
        <span className='range-bar' />
      </SliderThumb>
    );
  };

  const handleClickAdvanced = function () {
    if (advancedOptions) {
      handleClickRelative();
    } else {
      resetRange();
    }

    setAdvancedOptions(!advancedOptions);
  };

  const minAmountError = function () {
    return (
      maker.minAmount < amountLimits[0] ||
      maker.maxAmount < maker.minAmount ||
      maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
      maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount
    );
  };

  const maxAmountError = function () {
    return (
      maker.maxAmount > amountLimits[1] ||
      maker.maxAmount < maker.minAmount ||
      maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
      maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount
    );
  };

  const resetRange = function () {
    const index = currency === 0 ? 1 : currency;
    const minAmount = maker.amount
      ? parseFloat((maker.amount / 2).toPrecision(2))
      : parseFloat(Number(limits[index].max_amount * 0.25).toPrecision(2));
    const maxAmount = maker.amount
      ? parseFloat(maker.amount)
      : parseFloat(Number(limits[index].max_amount * 0.75).toPrecision(2));

    setMaker({
      ...maker,
      minAmount,
      maxAmount,
    });
  };

  const handleRangeAmountChange = function (e: any, newValue, activeThumb: number) {
    let minAmount = e.target.value[0];
    let maxAmount = e.target.value[1];

    if (minAmount > amountLimits[1] / minRangeAmountMultiple) {
      minAmount = amountLimits[1] / minRangeAmountMultiple;
    }
    if (maxAmount < minRangeAmountMultiple * amountLimits[0]) {
      maxAmount = minRangeAmountMultiple * amountLimits[0];
    }

    if (minAmount > maxAmount / minRangeAmountMultiple) {
      if (activeThumb === 0) {
        maxAmount = minRangeAmountMultiple * minAmount;
      } else {
        minAmount = maxAmount / minRangeAmountMultiple;
      }
    } else if (minAmount < maxAmount / maxRangeAmountMultiple) {
      if (activeThumb === 0) {
        maxAmount = maxRangeAmountMultiple * minAmount;
      } else {
        minAmount = maxAmount / maxRangeAmountMultiple;
      }
    }

    setMaker({
      ...maker,
      minAmount: parseFloat(Number(minAmount).toPrecision(minAmount < 100 ? 2 : 3)),
      maxAmount: parseFloat(Number(maxAmount).toPrecision(maxAmount < 100 ? 2 : 3)),
    });
  };

  const disableSubmit = function () {
    return (
      type == null ||
      (maker.amount == null && (advancedOptions == false || loadingLimits)) ||
      (advancedOptions && (minAmountError() || maxAmountError())) ||
      (maker.amount <= 0 && !advancedOptions) ||
      (maker.isExplicit && (maker.badSatoshisText != '' || satoshis == '')) ||
      (!maker.isExplicit && maker.badPremiumText != '')
    );
  };

  const SummaryText = function () {
    return (
      <Typography
        component='h2'
        variant='subtitle2'
        color={disableSubmit() ? 'text.secondary' : 'text.primary'}
      >
        <div>
          {type == null ? t('Order for ') : type == 1 ? t('Buy order for ') : t('Sell order for ')}
          {advancedOptions && maker.minAmount != ''
            ? pn(maker.minAmount) + '-' + pn(maker.maxAmount)
            : pn(maker.amount)}
          {' ' + currencyCode}
          {maker.isExplicit
            ? t(' of {{satoshis}} Satoshis', { satoshis: pn(maker.satoshis) })
            : maker.premium == 0
            ? t(' at market price')
            : maker.premium > 0
            ? t(' at a {{premium}}% premium', { premium: maker.premium })
            : t(' at a {{discount}}% discount', { discount: -maker.premium })}
        </div>
      </Typography>
    );
  };
  return (
    <Box>
      <Collapse in={loadingLimits}>
        <div style={{ display: loadingLimits === true ? '' : 'none' }}>
          <LinearProgress />
        </div>
      </Collapse>
      <Collapse in={!loadingLimits}>
        <Grid container justifyContent='flex-end' spacing={0}>
          <Grid item>
            <Tooltip enterTouchDelay={0} placement='top' title={t('Enable advanced options')}>
              <div
                style={{
                  display: 'flex',
                  width: '4em',
                  height: '1.1em',
                }}
              >
                <Switch
                  size='small'
                  disabled={loadingLimits}
                  checked={advancedOptions}
                  onChange={handleClickAdvanced}
                />
                <SelfImprovement sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </Collapse>

      <Grid container spacing={1} justifyContent='center' alignItems='center'>
        <Grid item xs={12}>
          <FormControl component='fieldset'>
            <FormHelperText sx={{ textAlign: 'center' }}>
              {t('Buy or Sell Bitcoin?')}
            </FormHelperText>
            <div style={{ textAlign: 'center' }}>
              <ButtonGroup>
                <Button
                  size={advancedOptions ? 'small' : 'large'}
                  variant='contained'
                  onClick={() =>
                    setAppState({
                      type: 1,
                    })
                  }
                  disableElevation={type == 1}
                  sx={{
                    backgroundColor: type == 1 ? 'primary.main' : 'background.paper',
                    color: type == 1 ? 'background.paper' : 'text.secondary',
                    ':hover': {
                      color: 'background.paper',
                    },
                  }}
                >
                  {t('Buy')}
                </Button>
                <Button
                  size={advancedOptions ? 'small' : 'large'}
                  variant='contained'
                  onClick={() =>
                    setAppState({
                      type: 0,
                    })
                  }
                  disableElevation={type == 0}
                  color='secondary'
                  sx={{
                    backgroundColor: type == 0 ? 'secondary.main' : 'background.paper',
                    color: type == 0 ? 'background.secondary' : 'text.secondary',
                    ':hover': {
                      color: 'background.paper',
                    },
                  }}
                >
                  {t('Sell')}
                </Button>
              </ButtonGroup>
            </div>
          </FormControl>
        </Grid>

        <Grid item>
          <Collapse in={advancedOptions}>
            <Grid item xs={12}>
              <Box
                sx={{
                  padding: '0.5em',
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderRadius: '4px',
                  borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
                  },
                }}
              >
                <Grid container direction='column' alignItems='center' spacing={0.5}>
                  <Grid item sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography
                      sx={{
                        width: `${t('From').length * 0.56 + 0.6}em`,
                        textAlign: 'left',
                        color: 'text.secondary',
                      }}
                      variant='caption'
                    >
                      {t('From')}
                    </Typography>
                    <TextField
                      sx={{ backgroundColor: 'background.paper', borderRadius: '4px' }}
                      variant='standard'
                      type='number'
                      size='small'
                      value={maker.minAmount}
                      onChange={handleMinAmountChange}
                      error={minAmountError()}
                      sx={{
                        width: `${maker.minAmount.toString().length * 0.56}em`,
                        minWidth: '0.56em',
                        maxWidth: '2.8em',
                      }}
                    />
                    <Typography
                      sx={{
                        width: `${t('to').length * 0.56 + 0.6}em`,
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                      variant='caption'
                    >
                      {t('to')}
                    </Typography>
                    <TextField
                      sx={{ backgroundColor: 'background.paper', borderRadius: '4px' }}
                      variant='standard'
                      size='small'
                      type='number'
                      value={maker.maxAmount}
                      onChange={handleMaxAmountChange}
                      error={maxAmountError()}
                      sx={{
                        width: `${maker.maxAmount.toString().length * 0.56}em`,
                        minWidth: '0.56em',
                        maxWidth: '3.36em',
                      }}
                    />
                    <div style={{ width: '0.5em' }} />
                    <Select
                      sx={{ width: '3.8em' }}
                      variant='standard'
                      size='small'
                      required={true}
                      inputProps={{
                        style: { textAlign: 'center' },
                      }}
                      value={currency == 0 ? 1 : currency}
                      renderValue={() => currencyCode}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                    >
                      {Object.entries(currencyDict).map(([key, value]) => (
                        <MenuItem key={key} value={parseInt(key)}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <FlagWithProps code={value} />
                            {' ' + value}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>

                  <Grid
                    item
                    sx={{
                      width: `calc(100% - ${Math.log10(amountLimits[1] * 0.65) + 2}em)`,
                    }}
                  >
                    <RangeSlider
                      disableSwap={true}
                      disabled={!advancedOptions || loadingLimits}
                      value={[Number(maker.minAmount), Number(maker.maxAmount)]}
                      step={(amountLimits[1] - amountLimits[0]) / 5000}
                      valueLabelDisplay='auto'
                      components={{ Thumb: RangeThumbComponent }}
                      componentsProps={{
                        thumb: { style: { backgroundColor: theme.palette.background.paper } },
                      }}
                      valueLabelFormat={(x) =>
                        pn(parseFloat(Number(x).toPrecision(x < 100 ? 2 : 3))) + ' ' + currencyCode
                      }
                      marks={
                        limits == null
                          ? false
                          : [
                              {
                                value: amountLimits[0] * 1.01,
                                label: `${pn(
                                  parseFloat(Number(amountLimits[0] * 1.01).toPrecision(3)),
                                )} ${currencyCode}`,
                              },
                              {
                                value: amountLimits[1] * 0.99,
                                label: `${pn(
                                  parseFloat(Number(amountLimits[1] * 0.99).toPrecision(3)),
                                )} ${currencyCode}`,
                              },
                            ]
                      }
                      min={amountLimits[0] * 1.01}
                      max={amountLimits[1] * 0.99}
                      onChange={handleRangeAmountChange}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Collapse>
          <Collapse in={!advancedOptions}>
            <Grid item>
              <Grid container alignItems='stretch' style={{ display: 'flex' }}>
                <Grid item xs={6}>
                  <Tooltip
                    placement='top'
                    enterTouchDelay={500}
                    enterDelay={700}
                    enterNextDelay={2000}
                    title={t('Amount of fiat to exchange for bitcoin')}
                  >
                    <TextField
                      fullWidth
                      disabled={maker.amountRange}
                      variant={maker.amountRange ? 'filled' : 'outlined'}
                      error={
                        maker.amount != '' &&
                        (maker.amount < amountLimits[0] || maker.amount > amountLimits[1])
                      }
                      helperText={
                        maker.amount < amountLimits[0] && maker.amount != ''
                          ? t('Must be more than {{minAmount}}', {
                              minAmount: pn(parseFloat(amountLimits[0].toPrecision(2))),
                            })
                          : maker.amount > amountLimits[1] && maker.amount != ''
                          ? t('Must be less than {{maxAmount}}', {
                              maxAmount: pn(parseFloat(amountLimits[1].toPrecision(2))),
                            })
                          : null
                      }
                      label={t('Amount')}
                      required={true}
                      value={maker.amount}
                      type='number'
                      inputProps={{
                        min: 0,
                        style: {
                          textAlign: 'center',
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: '4px',
                        },
                      }}
                      onChange={(e) => setMaker({ ...maker, amount: e.target.value })}
                    />
                  </Tooltip>
                </Grid>

                <Grid item xs={6}>
                  <Select
                    fullWidth
                    sx={{ backgroundColor: theme.palette.background.paper, borderRadius: '4px' }}
                    required={true}
                    inputProps={{
                      style: { textAlign: 'center' },
                    }}
                    value={currency == 0 ? 1 : currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    {Object.entries(currencyDict).map(([key, value]) => (
                      <MenuItem key={key} value={parseInt(key)}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <FlagWithProps code={value} />
                          {' ' + value}
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>

        <Grid item xs={12}>
          <AutocompletePayments
            onAutocompleteChange={handlePaymentMethodChange}
            optionsType={currency == 1000 ? 'swap' : 'fiat'}
            error={maker.badPaymentMethod}
            helperText={maker.badPaymentMethod ? t('Must be shorter than 65 characters') : ''}
            label={currency == 1000 ? t('Swap Destination(s)') : t('Fiat Payment Method(s)')}
            tooltipTitle={t(
              'Enter your preferred fiat payment methods. Fast methods are highly recommended.',
            )}
            listHeaderText={t('You can add new methods')}
            addNewButtonText={t('Add New')}
          />
        </Grid>

        {!advancedOptions && pricingMethods ? (
          <Grid item xs={12}>
            <Box
              sx={{
                padding: '0.5em',
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderRadius: '4px',
                borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
                },
              }}
            >
              <FormControl component='fieldset'>
                <FormHelperText sx={{ textAlign: 'center', position: 'relative', top: '0.2em' }}>
                  {t('Choose a Pricing Method')}
                </FormHelperText>
                <RadioGroup row defaultValue='relative'>
                  <Tooltip
                    placement='top'
                    enterTouchDelay={0}
                    enterDelay={1000}
                    enterNextDelay={2000}
                    title={t('Let the price move with the market')}
                  >
                    <FormControlLabel
                      value='relative'
                      control={<Radio color='primary' />}
                      label={t('Relative')}
                      labelPlacement='end'
                      onClick={handleClickRelative}
                    />
                  </Tooltip>
                  <Tooltip
                    placement='top'
                    enterTouchDelay={0}
                    enterDelay={1000}
                    enterNextDelay={2000}
                    title={t('Set a fix amount of satoshis')}
                  >
                    <FormControlLabel
                      disabled={advancedOptions}
                      value='explicit'
                      control={<Radio color='secondary' />}
                      label={t('Exact')}
                      labelPlacement='end'
                      onClick={handleClickExplicit}
                    />
                  </Tooltip>
                </RadioGroup>
              </FormControl>
            </Box>
          </Grid>
        ) : null}
        <Grid item xs={12}>
          <div style={{ display: maker.isExplicit ? '' : 'none' }}>
            <TextField
              fullWidth
              label={t('Satoshis')}
              error={maker.badSatoshisText != ''}
              helperText={maker.badSatoshisText === '' ? null : maker.badSatoshisText}
              type='number'
              required={true}
              value={maker.satoshis}
              inputProps={{
                min: satoshisLimits[0],
                max: satoshisLimits[1],
                style: {
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '4px',
                },
              }}
              onChange={handleSatoshisChange}
            />
          </div>
          <div style={{ display: maker.isExplicit ? 'none' : '' }}>
            <TextField
              fullWidth
              error={maker.badPremiumText != ''}
              helperText={maker.badPremiumText === '' ? null : maker.badPremiumText}
              label={t('Premium over Market (%)')}
              type='number'
              value={maker.premium}
              inputProps={{
                min: -100,
                max: 999,
                style: {
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '4px',
                },
              }}
              onChange={handlePremiumChange}
            />
          </div>
        </Grid>
        <Grid item>
          <Collapse in={advancedOptions}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={DateFnsUtils}>
                  <TimePicker
                    ampm={false}
                    openTo='hours'
                    views={['hours', 'minutes']}
                    inputFormat='HH:mm'
                    mask='__:__'
                    components={{
                      OpenPickerIcon: HourglassTop,
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <HourglassTop />
                        </InputAdornment>
                      ),
                      style: {
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '4px',
                      },
                    }}
                    renderInput={(props) => <TextField {...props} />}
                    label={t('Public Duration (HH:mm)')}
                    value={maker.publicExpiryTime}
                    onChange={handleChangePublicDuration}
                    minTime={new Date(0, 0, 0, 0, 10)}
                    maxTime={new Date(0, 0, 0, 23, 59)}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={DateFnsUtils}>
                  <TimePicker
                    ampm={false}
                    openTo='hours'
                    views={['hours', 'minutes']}
                    inputFormat='HH:mm'
                    mask='__:__'
                    components={{
                      OpenPickerIcon: HourglassTop,
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <HourglassTop />
                        </InputAdornment>
                      ),
                      style: {
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '4px',
                      },
                    }}
                    renderInput={(props) => <TextField {...props} />}
                    label={t('Escrow Deposit Time-Out (HH:mm)')}
                    value={maker.escrowExpiryTime}
                    onChange={handleChangeEscrowDuration}
                    minTime={new Date(0, 0, 0, 1, 0)}
                    maxTime={new Date(0, 0, 0, 8, 0)}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    padding: '0.5em',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderRadius: '4px',
                    borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
                    '&:hover': {
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
                    },
                  }}
                >
                  <Grid container direction='column' alignItems='center' spacing={0.5}>
                    <Grid
                      item
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Tooltip
                        enterDelay={800}
                        enterTouchDelay={0}
                        placement='top'
                        title={t('Set the skin-in-the-game, increase for higher safety assurance')}
                      >
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            flexWrap: 'wrap',
                          }}
                        >
                          {t('Fidelity Bond Size')}{' '}
                          <Lock sx={{ height: '0.8em', width: '0.8em' }} />
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid item sx={{ width: 'calc(100% - 2em)' }}>
                      <Slider
                        sx={{ width: '100%', align: 'center' }}
                        aria-label='Bond Size (%)'
                        defaultValue={3}
                        value={maker.bondSize}
                        valueLabelDisplay='auto'
                        valueLabelFormat={(x: string) => x + '%'}
                        step={0.25}
                        marks={[
                          { value: 2, label: '2%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' },
                          { value: 15, label: '15%' },
                        ]}
                        min={2}
                        max={15}
                        onChange={(e) => setMaker({ ...maker, bondSize: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>

        <Grid item xs={12}>
          {badRequest ? (
            <Typography component='h2' variant='subtitle2' color='secondary'>
              {badRequest} <br />
            </Typography>
          ) : (
            ''
          )}
          <SummaryText />
        </Grid>

        <Grid item xs={12}>
          {/* conditions to disable the make button */}
          {disableSubmit() ? (
            <Tooltip enterTouchDelay={0} title={t('You must fill the form correctly')}>
              <div>
                <Button disabled color='primary' variant='contained'>
                  {t('Submit Order')}
                </Button>
              </div>
            </Tooltip>
          ) : (
            <Button
              color='primary'
              variant='contained'
              onClick={handleSubmit}
              // onClick={
              //    copiedToken
              //     ? this.handleCreateOfferButtonPressed
              //     : () => this.setState({ openStoreToken: true })
              // }
            >
              {t('Submit Order')}
            </Button>
          )}

          <Collapse in={!loadingLimits}>
            <Tooltip
              placement='top'
              enterTouchDelay={0}
              enterDelay={1000}
              enterNextDelay={2000}
              title={
                maker.isExplicit
                  ? t('Your order fixed exchange rate')
                  : t("Your order's current exchange rate. Rate will move with the market.")
              }
            >
              <Typography variant='caption' color='text.secondary'>
                {(maker.isExplicit ? t('Order rate:') : t('Order current rate:')) +
                  ` ${pn(currentPrice)} ${currencyCode}/BTC`}
              </Typography>
            </Tooltip>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MakerForm;
