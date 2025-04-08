import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAdornment,
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

import { type LimitList, defaultMaker, type Order } from '../../models';

import { LocalizationProvider, MobileTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ConfirmationDialog, F2fMapDialog } from '../Dialogs';

import { FlagWithProps } from '../Icons';
import AutocompletePayments from './AutocompletePayments';
import AmountRange from './AmountRange';
import currencyDict from '../../../static/assets/currencies.json';
import { amountToString, computeSats, genBase62Token, pn } from '../../utils';

import { SelfImprovement, Lock, HourglassTop, DeleteSweep, Edit, Map } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { fiatMethods } from '../PaymentMethods';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import SelectCoordinator from './SelectCoordinator';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { useNavigate } from 'react-router-dom';

interface MakerFormProps {
  disableRequest?: boolean;
  pricingMethods?: boolean;
  collapseAll?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
  submitButtonLabel?: string;
}

const MakerForm = ({
  pricingMethods = false,
  disableRequest = false,
  collapseAll = false,
  onSubmit = () => {},
  onReset = () => {},
  submitButtonLabel = 'Create Order',
}: MakerFormProps): JSX.Element => {
  const { fav, setFav } = useContext<UseAppStoreType>(AppContext);
  const { federation, federationUpdatedAt } = useContext<UseFederationStoreType>(FederationContext);
  const { maker, setMaker, garage } = useContext<UseGarageStoreType>(GarageContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [badRequest, setBadRequest] = useState<string | null>(null);
  const [amountLimits, setAmountLimits] = useState<number[]>([1, 1000]);
  const [satoshisLimits, setSatoshisLimits] = useState<number[]>([20000, 4000000]);
  const [currentPrice, setCurrentPrice] = useState<number | string>('...');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  const [openDialogs, setOpenDialogs] = useState<boolean>(false);
  const [openWorldmap, setOpenWorldmap] = useState<boolean>(false);
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);
  const [amountRangeEnabled, setAmountRangeEnabled] = useState<boolean>(true);
  const [limits, setLimits] = useState<LimitList>({});

  const maxRangeAmountMultiple = 14.8;
  const minRangeAmountMultiple = 1.6;
  const amountSafeThresholds = [1.03, 0.98];

  useEffect(() => {
    federation
      .loadInfo()
      .then(() => {})
      .catch((error) => {
        console.error('Error loading info:', error);
      });
  }, []);

  useEffect(() => {
    setCurrencyCode(currencyDict[fav.currency === 0 ? 1 : fav.currency]);
  }, [federationUpdatedAt]);

  useEffect(() => {
    updateCoordinatorInfo();
  }, [maker.coordinator, federationUpdatedAt]);

  const updateCoordinatorInfo = (): void => {
    if (maker.coordinator != null) {
      const newLimits = federation.getCoordinator(maker.coordinator).limits;
      if (Object.keys(newLimits).length !== 0) {
        updateAmountLimits(newLimits, fav.currency, maker.premium);
        updateCurrentPrice(newLimits, fav.currency, maker.premium);
        updateSatoshisLimits(newLimits);
        setLimits(newLimits);
      }
    }
  };

  const updateAmountLimits = function (
    limitList: LimitList,
    currency: number,
    premium: number,
  ): void {
    const index = currency === 0 ? 1 : currency;
    let minAmountLimit: number = limitList[index].min_amount * (1 + premium / 100);
    let maxAmountLimit: number = limitList[index].max_amount * (1 + premium / 100);

    const coordinatorSizeLimit =
      (federation.getCoordinator(maker.coordinator).size_limit / 100000000) *
      limitList[index].price;
    maxAmountLimit = Math.min(coordinatorSizeLimit, maxAmountLimit);

    // apply thresholds to ensure good request
    minAmountLimit = minAmountLimit * amountSafeThresholds[0];
    maxAmountLimit = maxAmountLimit * amountSafeThresholds[1];
    setAmountLimits([minAmountLimit, maxAmountLimit]);
  };

  const updateSatoshisLimits = function (limitList: LimitList): void {
    const minAmount: number = limitList[1000].min_amount * 100000000;
    let maxAmount: number = limitList[1000].max_amount * 100000000;
    maxAmount = Math.min(
      federation.getCoordinator(maker.coordinator).size_limit / 100000000,
      maxAmount,
    );
    setSatoshisLimits([minAmount, maxAmount]);
  };

  const updateCurrentPrice = function (
    limitsList: LimitList,
    currency: number,
    premium: number,
  ): void {
    const index = currency === 0 ? 1 : currency;
    let price = '...';
    if (maker.isExplicit && maker.amount > 0 && maker.satoshis > 0) {
      price = maker.amount / (maker.satoshis / 100000000);
    } else if (!maker.isExplicit) {
      price = limitsList[index].price * (1 + premium / 100);
    }
    setCurrentPrice(parseFloat(Number(price).toPrecision(5)));
  };

  const handleCurrencyChange = function (newCurrency: number): void {
    const currencyCode: string = currencyDict[newCurrency];
    setCurrencyCode(currencyCode);
    setFav({
      ...fav,
      currency: newCurrency,
      mode: newCurrency === 1000 ? 'swap' : 'fiat',
    });
    updateAmountLimits(limits, newCurrency, maker.premium);
    updateCurrentPrice(limits, newCurrency, maker.premium);

    if (makerHasAmountRange) {
      const minAmount = parseFloat(Number(limits[newCurrency].min_amount).toPrecision(2));
      const maxAmount = parseFloat(Number(limits[newCurrency].max_amount).toPrecision(2));
      if (
        parseFloat(maker.minAmount) < minAmount ||
        parseFloat(maker.minAmount) > maxAmount ||
        parseFloat(maker.maxAmount) > maxAmount ||
        parseFloat(maker.maxAmount) < minAmount
      ) {
        setMaker({
          ...maker,
          minAmount: (maxAmount * 0.25).toPrecision(2),
          maxAmount: (maxAmount * 0.75).toPrecision(2),
        });
      }
    }
  };

  const makerHasAmountRange = useMemo(() => {
    return maker.advancedOptions && amountRangeEnabled;
  }, [maker.advancedOptions, amountRangeEnabled]);

  const handlePaymentMethodChange = function (
    paymentArray: Array<{ name: string; icon: string }>,
  ): void {
    let str = '';
    const arrayLength = paymentArray.length;
    let includeCoordinates = false;

    for (let i = 0; i < arrayLength; i++) {
      str += paymentArray[i].name + ' ';
      if (paymentArray[i].icon === 'cash') {
        includeCoordinates = true;
        if (i === arrayLength - 1) {
          setOpenWorldmap(true);
        }
      }
    }
    const paymentMethodText = str.slice(0, -1);
    setMaker((maker) => {
      return {
        ...maker,
        paymentMethods: paymentArray,
        paymentMethodsText: paymentMethodText,
        badPaymentMethod: paymentMethodText.length > 50,
        latitude: includeCoordinates ? maker.latitude : null,
        longitude: includeCoordinates ? maker.longitude : null,
      };
    });
  };

  const handleMinAmountChange = function (
    e: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    setMaker({
      ...maker,
      minAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
    });
  };

  const handleMaxAmountChange = function (
    e: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    setMaker({
      ...maker,
      maxAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
    });
  };

  const handlePremiumChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =
    function ({ target: { value } }): void {
      const max = fav.mode === 'fiat' ? 999 : 99;
      const min = -100;
      const newPremium = Math.floor(Number(value) * Math.pow(10, 2)) / Math.pow(10, 2);
      let premium: number = isNaN(newPremium) ? 0 : newPremium;
      let badPremiumText: string = '';
      if (newPremium > 999) {
        badPremiumText = t('Must be less than {{max}}%', { max });
        premium = 999;
      } else if (newPremium <= -100) {
        badPremiumText = t('Must be more than {{min}}%', { min });
        premium = -99.99;
      }
      updateCurrentPrice(limits, fav.currency, premium);
      updateAmountLimits(limits, fav.currency, premium);
      setMaker({
        ...maker,
        premium: isNaN(newPremium) || value === '' ? '' : premium,
        badPremiumText,
      });
    };

  const handleSatoshisChange = function (e: object): void {
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

  const handleClickRelative = function (): void {
    setMaker({
      ...maker,
      isExplicit: false,
    });
  };

  const handleClickExplicit = function (): void {
    if (!maker.advancedOptions) {
      setMaker({
        ...maker,
        isExplicit: true,
      });
    }
  };

  const handleCreateOrder = function (): void {
    const slot = garage.getSlot();

    if (slot?.activeOrder?.id) {
      setBadRequest(t('You are already maker of an active order'));
      return;
    }

    if (!disableRequest && maker.coordinator && slot) {
      setSubmittingRequest(true);
      const orderAttributes = {
        type: fav.type === 0 ? 1 : 0,
        currency: fav.currency === 0 ? 1 : fav.currency,
        amount: makerHasAmountRange ? null : maker.amount,
        has_range: makerHasAmountRange,
        min_amount: makerHasAmountRange ? maker.minAmount : null,
        max_amount: makerHasAmountRange ? maker.maxAmount : null,
        payment_method:
          maker.paymentMethodsText === '' ? 'not specified' : maker.paymentMethodsText,
        is_explicit: maker.isExplicit,
        premium: maker.isExplicit ? null : maker.premium === '' ? 0 : maker.premium,
        satoshis: maker.isExplicit ? maker.satoshis : null,
        public_duration: maker.publicDuration,
        escrow_duration: maker.escrowDuration,
        bond_size: maker.bondSize,
        latitude: maker.latitude,
        longitude: maker.longitude,
        shortAlias: maker.coordinator,
      };

      void slot
        .makeOrder(federation, orderAttributes)
        .then((order: Order) => {
          if (order.id) {
            navigate(`/order/${order.shortAlias}/${order.id}`);
          } else if (order?.bad_request) {
            setBadRequest(order?.bad_request);
          }
          setSubmittingRequest(false);
        })
        .catch(() => {
          setBadRequest('Request error');
          setSubmittingRequest(false);
        });
    }
    setOpenDialogs(false);
  };

  const handleChangePublicDuration = function (date: Date): void {
    const d = new Date(date);
    const hours: number = d.getHours();
    const minutes: number = d.getMinutes();

    const totalSecs: number = hours * 60 * 60 + minutes * 60;

    setMaker({
      ...maker,
      publicExpiryTime: date,
      publicDuration: totalSecs,
    });
  };

  const handleChangeEscrowDuration = function (date: Date): void {
    const d = new Date(date);
    const hours: number = d.getHours();
    const minutes: number = d.getMinutes();

    const totalSecs: number = hours * 60 * 60 + minutes * 60;

    setMaker({
      ...maker,
      escrowExpiryTime: date,
      escrowDuration: totalSecs,
    });
  };

  const handleClickAdvanced = function (): void {
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

  const resetRange = function (advancedOptions: boolean): void {
    const index = fav.currency === 0 ? 1 : fav.currency;
    const minAmount =
      maker.amount !== ''
        ? parseFloat((maker.amount / 2).toPrecision(2))
        : parseFloat(Number(limits[index].max_amount * 0.25).toPrecision(2));
    const maxAmount =
      maker.amount !== ''
        ? parseFloat(maker.amount)
        : parseFloat(Number(limits[index].max_amount * 0.75).toPrecision(2));

    setMaker({
      ...maker,
      advancedOptions,
      minAmount,
      maxAmount,
    });
  };

  const handleRangeAmountChange = function (e: any, newValue, activeThumb: number): void {
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

  const handleClickAmountRangeEnabled = function (
    _e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ): void {
    setAmountRangeEnabled(checked);
  };

  const amountLabel = useMemo(() => {
    if (!(maker.coordinator != null)) return;

    const info = federation.getCoordinator(maker.coordinator)?.info;
    const defaultRoutingBudget = 0.001;
    let label = t('Amount');
    let helper = '';
    let swapSats = 0;
    if (fav.mode === 'swap') {
      if (fav.type === 1) {
        swapSats = computeSats({
          amount: Number(maker.amount),
          premium: Number(maker.premium),
          fee: -(info?.maker_fee ?? 0),
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
          fee: info?.maker_fee ?? 0,
        });
        label = t('Onchain amount to receive (BTC)');
        helper = t('You send approx {{swapSats}} LN Sats (fees might vary)', {
          swapSats,
        });
      }
    }
    return { label, helper, swapSats };
  }, [fav, maker.amount, maker.premium, federationUpdatedAt]);

  const disableSubmit = useMemo(() => {
    return (
      fav.type == null ||
      (!makerHasAmountRange &&
        maker.amount !== '' &&
        (maker.amount < amountLimits[0] || maker.amount > amountLimits[1])) ||
      maker.badPaymentMethod ||
      (maker.amount == null && (!makerHasAmountRange || Object.keys(limits).lenght < 1)) ||
      (makerHasAmountRange && (minAmountError || maxAmountError)) ||
      (!makerHasAmountRange && maker.amount <= 0) ||
      (maker.isExplicit && (maker.badSatoshisText !== '' || maker.satoshis === '')) ||
      (!maker.isExplicit && maker.badPremiumText !== '') ||
      federation.getCoordinator(maker.coordinator)?.limits === undefined ||
      typeof maker.premium !== 'number' ||
      maker.paymentMethods.length === 0
    );
  }, [maker, maker.premium, amountLimits, federationUpdatedAt, fav.type, makerHasAmountRange]);

  const clearMaker = function (): void {
    setFav({ ...fav, type: null });
    setMaker(defaultMaker);
  };

  const handleAddLocation = (pos: [number, number]): void => {
    if (pos?.length === 2) {
      setMaker((maker) => {
        return {
          ...maker,
          latitude: parseFloat(pos[0].toPrecision(6)),
          longitude: parseFloat(pos[1].toPrecision(6)),
        };
      });
      const cashMethod = maker.paymentMethods.find((method) => method.icon === 'cash');
      if (cashMethod !== null) {
        const newMethods = maker.paymentMethods;
        const cash = fiatMethods.find((method) => method.icon === 'cash');
        if (cash !== null) {
          newMethods.unshift(cash);
          handlePaymentMethodChange(newMethods);
        }
      }
    }
  };

  const SummaryText = (): JSX.Element => {
    return (
      <Typography
        component='h2'
        variant='subtitle2'
        align='center'
        color={disableSubmit ? 'text.secondary' : 'text.primary'}
      >
        {fav.type == null
          ? fav.mode === 'fiat'
            ? t('Order for ')
            : t('Swap of ')
          : fav.type === 1
            ? fav.mode === 'fiat'
              ? t('Buy BTC for ')
              : t('Swap into LN ')
            : fav.mode === 'fiat'
              ? t('Sell BTC for ')
              : t('Swap out of LN ')}
        {fav.mode === 'fiat'
          ? amountToString(maker.amount, makerHasAmountRange, maker.minAmount, maker.maxAmount)
          : amountToString(
              maker.amount * 100000000,
              makerHasAmountRange,
              maker.minAmount * 100000000,
              maker.maxAmount * 100000000,
            )}
        {' ' + (fav.mode === 'fiat' ? currencyCode : 'Sats')}
        {maker.isExplicit
          ? t(' of {{satoshis}} Satoshis', { satoshis: pn(maker.satoshis) })
          : maker.premium === 0
            ? fav.mode === 'fiat'
              ? t(' at market price')
              : ''
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
        onClose={() => {
          setOpenDialogs(false);
        }}
        onClickDone={handleCreateOrder}
        hasRobot={Boolean(garage.getSlot()?.hashId)}
        onClickGenerateRobot={() => {
          setOpenDialogs(false);
          const token = genBase62Token(36);
          garage
            .createRobot(federation, token)
            .then(() => {
              setOpenDialogs(true);
            })
            .catch((e) => {
              console.log(e);
            });
        }}
      />
      <F2fMapDialog
        interactive
        latitude={maker.latitude}
        longitude={maker.longitude}
        open={openWorldmap}
        message={t(
          'To protect your privacy, the exact location you pin will be slightly randomized.',
        )}
        orderType={fav?.type ?? 0}
        onClose={(pos?: [number, number]) => {
          if (pos != null) handleAddLocation(pos);
          setOpenWorldmap(false);
        }}
        zoom={maker.latitude != null && maker.longitude != null ? 6 : undefined}
      />
      <Collapse in={!(Object.keys(limits).lenght === 0 || collapseAll)}>
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
                  disabled={Object.keys(limits).length === 0}
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
                      checked={fav.mode === 'swap'}
                      onClick={() => {
                        handleCurrencyChange(fav.mode === 'swap' ? 1 : 1000);
                      }}
                    />
                  </FormControl>
                </Grid>
              </Collapse>

              <Grid item>
                <FormControl component='fieldset'>
                  <FormHelperText sx={{ textAlign: 'center' }}>
                    {`${fav.mode === 'fiat' ? t('Buy or Sell Bitcoin?') : t('In or Out of Lightning?')} *`}
                  </FormHelperText>
                  <div style={{ textAlign: 'center' }}>
                    <ButtonGroup>
                      <Button
                        size={maker.advancedOptions ? 'small' : 'large'}
                        variant='contained'
                        onClick={() => {
                          setFav({
                            ...fav,
                            type: 1,
                          });
                        }}
                        disableElevation={fav.type === 1}
                        sx={{
                          backgroundColor: fav.type === 1 ? 'primary.main' : 'background.paper',
                          color: fav.type === 1 ? 'background.paper' : 'text.secondary',
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
                        onClick={() => {
                          setFav({
                            ...fav,
                            type: 0,
                          });
                        }}
                        disableElevation={fav.type === 0}
                        color='secondary'
                        sx={{
                          backgroundColor: fav.type === 0 ? 'secondary.main' : 'background.paper',
                          color: fav.type === 0 ? 'background.secondary' : 'text.secondary',
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
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    disabled={!maker.advancedOptions}
                    checked={amountRangeEnabled}
                    onChange={handleClickAmountRangeEnabled}
                  />
                }
                sx={{
                  paddingLeft: '1em',
                  color: 'text.secondary',
                  marginTop: '-0.5em',
                  paddingBottom: '0.5em',
                }}
                label={amountRangeEnabled ? t('Amount Range') : t('Exact Amount')}
              />
            </Collapse>
            <Collapse in={makerHasAmountRange}>
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
            <Collapse in={!makerHasAmountRange}>
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
                        disabled={makerHasAmountRange}
                        variant={makerHasAmountRange ? 'filled' : 'outlined'}
                        error={
                          maker.amount !== '' &&
                          (maker.amount < amountLimits[0] || maker.amount > amountLimits[1])
                        }
                        helperText={
                          maker.amount < amountLimits[0] && maker.amount !== ''
                            ? t('Must be more than {{minAmount}}', {
                                minAmount: pn(parseFloat(amountLimits[0].toPrecision(2))),
                              })
                            : maker.amount > amountLimits[1] && maker.amount !== ''
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
                        onChange={(e) => {
                          setMaker({ ...maker, amount: e.target.value });
                        }}
                      />
                    </Tooltip>
                    {fav.mode === 'swap' && maker.amount !== '' ? (
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
                        value={fav.currency === 0 ? 1 : fav.currency}
                        onChange={(e) => {
                          handleCurrencyChange(e.target.value);
                        }}
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
              onClick={() => {
                setOpenWorldmap(true);
              }}
              optionsType={fav.mode}
              error={maker.badPaymentMethod}
              helperText={maker.badPaymentMethod ? t('Must be shorter than 65 characters') : ''}
              label={`${fav.mode === 'swap' ? t('Swap Destination(s)') : t('Fiat Payment Method(s)')} *`}
              tooltipTitle={t(
                fav.mode === 'swap'
                  ? t('Enter the destination of the Lightning swap')
                  : 'Enter your preferred fiat payment methods. Fast methods are highly recommended.',
              )}
              listHeaderText={t('You can add new methods')}
              addNewButtonText={t('Add New')}
              isFilter={false}
              multiple={true}
              value={maker.paymentMethods}
            />
            {maker.badPaymentMethod && (
              <FormHelperText error={true}>
                {t('Must be shorter than 65 characters')}
              </FormHelperText>
            )}
          </Grid>

          {fav.mode === 'fiat' && (
            <Grid item sx={{ width: '100%' }}>
              <Tooltip enterTouchDelay={0} title={t('Add geolocation for a face to face trade')}>
                <Button
                  size='large'
                  fullWidth={true}
                  color='inherit'
                  variant='outlined'
                  sx={{
                    justifyContent: 'flex-start',
                    fontWeight: 'normal',
                    textTransform: 'none',
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    borderColor: theme.palette.text.disabled,
                  }}
                  onClick={() => {
                    setOpenWorldmap(true);
                  }}
                >
                  {t('Face to Face Location')}
                  <Map style={{ paddingLeft: 5 }} />
                </Button>
              </Tooltip>
            </Grid>
          )}

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
                error={maker.badSatoshisText !== ''}
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
                error={maker.badPremiumText !== ''}
                helperText={maker.badPremiumText === '' ? null : maker.badPremiumText}
                label={`${t('Premium over Market (%)')} *`}
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
                      slotProps={{
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
                      slotProps={{
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
                          onChange={(e) => {
                            setMaker({ ...maker, bondSize: e.target.value });
                          }}
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

      <SelectCoordinator
        coordinatorAlias={maker.coordinator}
        setCoordinator={(coordinatorAlias) => {
          setMaker((maker) => {
            return { ...maker, coordinator: coordinatorAlias };
          });
        }}
      />

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

        <Collapse in={!(Object.keys(limits).length === 0)}>
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
