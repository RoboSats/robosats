import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAdornment,
  LinearProgress,
  ButtonGroup,
  Slider,
  Switch,
  Tooltip,
  Button,
  Checkbox,
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
  IconButton,
} from '@mui/material';

import { LimitList, defaultMaker } from '../../models';

import { LocalizationProvider, MobileTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ConfirmationDialog } from '../Dialogs';
import { apiClient } from '../../services/api';

import { FlagWithProps } from '../Icons';
import AutocompletePayments from './AutocompletePayments';
import AmountRange from './AmountRange';
import currencyDict from '../../../static/assets/currencies.json';
import { amountToString, computeSats, pn } from '../../utils';

import { SelfImprovement, Lock, HourglassTop, DeleteSweep, Edit } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { AppContext, AppContextProps } from '../../contexts/AppContext';

interface MakerFormProps {
  disableRequest?: boolean;
  pricingMethods?: boolean;
  collapseAll?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
  submitButtonLabel?: string;
  onOrderCreated?: (id: number) => void;
  hasRobot?: boolean;
}

const MakerForm = ({
  pricingMethods = false,
  disableRequest = false,
  collapseAll = false,
  onSubmit = () => {},
  onReset = () => {},
  submitButtonLabel = 'Create Order',
  onOrderCreated = () => null,
  hasRobot = true,
}: MakerFormProps): JSX.Element => {
  const { fav, setFav, limits, fetchLimits, info, maker, setMaker, setPage, baseUrl } =
    useContext<AppContextProps>(AppContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const [badRequest, setBadRequest] = useState<string | null>(null);
  const [amountLimits, setAmountLimits] = useState<number[]>([1, 1000]);
  const [satoshisLimits, setSatoshisLimits] = useState<number[]>([20000, 4000000]);
  const [currentPrice, setCurrentPrice] = useState<number | string>('...');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  const [openDialogs, setOpenDialogs] = useState<boolean>(false);
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  const maxRangeAmountMultiple = 7.8;
  const minRangeAmountMultiple = 1.6;
  const amountSafeThresholds = [1.03, 0.98];

  useEffect(() => {
    setCurrencyCode(currencyDict[fav.currency == 0 ? 1 : fav.currency]);
    if (Object.keys(limits.list).length === 0) {
      fetchLimits().then((data) => {
        updateAmountLimits(data, fav.currency, maker.premium);
        updateCurrentPrice(data, fav.currency, maker.premium);
        updateSatoshisLimits(data);
      });
    } else {
      updateAmountLimits(limits.list, fav.currency, maker.premium);
      updateCurrentPrice(limits.list, fav.currency, maker.premium);
      updateSatoshisLimits(limits.list);

      fetchLimits();
    }
  }, []);

  const updateAmountLimits = function (limitList: LimitList, currency: number, premium: number) {
    const index = currency == 0 ? 1 : currency;
    let minAmountLimit: number = limitList[index].min_amount * (1 + premium / 100);
    let maxAmountLimit: number = limitList[index].max_amount * (1 + premium / 100);

    // apply thresholds to ensure good request
    minAmountLimit = minAmountLimit * amountSafeThresholds[0];
    maxAmountLimit = maxAmountLimit * amountSafeThresholds[1];
    setAmountLimits([minAmountLimit, maxAmountLimit]);
  };

  const updateSatoshisLimits = function (limitList: LimitList) {
    const minAmount: number = limitList[1000].min_amount * 100000000;
    const maxAmount: number = limitList[1000].max_amount * 100000000;
    setSatoshisLimits([minAmount, maxAmount]);
  };

  const updateCurrentPrice = function (limitsList: LimitList, currency: number, premium: number) {
    const index = currency == 0 ? 1 : currency;
    let price = '...';
    if (maker.isExplicit && maker.amount > 0 && maker.satoshis > 0) {
      price = maker.amount / (maker.satoshis / 100000000);
    } else if (!maker.is_explicit) {
      price = limitsList[index].price * (1 + premium / 100);
    }
    setCurrentPrice(parseFloat(Number(price).toPrecision(5)));
  };

  const handleCurrencyChange = function (newCurrency: number) {
    const currencyCode: string = currencyDict[newCurrency];
    setCurrencyCode(currencyCode);
    setFav({
      ...fav,
      currency: newCurrency,
      mode: newCurrency === 1000 ? 'swap' : 'fiat',
    });
    updateAmountLimits(limits.list, newCurrency, maker.premium);
    updateCurrentPrice(limits.list, newCurrency, maker.premium);
    if (maker.advancedOptions) {
      setMaker({
        ...maker,
        minAmount: parseFloat(Number(limits.list[newCurrency].max_amount * 0.25).toPrecision(2)),
        maxAmount: parseFloat(Number(limits.list[newCurrency].max_amount * 0.75).toPrecision(2)),
      });
    }
  };

  const handlePaymentMethodChange = function (paymentArray: string[]) {
    let str = '';
    const arrayLength = paymentArray.length;
    for (let i = 0; i < arrayLength; i++) {
      str += paymentArray[i].name + ' ';
    }
    const paymentMethodText = str.slice(0, -1);
    setMaker({
      ...maker,
      paymentMethods: paymentArray,
      paymentMethodsText: paymentMethodText,
      badPaymentMethod: paymentMethodText.length > 50,
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
    const max = fav.mode === 'fiat' ? 999 : 99;
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
    updateCurrentPrice(limits.list, fav.currency, premium);
    updateAmountLimits(limits.list, fav.currency, premium);
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

  const handleCreateOrder = function () {
    if (!disableRequest) {
      setSubmittingRequest(true);
      const body = {
        type: fav.type == 0 ? 1 : 0,
        currency: fav.currency == 0 ? 1 : fav.currency,
        amount: maker.advancedOptions ? null : maker.amount,
        has_range: maker.advancedOptions,
        min_amount: maker.advancedOptions ? maker.minAmount : null,
        max_amount: maker.advancedOptions ? maker.maxAmount : null,
        payment_method:
          maker.paymentMethodsText === '' ? 'not specified' : maker.paymentMethodsText,
        is_explicit: maker.isExplicit,
        premium: maker.isExplicit ? null : maker.premium == '' ? 0 : maker.premium,
        satoshis: maker.isExplicit ? maker.satoshis : null,
        public_duration: maker.publicDuration,
        escrow_duration: maker.escrowDuration,
        bond_size: maker.bondSize,
      };
      apiClient.post(baseUrl, '/api/make/', body).then((data: object) => {
        setBadRequest(data.bad_request);
        if (data.id) {
          onOrderCreated(data.id);
        }
        setSubmittingRequest(false);
      });
    }
    setOpenDialogs(false);
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

  const handleClickAdvanced = function () {
    if (maker.advancedOptions) {
      handleClickRelative();
      setMaker({ ...maker, advancedOptions: false });
    } else {
      resetRange(true);
    }
  };

  const minAmountError = useMemo(() => {
    return (
      maker.minAmount < amountLimits[0] * 0.99 ||
      maker.maxAmount < maker.minAmount ||
      maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
      maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount
    );
  }, [maker.minAmount, maker.maxAmount, amountLimits]);

  const maxAmountError = useMemo(() => {
    return (
      maker.maxAmount > amountLimits[1] * 1.01 ||
      maker.maxAmount < maker.minAmount ||
      maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
      maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount
    );
  }, [maker.minAmount, maker.maxAmount, amountLimits]);

  const resetRange = function (advancedOptions: boolean) {
    const index = fav.currency === 0 ? 1 : fav.currency;
    const minAmount = maker.amount
      ? parseFloat((maker.amount / 2).toPrecision(2))
      : parseFloat(Number(limits.list[index].max_amount * 0.25).toPrecision(2));
    const maxAmount = maker.amount
      ? parseFloat(maker.amount)
      : parseFloat(Number(limits.list[index].max_amount * 0.75).toPrecision(2));

    setMaker({
      ...maker,
      advancedOptions,
      minAmount,
      maxAmount,
    });
  };

  const handleRangeAmountChange = function (e: any, newValue, activeThumb: number) {
    let minAmount = e.target.value[0];
    let maxAmount = e.target.value[1];

    minAmount = Math.min(
      (amountLimits[1] * amountSafeThresholds[1]) / minRangeAmountMultiple,
      minAmount,
    );
    maxAmount = Math.max(
      minRangeAmountMultiple * amountLimits[0] * amountSafeThresholds[0],
      maxAmount,
    );

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

  const amountLabel = useMemo(() => {
    const defaultRoutingBudget = 0.001;
    let label = t('Amount');
    let helper = '';
    let swapSats = 0;
    if (fav.mode === 'swap') {
      if (fav.type === 1) {
        swapSats = computeSats({
          amount: Number(maker.amount),
          premium: Number(maker.premium),
          fee: -info.maker_fee,
          routingBudget: defaultRoutingBudget,
        });
        label = t('Onchain amount to send (BTC)');
        helper = t('You receive approx {{swapSats}} LN Sats (fees might vary)', {
          swapSats,
        });
      } else if (fav.type === 0) {
        swapSats = computeSats({
          amount: Number(maker.amount),
          premium: Number(maker.premium),
          fee: info.maker_fee,
        });
        label = t('Onchain amount to receive (BTC)');
        helper = t('You send approx {{swapSats}} LN Sats (fees might vary)', {
          swapSats,
        });
      }
    }
    return { label, helper, swapSats };
  }, [fav, maker.amount, maker.premium, info]);

  const disableSubmit = useMemo(() => {
    return (
      fav.type == null ||
      (maker.amount != '' &&
        !maker.advancedOptions &&
        (maker.amount < amountLimits[0] || maker.amount > amountLimits[1])) ||
      (maker.amount == null && (!maker.advancedOptions || limits.loading)) ||
      (maker.advancedOptions && (minAmountError || maxAmountError)) ||
      (maker.amount <= 0 && !maker.advancedOptions) ||
      (maker.isExplicit && (maker.badSatoshisText != '' || maker.satoshis == '')) ||
      (!maker.isExplicit && maker.badPremiumText != '')
    );
  }, [maker, amountLimits, limits, fav.type]);

  const clearMaker = function () {
    setFav({ ...fav, type: null });
    setMaker(defaultMaker);
  };

  const SummaryText = function () {
    return (
      <Typography
        component='h2'
        variant='subtitle2'
        align='center'
        color={disableSubmit ? 'text.secondary' : 'text.primary'}
      >
        {fav.type == null
          ? t(fav.mode === 'fiat' ? 'Order for ' : 'Swap of ')
          : fav.type == 1
          ? t(fav.mode === 'fiat' ? 'Buy BTC for ' : 'Swap into LN ')
          : t(fav.mode === 'fiat' ? 'Sell BTC for ' : 'Swap out of LN ')}
        {fav.mode === 'fiat'
          ? amountToString(maker.amount, maker.advancedOptions, maker.minAmount, maker.maxAmount)
          : amountToString(
              maker.amount * 100000000,
              maker.advancedOptions,
              maker.minAmount * 100000000,
              maker.maxAmount * 100000000,
            )}
        {' ' + (fav.mode === 'fiat' ? currencyCode : 'Sats')}
        {maker.isExplicit
          ? t(' of {{satoshis}} Satoshis', { satoshis: pn(maker.satoshis) })
          : maker.premium == 0
          ? t(fav.mode === 'fiat' ? ' at market price' : '')
          : maker.premium > 0
          ? t(' at a {{premium}}% premium', { premium: maker.premium })
          : t(' at a {{discount}}% discount', { discount: -maker.premium })}
      </Typography>
    );
  };

  return (
    <Box>
      <ConfirmationDialog
        open={openDialogs}
        onClose={() => setOpenDialogs(false)}
        setPage={setPage}
        onClickDone={handleCreateOrder}
        hasRobot={hasRobot}
      />
      <Collapse in={limits.list.length == 0}>
        <div style={{ display: limits.list.length == 0 ? '' : 'none' }}>
          <LinearProgress />
        </div>
      </Collapse>
      <Collapse in={!(limits.list.length == 0 || collapseAll)}>
        <Grid container justifyContent='space-between' spacing={0} sx={{ maxHeight: '1em' }}>
          <Grid item>
            <IconButton
              sx={{
                width: '1.3em',
                height: '1.3em',
                position: 'relative',
                bottom: '0.2em',
                right: '0.2em',
                color: 'text.secondary',
              }}
              onClick={clearMaker}
            >
              <Tooltip
                placement='top'
                enterTouchDelay={500}
                enterDelay={700}
                enterNextDelay={2000}
                title={t('Clear form')}
              >
                <DeleteSweep sx={{ width: '1em', height: '1em' }} />
              </Tooltip>
            </IconButton>
          </Grid>
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
                  disabled={limits.list.length == 0}
                  checked={maker.advancedOptions}
                  onChange={handleClickAdvanced}
                />
                <SelfImprovement sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </Collapse>

      <Collapse in={!collapseAll}>
        <Grid container spacing={1} justifyContent='center' alignItems='center'>
          <Grid item>
            <Grid container direction='row' justifyContent='center' alignItems='stretch'>
              <Collapse in={maker.advancedOptions} orientation='horizontal'>
                <Grid item>
                  <FormControl>
                    <FormHelperText sx={{ textAlign: 'center' }}>{t('Swap?')}</FormHelperText>
                    <Checkbox
                      sx={{ position: 'relative', bottom: '0.3em' }}
                      checked={fav.mode == 'swap'}
                      onClick={() => handleCurrencyChange(fav.mode == 'swap' ? 1 : 1000)}
                    />
                  </FormControl>
                </Grid>
              </Collapse>

              <Grid item>
                <FormControl component='fieldset'>
                  <FormHelperText sx={{ textAlign: 'center' }}>
                    {fav.mode === 'fiat' ? t('Buy or Sell Bitcoin?') : t('In or Out of Lightning?')}
                  </FormHelperText>
                  <div style={{ textAlign: 'center' }}>
                    <ButtonGroup>
                      <Button
                        size={maker.advancedOptions ? 'small' : 'large'}
                        variant='contained'
                        onClick={() =>
                          setFav({
                            ...fav,
                            type: 1,
                          })
                        }
                        disableElevation={fav.type == 1}
                        sx={{
                          backgroundColor: fav.type == 1 ? 'primary.main' : 'background.paper',
                          color: fav.type == 1 ? 'background.paper' : 'text.secondary',
                          ':hover': {
                            color: 'background.paper',
                          },
                        }}
                      >
                        {fav.mode === 'fiat' ? t('Buy') : t('Swap In')}
                      </Button>
                      <Button
                        size={maker.advancedOptions ? 'small' : 'large'}
                        variant='contained'
                        onClick={() =>
                          setFav({
                            ...fav,
                            type: 0,
                          })
                        }
                        disableElevation={fav.type == 0}
                        color='secondary'
                        sx={{
                          backgroundColor: fav.type == 0 ? 'secondary.main' : 'background.paper',
                          color: fav.type == 0 ? 'background.secondary' : 'text.secondary',
                          ':hover': {
                            color: 'background.paper',
                          },
                        }}
                      >
                        {fav.mode === 'fiat' ? t('Sell') : t('Swap Out')}
                      </Button>
                    </ButtonGroup>
                  </div>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item sx={{ width: '100%' }}>
            <Collapse in={maker.advancedOptions}>
              <AmountRange
                minAmount={maker.minAmount}
                handleRangeAmountChange={handleRangeAmountChange}
                currency={fav.currency}
                currencyCode={currencyCode}
                handleCurrencyChange={handleCurrencyChange}
                amountLimits={amountLimits}
                maxAmount={maker.maxAmount}
                minAmountError={minAmountError}
                maxAmountError={maxAmountError}
                handleMinAmountChange={handleMinAmountChange}
                handleMaxAmountChange={handleMaxAmountChange}
              />
            </Collapse>
            <Collapse in={!maker.advancedOptions}>
              <Grid item>
                <Grid container alignItems='stretch' style={{ display: 'flex' }}>
                  <Grid item xs={fav.mode === 'fiat' ? 6 : 12}>
                    <Tooltip
                      placement='top'
                      enterTouchDelay={500}
                      enterDelay={700}
                      enterNextDelay={2000}
                      title={
                        fav.mode === 'fiat'
                          ? t('Amount of fiat to exchange for bitcoin')
                          : t('Amount of BTC to swap for LN Sats')
                      }
                    >
                      <TextField
                        fullWidth
                        disabled={maker.advancedOptions}
                        variant={maker.advancedOptions ? 'filled' : 'outlined'}
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
                        label={amountLabel.label}
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
                    {fav.mode === 'swap' && maker.amount != '' ? (
                      <FormHelperText sx={{ textAlign: 'center' }}>
                        {amountLabel.helper}
                      </FormHelperText>
                    ) : null}
                  </Grid>

                  {fav.mode === 'fiat' ? (
                    <Grid item xs={6}>
                      <Select
                        fullWidth
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: '4px',
                        }}
                        required={true}
                        inputProps={{
                          style: { textAlign: 'center' },
                        }}
                        value={fav.currency == 0 ? 1 : fav.currency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                      >
                        {Object.entries(currencyDict).map(([key, value]) => (
                          <MenuItem key={key} value={parseInt(key)}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
                            >
                              <FlagWithProps code={value} />
                              {' ' + value}
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                  ) : null}
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          <Grid item xs={12}>
            <AutocompletePayments
              onAutocompleteChange={handlePaymentMethodChange}
              // listBoxProps={{ sx: { width: '15.3em', maxHeight: '20em' } }}
              optionsType={fav.mode}
              error={maker.badPaymentMethod}
              helperText={maker.badPaymentMethod ? t('Must be shorter than 65 characters') : ''}
              label={fav.mode == 'swap' ? t('Swap Destination(s)') : t('Fiat Payment Method(s)')}
              tooltipTitle={t(
                fav.mode == 'swap'
                  ? t('Enter the destination of the Lightning swap')
                  : 'Enter your preferred fiat payment methods. Fast methods are highly recommended.',
              )}
              listHeaderText={t('You can add new methods')}
              addNewButtonText={t('Add New')}
              asFilter={false}
              value={maker.paymentMethods}
            />
          </Grid>

          {!maker.advancedOptions && pricingMethods ? (
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
                        disabled={maker.advancedOptions}
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
            <Collapse in={maker.advancedOptions}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <MobileTimePicker
                      ampm={false}
                      localeText={{ timePickerToolbarTitle: t('Public order length') }}
                      openTo='hours'
                      views={['hours', 'minutes']}
                      inputFormat='HH:mm'
                      mask='__:__'
                      componentsProps={{
                        textField: {
                          InputProps: {
                            style: {
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: '4px',
                            },
                            endAdornment: (
                              <InputAdornment position='end'>
                                <HourglassTop />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                      label={t('Public Duration (HH:mm)')}
                      value={maker.publicExpiryTime}
                      onChange={handleChangePublicDuration}
                      minTime={new Date(0, 0, 0, 0, 10)}
                      maxTime={new Date(0, 0, 0, 23, 59)}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <MobileTimePicker
                      ampm={false}
                      localeText={{ timePickerToolbarTitle: t('Escrow/invoice step length') }}
                      openTo='hours'
                      views={['hours', 'minutes']}
                      inputFormat='HH:mm'
                      mask='__:__'
                      componentsProps={{
                        textField: {
                          InputProps: {
                            style: {
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: '4px',
                            },
                            endAdornment: (
                              <InputAdornment position='end'>
                                <HourglassTop />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                      label={t('Escrow/Invoice Timer (HH:mm)')}
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
                          title={t(
                            'Set the skin-in-the-game, increase for higher safety assurance',
                          )}
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
        </Grid>
      </Collapse>

      <Grid container direction='column' alignItems='center'>
        <Grid item>
          <SummaryText />
        </Grid>

        <Grid item>
          <Grid container direction='row' justifyItems='center' alignItems='center' spacing={1}>
            <Grid item>
              {/* conditions to disable the make button */}
              {disableSubmit ? (
                <Tooltip enterTouchDelay={0} title={t('You must fill the form correctly')}>
                  <div>
                    <Button disabled color='primary' variant='contained'>
                      {t(submitButtonLabel)}
                    </Button>
                  </div>
                </Tooltip>
              ) : (
                <LoadingButton
                  loading={submittingRequest}
                  color='primary'
                  variant='contained'
                  onClick={() => {
                    disableRequest ? onSubmit() : setOpenDialogs(true);
                  }}
                >
                  {t(submitButtonLabel)}
                </LoadingButton>
              )}
            </Grid>
            {collapseAll ? (
              <Grid item>
                <Collapse in={collapseAll} orientation='vertical'>
                  <IconButton onClick={onReset}>
                    <Tooltip
                      placement='top'
                      enterTouchDelay={500}
                      enterDelay={700}
                      enterNextDelay={2000}
                      title={t('Edit order')}
                    >
                      <Edit sx={{ width: '1.5em', height: '1.5em' }} />
                    </Tooltip>
                  </IconButton>
                </Collapse>
              </Grid>
            ) : null}
          </Grid>
        </Grid>

        <Grid item>
          <Typography align='center' component='h2' variant='subtitle2' color='secondary'>
            {badRequest}
          </Typography>
        </Grid>

        <Collapse in={!(limits.list.length == 0)}>
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
            <Typography align='center' variant='caption' color='text.secondary'>
              {(maker.isExplicit ? t('Order rate:') : t('Order current rate:')) +
                ` ${pn(currentPrice)} ${currencyCode}/BTC`}
            </Typography>
          </Tooltip>
        </Collapse>
      </Grid>
    </Box>
  );
};

export default MakerForm;
