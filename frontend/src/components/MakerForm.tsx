import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAdornment,
  LinearProgress,
  ButtonGroup,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Slider,
  Box,
  Tab,
  Tabs,
  SliderThumb,
  Tooltip,
  Paper,
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
} from '@mui/material';
import Limit, { LimitList } from '../models/Limit.model';
import Maker from '../models/Maker.model';

import RangeSlider from './RangeSlider';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Link as LinkRouter } from 'react-router-dom';
import { StoreTokenDialog, NoRobotDialog } from './Dialogs';
import { apiClient } from '../services/api';

import FlagWithProps from './FlagWithProps';
import AutocompletePayments from './AutocompletePayments';
import currencyDict from '../../static/assets/currencies.json';

// icons
import LockIcon from '@mui/icons-material/Lock';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { getCookie } from '../utils/cookies';
import { pn } from '../utils/prettyNumbers';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  limits: LimitList;
  loadingLimits: boolean;
  maker: Maker;
  type: number;
  currency: number;
  setAppState: (state: object) => void;
  setMaker: (state: object) => void;
  //       tabValue: 0,
  //       openStoreToken:  ,
  //       is_explicit: false,
  //       type: null,
  //       currency: this.defaultCurrency,
  //       currencyCode: this.defaultCurrencyCode,
  //       payment_method: this.defaultPaymentMethod,
  //       premium: 0,
  //       satoshis: '',
  //       publicExpiryTime: new Date(0, 0, 0, 23, 59),
  //       escrowExpiryTime: new Date(0, 0, 0, 3, 0),
  //       enableAmountRange: false,
  //       bondSize: 3,
  //       limits: null,
  //       minAmount: '',
  //       maxAmount: '',
  //       loadingLimits: true,
  //       badPaymentMethod: '',
}

const MakerForm = ({ limits, loadingLimits, currency, type, setAppState }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [maker, setMaker] = useState<Maker>({
    isExplicit: false,
    amount: '',
    paymentMethod: new Array(),
    paymentMethodText: 'Not specified',
    premium: '',
    satoshis: '',
    publicExpiryTime: new Date(0, 0, 0, 23, 59),
    escrowExpiryTime: new Date(0, 0, 0, 3, 0),
    bondSize: 3,
    amountRange: false,
    minAmount: null,
    maxAmount: null,
    badPremiumText: '',
    badSatoshisText: '',
    badExactPrice: '',
  });
  const [amountLimits, setAmountLimits] = useState<number[]>([1, 1000]);
  const [satoshisLimits, setSatoshisLimits] = useState<number[]>([20000, 4000000]);
  const [currentPrice, setCurrentPrice] = useState<number | string>('...');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  useEffect(() => {
    if (Object.keys(limits).length === 0) {
      setAppState({ loadingLimits: true });
      apiClient.get('/api/limits/').then((data: LimitList) => {
        setAppState({ limits: data, loadingLimits: false });
        updateAmountLimits(data, currency);
        updateCurrentPrice(data, currency);
      });
    } else {
      updateAmountLimits(limits, currency);
      updateCurrentPrice(limits, currency);
    }
  }, []);

  const updateAmountLimits = function (limits: LimitList, currency: number) {
    const index = currency === 0 ? 1 : currency;
    var minAmount: number = limits[index].min_amount * (1 + maker.premium / 100);
    var maxAmount: number = limits[index].max_amount * (1 + maker.premium / 100);
    // times 1.1 to allow a bit of margin with respect to the backend minimum
    minAmount = minAmount * 1.1; // parseFloat(Number(minAmount * 1.1).toPrecision(2))
    // times 0.98 to allow a bit of margin with respect to the backend minimum
    maxAmount = maxAmount * 0.98; // parseFloat(Number(maxAmount * 0.98).toPrecision(2));
    setAmountLimits([minAmount, maxAmount]);
  };

  const updateSatoshisLimits = function (limits: LimitList) {
    var minAmount: number = limits[1000].min_amount;
    var maxAmount: number = limits[1000].max_amount;
    setSatoshisLimits([minAmount, maxAmount]);
  };

  const updateCurrentPrice = function (limits: LimitList, currency: number) {
    const index = currency === 0 ? 1 : currency;
    let price = '...';
    if (maker.is_explicit && maker.amount > 0 && maker.satoshis > 0) {
      price = maker.amount / (maker.satoshis / 100000000);
    } else if (!maker.is_explicit) {
      price = limits[index].price * (1 + maker.premium / 100);
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
    updateAmountLimits(limits, newCurrency);
    updateCurrentPrice(limits, newCurrency);
    if (maker.amountRange) {
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

  // const updateBounds = function {
  //     this.setState({
  //       minAmount: maker.amount
  //         ? parseFloat((maker.amount / 2).toPrecision(2))
  //         : parseFloat(
  //             Number(this.state.limits[this.state.currency].max_amount * 0.25).toPrecision(2),
  //           ),
  //       maxAmount: maker.amount
  //         ? maker.amount
  //         : parseFloat(
  //             Number(this.state.limits[this.state.currency].max_amount * 0.75).toPrecision(2),
  //           ),
  //     });
  //   };

  //   handleMinAmountChange = (e) => {
  //     this.setState({
  //       minAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
  //     });
  //   };

  //   handleMaxAmountChange = (e) => {
  //     this.setState({
  //       maxAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
  //     });
  //   };

  //   handleRangeAmountChange = (e, newValue, activeThumb) => {
  //     const maxAmount = this.getMaxAmount();
  //     const minAmount = this.getMinAmount();
  //     let lowerValue = e.target.value[0];
  //     let upperValue = e.target.value[1];
  //     const minRange = this.minRangeAmountMultiple;
  //     const maxRange = this.maxRangeAmountMultiple;

  //     if (lowerValue > maxAmount / minRange) {
  //       lowerValue = maxAmount / minRange;
  //     }
  //     if (upperValue < minRange * minAmount) {
  //       upperValue = minRange * minAmount;
  //     }

  //     if (lowerValue > upperValue / minRange) {
  //       if (activeThumb === 0) {
  //         upperValue = minRange * lowerValue;
  //       } else {
  //         lowerValue = upperValue / minRange;
  //       }
  //     } else if (lowerValue < upperValue / maxRange) {
  //       if (activeThumb === 0) {
  //         upperValue = maxRange * lowerValue;
  //       } else {
  //         lowerValue = upperValue / maxRange;
  //       }
  //     }

  //     this.setState({
  //       minAmount: parseFloat(Number(lowerValue).toPrecision(lowerValue < 100 ? 2 : 3)),
  //       maxAmount: parseFloat(Number(upperValue).toPrecision(upperValue < 100 ? 2 : 3)),
  //     });
  //   };

  const handlePremiumChange = function (e: object) {
    const max = 999;
    const min = -100;
    const newPremium = e.target.value;
    let premium: number = newPremium;
    let badPremiumText: string = '';
    if (newPremium > 999) {
      badPremiumText = t('Must be less than {{max}}%', { max });
      premium = 999;
    } else if (newPremium <= -100) {
      badPremiumText = t('Must be more than {{min}}%', { min });
      premium = -99.99;
    }
    setMaker({
      ...maker,
      premium,
      badPremiumText,
    });
  };

  const handleSatoshisChange = function (e: object) {
    const newSatoshis = e.target.value;
    let badSatoshistext: string = '';
    let satoshis: number = newSatoshis;
    if (newSatoshis > satoshisLimits[1]) {
      badSatoshistext = t('Must be less than {{maxSats}', { maxSats: pn(satoshisLimits[1]) });
      satoshis = satoshisLimits[1];
    }
    if (newSatoshis < satoshisLimits[0]) {
      badSatoshistext = t('Must be more than {{minSats}}', { minSats: pn(satoshisLimits[0]) });
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
    if (!maker.amountRange) {
      setMaker({
        isExplicit: true,
      });
    }
  };

  //   handleCreateOfferButtonPressed = function {
  //     maker.amount == null ? this.setState({ amount: 0 }) : null;
  //     const body = {
  //       type:  type == 0 ? 1 : 0,
  //       currency: this.state.currency,
  //       amount: this.state.has_range ? null : maker.amount,
  //       has_range: this.state.enableAmountRange,
  //       min_amount: this.state.minAmount,
  //       max_amount: this.state.maxAmount,
  //       payment_method:
  //         this.state.payment_method === '' ? this.defaultPaymentMethod : this.state.payment_method,
  //       is_explicit: this.state.is_explicit,
  //       premium: this.state.is_explicit ? null : this.state.premium == '' ? 0 : this.state.premium,
  //       satoshis: this.state.is_explicit ? this.state.satoshis : null,
  //       public_duration: this.state.publicDuration,
  //       escrow_duration: this.state.escrowDuration,
  //       bond_size: this.state.bondSize,
  //       bondless_taker: this.state.allowBondless,
  //     };
  //     apiClient
  //       .post('/api/make/', body)
  //       .then(
  //         (data) =>
  //           this.setState({ badRequest: data.bad_request }) &
  //           (data.id ?  history.push('/order/' + data.id) : ''),
  //       );
  //     this.setState({ openStoreToken: false });
  //   };

  //   handleInputBondSizeChange = (event) => {
  //     this.setState({ bondSize: event.target.value === '' ? 1 : Number(event.target.value) });
  //   };

  // handleChangePublicDuration = (date) => {
  //   const d = new Date(date);
  //   const hours = d.getHours();
  //   const minutes = d.getMinutes();

  //   const total_secs = hours * 60 * 60 + minutes * 60;

  //   this.setState({
  //     publicExpiryTime: date,
  //     publicDuration: total_secs,
  //   });
  // };

  // handleChangeEscrowDuration = (date) => {
  //   const d = new Date(date);
  //   const hours = d.getHours();
  //   const minutes = d.getMinutes();

  //   const total_secs = hours * 60 * 60 + minutes * 60;

  //   this.setState({
  //     escrowExpiryTime: date,
  //     escrowDuration: total_secs,
  //   });
  // };

  // RangeThumbComponent(props) {
  //   const { children, ...other } = props;
  //   return (
  //     <SliderThumb {...other}>
  //       {children}
  //       <span className='range-bar' />
  //       <span className='range-bar' />
  //       <span className='range-bar' />
  //     </SliderThumb>
  //   );
  // }

  // minAmountError = function {
  //   return (
  //     this.state.minAmount < this.getMinAmount() ||
  //     this.state.maxAmount < this.state.minAmount ||
  //     this.state.minAmount < this.state.maxAmount / (this.maxRangeAmountMultiple + 0.15) ||
  //     this.state.minAmount * (this.minRangeAmountMultiple - 0.1) > this.state.maxAmount
  //   );
  // };

  // maxAmountError = function {
  //   return (
  //     this.state.maxAmount > this.getMaxAmount() ||
  //     this.state.maxAmount < this.state.minAmount ||
  //     this.state.minAmount < this.state.maxAmount / (this.maxRangeAmountMultiple + 0.15) ||
  //     this.state.minAmount * (this.minRangeAmountMultiple - 0.1) > this.state.maxAmount
  //   );
  // };

  // rangeText = function {
  //   const { t } = this.props;
  //   return (
  //     <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
  //       <span style={{ width: t('From').length * 8 + 2, textAlign: 'left' }}>{t('From')}</span>
  //       <TextField
  //         variant='standard'
  //         type='number'
  //         size='small'
  //         value={this.state.minAmount}
  //         onChange={this.handleMinAmountChange}
  //         error={this.minAmountError()}
  //         sx={{ width: this.state.minAmount.toString().length * 9, maxWidth: 40 }}
  //       />
  //       <span style={{ width: t('to').length * 8, textAlign: 'center' }}>{t('to')}</span>
  //       <TextField
  //         variant='standard'
  //         size='small'
  //         type='number'
  //         value={this.state.maxAmount}
  //         error={this.maxAmountError()}
  //         onChange={this.handleMaxAmountChange}
  //         sx={{ width: this.state.maxAmount.toString().length * 9, maxWidth: 50 }}
  //       />
  //       <span style={{ width: this.state.currencyCode.length * 9 + 3, textAlign: 'right' }}>
  //         {this.state.currencyCode}
  //       </span>
  //     </div>
  //   );
  // };

  return (
    <Paper elevation={12} style={{ padding: 8, width: '16.25em' }}>
      <Grid container spacing={1} justifyContent='center' alignItems='center'>
        <Grid item xs={12}>
          <FormControl component='fieldset'>
            <FormHelperText sx={{ textAlign: 'center' }}>
              {t('Buy or Sell Bitcoin?')}
            </FormHelperText>
            <div style={{ textAlign: 'center' }}>
              <ButtonGroup>
                <Button
                  size='large'
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
                  size='large'
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
          <Grid alignItems='stretch' style={{ display: 'flex' }}>
            <Grid item>
              <Tooltip
                placement='top'
                enterTouchDelay={500}
                enterDelay={700}
                enterNextDelay={2000}
                title={t('Amount of fiat to exchange for bitcoin')}
              >
                <TextField
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
                    style: { textAlign: 'center' },
                  }}
                  onChange={(e) => setMaker({ amount: e.target.value })}
                />
              </Tooltip>
            </Grid>

            <Grid item>
              <Select
                sx={{ width: '7.5em' }}
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

        <Grid item xs={12}>
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
                  disabled={maker.amountRange}
                  value='explicit'
                  control={<Radio color='secondary' />}
                  label={t('Explicit')}
                  labelPlacement='end'
                  onClick={handleClickExplicit}
                />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <div style={{ display: maker.isExplicit ? '' : 'none' }}>
            <TextField
              fullWidth
              // sx={{ width: `${240 / 16}em` }}
              label={t('Satoshis')}
              error={maker.badSatoshisText != ''}
              helperText={maker.badSatoshisText === '' ? null : maker.badSatoshisText}
              type='number'
              required={true}
              value={maker.satoshis}
              inputProps={{
                min: satoshisLimits[0],
                max: satoshisLimits[1],
                style: { textAlign: 'center' },
              }}
              onChange={handleSatoshisChange}
            />
          </div>
          <div style={{ display: maker.isExplicit ? 'none' : '' }}>
            <TextField
              fullWidth
              // sx={{ width: `${240 / 16}em` }}
              error={maker.badPremiumText != ''}
              helperText={maker.badPremiumText === '' ? null : maker.badPremiumText}
              label={t('Premium over Market (%)')}
              type='number'
              value={maker.premium}
              inputProps={{
                min: -100,
                max: 999,
                style: { textAlign: 'center' },
              }}
              onChange={handlePremiumChange}
            />
          </div>
        </Grid>

        <Grid item>
          <div style={{ display: loadingLimits === true ? '' : 'none' }}>
            <LinearProgress />
          </div>
          <div style={{ display: loadingLimits === false ? '' : 'none' }}>
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
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MakerForm;

// class MakerPage extends Component {
//   defaultCurrency = 1;
//   defaultCurrencyCode = 'USD';
//   defaultPaymentMethod = `not specified`;
//   defaultPremium = 0;
//   defaultMinTradeSats = 20000;
//   defaultMaxTradeSats = 1200000;
//   defaultMaxBondlessSats = 50000;
//   maxRangeAmountMultiple = 7.8;
//   minRangeAmountMultiple = 1.6;

//   constructor(props) {
//     super(props);
//     this.state = {2
//       satoshisLimits[0]: this.defaultMinTradeSats,
//       satoshisLimits[1]: this.defaultMaxTradeSats,
//       maxBondlessSats: this.defaultMaxBondlessSats,
//       tabValue: 0,
//       openStoreToken: false,
//       is_explicit: false,
//       type: null,
//       currency: this.defaultCurrency,
//       currencyCode: this.defaultCurrencyCode,
//       payment_method: this.defaultPaymentMethod,
//       premium: 0,
//       satoshis: '',
//       showAdvanced: false,
//       allowBondless: false,
//       publicExpiryTime: new Date(0, 0, 0, 23, 59),
//       escrowExpiryTime: new Date(0, 0, 0, 3, 0),
//       enableAmountRange: false,
//       bondSize: 3,
//       limits: null,
//       minAmount: '',
//       maxAmount: '',
//       loadingLimits: true,
//       amount: '',
//       badPaymentMethod: '',
//     };
//   }

//   componentDidMount() {
//     this.getLimits();
//     // if currency or type have changed in HomePage state, change in MakerPage state too.
//     this.setState({
//       currency: ! currency === 0 ?  currency : this.state.currency,
//     });
//   }

//   getLimits() {
//     this.setState({ loadingLimits: true });
//     apiClient.get('/api/limits/').then((data) =>
//       this.setState({
//         limits: data,
//         loadingLimits: false,
//         minAmount: maker.amount
//           ? parseFloat((maker.amount / 2).toPrecision(2))
//           : parseFloat(Number(data[this.state.currency].max_amount * 0.25).toPrecision(2)),
//         maxAmount: maker.amount
//           ? maker.amount
//           : parseFloat(Number(data[this.state.currency].max_amount * 0.75).toPrecision(2)),
//         satoshisLimits[0]: data['1000'].min_amount * 100000000,
//         satoshisLimits[1]: data['1000'].max_amount * 100000000,
//         maxBondlessSats: data['1000'].max_bondless_amount * 100000000,
//       }),
//     );
//   }

//   recalcBounds = function {
//     this.setState({
//       minAmount: maker.amount
//         ? parseFloat((maker.amount / 2).toPrecision(2))
//         : parseFloat(
//             Number(this.state.limits[this.state.currency].max_amount * 0.25).toPrecision(2),
//           ),
//       maxAmount: maker.amount
//         ? maker.amount
//         : parseFloat(
//             Number(this.state.limits[this.state.currency].max_amount * 0.75).toPrecision(2),
//           ),
//     });
//   };

//   a11yProps(index) {
//     return {
//       id: `simple-tab-${index}`,
//       'aria-controls': `simple-tabpanel-${index}`,
//     };
//   }

//   handleCurrencyChange = (e) => {
//     const currencyCode = this.getCurrencyCode(e.target.value);
//     this.setState({
//       currency: e.target.value,
//       currencyCode,
//     });
//      setAppState({
//       currency: e.target.value,
//       bookCurrencyCode: currencyCode,
//     });
//     if (this.state.enableAmountRange) {
//       this.setState({
//         minAmount: parseFloat(
//           Number(this.state.limits[e.target.value].max_amount * 0.25).toPrecision(2),
//         ),
//         maxAmount: parseFloat(
//           Number(this.state.limits[e.target.value].max_amount * 0.75).toPrecision(2),
//         ),
//       });
//     }
//   };

//   handleAmountChange = (e) => {
//     this.setState({
//       amount: e.target.value,
//     });
//   };

//   handleMinAmountChange = (e) => {
//     this.setState({
//       minAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
//     });
//   };

//   handleMaxAmountChange = (e) => {
//     this.setState({
//       maxAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
//     });
//   };

//   handleRangeAmountChange = (e, newValue, activeThumb) => {
//     const maxAmount = this.getMaxAmount();
//     const minAmount = this.getMinAmount();
//     let lowerValue = e.target.value[0];
//     let upperValue = e.target.value[1];
//     const minRange = this.minRangeAmountMultiple;
//     const maxRange = this.maxRangeAmountMultiple;

//     if (lowerValue > maxAmount / minRange) {
//       lowerValue = maxAmount / minRange;
//     }
//     if (upperValue < minRange * minAmount) {
//       upperValue = minRange * minAmount;
//     }

//     if (lowerValue > upperValue / minRange) {
//       if (activeThumb === 0) {
//         upperValue = minRange * lowerValue;
//       } else {
//         lowerValue = upperValue / minRange;
//       }
//     } else if (lowerValue < upperValue / maxRange) {
//       if (activeThumb === 0) {
//         upperValue = maxRange * lowerValue;
//       } else {
//         lowerValue = upperValue / maxRange;
//       }
//     }

//     this.setState({
//       minAmount: parseFloat(Number(lowerValue).toPrecision(lowerValue < 100 ? 2 : 3)),
//       maxAmount: parseFloat(Number(upperValue).toPrecision(upperValue < 100 ? 2 : 3)),
//     });
//   };

//   handlePaymentMethodChange = (value) => {
//     if (value.length > 50) {
//       this.setState({
//         badPaymentMethod: true,
//       });
//     } else {
//       this.setState({
//         payment_method: value.substring(0, 53),
//         badPaymentMethod: value.length > 50,
//       });
//     }
//   };

//   handlePremiumChange = (e) => {
//     const { t } = this.props;
//     const max = 999;
//     const min = -100;
//     let premium = e.target.value;
//     if (e.target.value > 999) {
//       var bad_premium = t('Must be less than {{max}}%', { max });
//     }
//     if (e.target.value <= -100) {
//       var bad_premium = t('Must be more than {{min}}%', { min });
//     }

//     if (premium == '') {
//       premium = 0;
//     } else {
//       premium = Number(Math.round(premium + 'e' + 2) + 'e-' + 2);
//     }
//     this.setState({
//       premium,
//       badPremium: bad_premium,
//     });
//   };

//   handleSatoshisChange = (e) => {
//     const { t } = this.props;
//     if (e.target.value > this.state.satoshisLimits[1]) {
//       var bad_sats = t('Must be less than {{maxSats}', { maxSats: pn(this.state.satoshisLimits[1]) });
//     }
//     if (e.target.value < this.state.satoshisLimits[0]) {
//       var bad_sats = t('Must be more than {{minSats}}', { minSats: pn(this.state.satoshisLimits[0]) });
//     }

//     this.setState({
//       satoshis: e.target.value,
//       badSatoshis: bad_sats,
//     });
//   };

//   handleClickRelative = (e) => {
//     this.setState({
//       is_explicit: false,
//     });
//     this.handlePremiumChange();
//   };

//   handleClickExplicit = (e) => {
//     if (!this.state.enableAmountRange) {
//       this.setState({
//         is_explicit: true,
//       });
//       this.handleSatoshisChange();
//     }
//   };

//   handleCreateOfferButtonPressed = function {
//     maker.amount == null ? this.setState({ amount: 0 }) : null;
//     const body = {
//       type:  type == 0 ? 1 : 0,
//       currency: this.state.currency,
//       amount: this.state.has_range ? null : maker.amount,
//       has_range: this.state.enableAmountRange,
//       min_amount: this.state.minAmount,
//       max_amount: this.state.maxAmount,
//       payment_method:
//         this.state.payment_method === '' ? this.defaultPaymentMethod : this.state.payment_method,
//       is_explicit: this.state.is_explicit,
//       premium: this.state.is_explicit ? null : this.state.premium == '' ? 0 : this.state.premium,
//       satoshis: this.state.is_explicit ? this.state.satoshis : null,
//       public_duration: this.state.publicDuration,
//       escrow_duration: this.state.escrowDuration,
//       bond_size: this.state.bondSize,
//       bondless_taker: this.state.allowBondless,
//     };
//     apiClient
//       .post('/api/make/', body)
//       .then(
//         (data) =>
//           this.setState({ badRequest: data.bad_request }) &
//           (data.id ?  history.push('/order/' + data.id) : ''),
//       );
//     this.setState({ openStoreToken: false });
//   };

//   getCurrencyCode(val) {
//     return currencyDict[val.toString()];
//   }

//   handleInputBondSizeChange = (event) => {
//     this.setState({ bondSize: event.target.value === '' ? 1 : Number(event.target.value) });
//   };

//   priceNow = function {
//     if (this.state.loadingLimits) {
//       return '...';
//     } else if (this.state.is_explicit & (maker.amount > 0) & (this.state.satoshis > 0)) {
//       return parseFloat(
//         Number(maker.amount / (this.state.satoshis / 100000000)).toPrecision(5),
//       );
//     } else if (!this.state.is_explicit) {
//       const price = this.state.limits[this.state.currency].price;
//       return parseFloat(Number(price * (1 + this.state.premium / 100)).toPrecision(5));
//     }
//     return '...';
//   };

//   StandardMakerOptions = function {
//     const { t } = this.props;
//     return (
//       <Paper elevation={12} style={{ padding: 8, width: `${260 / 16}em`, align: 'center' }}>
//         <Grid item xs={12} align='center'>
//           <FormControl component='fieldset'>
//             <FormHelperText sx={{ textAlign: 'center' }}>
//               {t('Buy or Sell Bitcoin?')}
//             </FormHelperText>
//             <div style={{ textAlign: 'center' }}>
//               <ButtonGroup>
//                 <Button
//                   size='large'
//                   variant='contained'
//                   onClick={() =>
//                      setAppState({
//                       type: 1,
//                     })
//                   }
//                   disableElevation={ type == 1}
//                   sx={{
//                     backgroundColor:  type == 1 ? 'primary.main' : 'background.paper',
//                     color:  type == 1 ? 'background.paper' : 'text.secondary',
//                     ':hover': {
//                       color: 'background.paper',
//                     },
//                   }}
//                 >
//                   {t('Buy')}
//                 </Button>
//                 <Button
//                   size='large'
//                   variant='contained'
//                   onClick={() =>
//                      setAppState({
//                       type: 0,
//                     })
//                   }
//                   disableElevation={ type == 0}
//                   color='secondary'
//                   sx={{
//                     backgroundColor:  type == 0 ? 'secondary.main' : 'background.paper',
//                     color:  type == 0 ? 'background.secondary' : 'text.secondary',
//                     ':hover': {
//                       color: 'background.paper',
//                     },
//                   }}
//                 >
//                   {t('Sell')}
//                 </Button>
//               </ButtonGroup>
//             </div>
//           </FormControl>
//           <div style={{ height: '1em' }} />
//         </Grid>

//         <Grid alignItems='stretch' style={{ display: 'flex' }}>
//           <div>
//             <Tooltip
//               placement='top'
//               enterTouchDelay={500}
//               enterDelay={700}
//               enterNextDelay={2000}
//               title={t('Amount of fiat to exchange for bitcoin')}
//             >
//               <TextField
//                 disabled={this.state.enableAmountRange}
//                 variant={this.state.enableAmountRange ? 'filled' : 'outlined'}
//                 error={
//                   !!(
//                     (maker.amount < this.getMinAmount() ||
//                       maker.amount > this.getMaxAmount()) &
//                     (maker.amount != '')
//                   )
//                 }
//                 helperText={
//                   (maker.amount < this.getMinAmount()) & (maker.amount != '')
//                     ? t('Must be more than {{minAmount}}', { minAmount: this.getMinAmount() })
//                     : (maker.amount > this.getMaxAmount()) & (maker.amount != '')
//                     ? t('Must be less than {{maxAmount}}', { maxAmount: this.getMaxAmount() })
//                     : null
//                 }
//                 label={t('Amount')}
//                 type='number'
//                 required={true}
//                 value={maker.amount}
//                 inputProps={{
//                   min: 0,
//                   style: { textAlign: 'center' },
//                 }}
//                 onChange={this.handleAmountChange}
//               />
//             </Tooltip>
//           </div>
//           <div>
//             <Select
//               sx={{ width: `${120 / 16}em` }}
//               required={true}
//               defaultValue={this.defaultCurrency}
//               inputProps={{
//                 style: { textAlign: 'center' },
//               }}
//               onChange={this.handleCurrencyChange}
//             >
//               {Object.entries(currencyDict).map(([key, value]) => (
//                 <MenuItem key={key} value={parseInt(key)}>
//                   <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
//                     <FlagWithProps code={value} />
//                     {' ' + value}
//                   </div>
//                 </MenuItem>
//               ))}
//             </Select>
//           </div>
//         </Grid>
//         <Grid item xs={12} align='center'>
//           <AutocompletePayments
//             onAutocompleteChange={this.handlePaymentMethodChange}
//             optionsType={this.state.currency == 1000 ? 'swap' : 'fiat'}
//             error={this.state.badPaymentMethod}
//             helperText={this.state.badPaymentMethod ? t('Must be shorter than 65 characters') : ''}
//             label={
//               this.state.currency == 1000 ? t('Swap Destination(s)') : t('Fiat Payment Method(s)')
//             }
//             tooltipTitle={t(
//               'Enter your preferred fiat payment methods. Fast methods are highly recommended.',
//             )}
//             listHeaderText={t('You can add new methods')}
//             addNewButtonText={t('Add New')}
//           />
//           <div style={{ height: '0.3em' }} />
//         </Grid>

//         <Grid item xs={12} align='center'>
//           <FormControl component='fieldset'>
//             <FormHelperText sx={{ textAlign: 'center', position: 'relative', top: '0.5em' }}>
//               {t('Choose a Pricing Method')}
//             </FormHelperText>
//             <RadioGroup row defaultValue='relative'>
//               <Tooltip
//                 placement='top'
//                 enterTouchDelay={0}
//                 enterDelay={1000}
//                 enterNextDelay={2000}
//                 title={t('Let the price move with the market')}
//               >
//                 <FormControlLabel
//                   value='relative'
//                   control={<Radio color='primary' />}
//                   label={t('Relative')}
//                   labelPlacement='end'
//                   onClick={this.handleClickRelative}
//                 />
//               </Tooltip>
//               <Tooltip
//                 placement='top'
//                 enterTouchDelay={0}
//                 enterDelay={1000}
//                 enterNextDelay={2000}
//                 title={t('Set a fix amount of satoshis')}
//               >
//                 <FormControlLabel
//                   disabled={this.state.enableAmountRange}
//                   value='explicit'
//                   control={<Radio color='secondary' />}
//                   label={t('Explicit')}
//                   labelPlacement='end'
//                   onClick={this.handleClickExplicit}
//                 />
//               </Tooltip>
//             </RadioGroup>
//           </FormControl>
//         </Grid>
//         {/* conditional shows either Premium % field or Satoshis field based on pricing method */}
//         <Grid item xs={12} align='center'>
//           <div style={{ display: this.state.is_explicit ? '' : 'none' }}>
//             <TextField
//               sx={{ width: `${240 / 16}em` }}
//               label={t('Satoshis')}
//               error={!!this.state.badSatoshis}
//               helperText={this.state.badSatoshis}
//               type='number'
//               required={true}
//               value={this.state.satoshis}
//               inputProps={{
//                 min: this.state.satoshisLimits[0],
//                 max: this.state.satoshisLimits[1],
//                 style: { textAlign: 'center' },
//               }}
//               onChange={this.handleSatoshisChange}
//             />
//           </div>
//           <div style={{ display: this.state.is_explicit ? 'none' : '' }}>
//             <TextField
//               sx={{ width: `${240 / 16}em` }}
//               error={this.state.badPremium}
//               helperText={this.state.badPremium}
//               label={t('Premium over Market (%)')}
//               type='number'
//               inputProps={{
//                 min: -100,
//                 max: 999,
//                 style: { textAlign: 'center' },
//               }}
//               onChange={this.handlePremiumChange}
//             />
//           </div>
//           <Grid item>
//             <div style={{ display: this.state.loadingLimits == true ? '' : 'none' }}>
//               <div style={{ height: 4 }} />
//               <LinearProgress />
//             </div>
//             <div style={{ display: this.state.loadingLimits == false ? '' : 'none' }}>
//               <Tooltip
//                 placement='top'
//                 enterTouchDelay={0}
//                 enterDelay={1000}
//                 enterNextDelay={2000}
//                 title={
//                   this.state.is_explicit
//                     ? t('Your order fixed exchange rate')
//                     : t("Your order's current exchange rate. Rate will move with the market.")
//                 }
//               >
//                 <Typography variant='caption' color='text.secondary'>
//                   {(this.state.is_explicit ? t('Order rate:') : t('Order current rate:')) +
//                     ' ' +
//                     pn(this.priceNow()) +
//                     ' ' +
//                     this.state.currencyCode +
//                     '/BTC'}
//                 </Typography>
//               </Tooltip>
//             </div>
//           </Grid>
//         </Grid>
//       </Paper>
//     );
//   };

//   handleChangePublicDuration = (date) => {
//     const d = new Date(date);
//     const hours = d.getHours();
//     const minutes = d.getMinutes();

//     const total_secs = hours * 60 * 60 + minutes * 60;

//     this.setState({
//       publicExpiryTime: date,
//       publicDuration: total_secs,
//     });
//   };

//   handleChangeEscrowDuration = (date) => {
//     const d = new Date(date);
//     const hours = d.getHours();
//     const minutes = d.getMinutes();

//     const total_secs = hours * 60 * 60 + minutes * 60;

//     this.setState({
//       escrowExpiryTime: date,
//       escrowDuration: total_secs,
//     });
//   };

//   getMaxAmount = function {
//     if (this.state.limits == null) {
//       var max_amount = null;
//     } else {
//       var max_amount =
//         this.state.limits[this.state.currency].max_amount * (1 + this.state.premium / 100);
//     }
//     // times 0.98 to allow a bit of margin with respect to the backend minimum
//     return parseFloat(Number(max_amount * 0.98).toPrecision(2));
//   };

//   getMinAmount = function {
//     if (this.state.limits == null) {
//       var min_amount = null;
//     } else {
//       var min_amount =
//         this.state.limits[this.state.currency].min_amount * (1 + this.state.premium / 100);
//     }
//     // times 1.1 to allow a bit of margin with respect to the backend minimum
//     return parseFloat(Number(min_amount * 1.1).toPrecision(2));
//   };

//   RangeThumbComponent(props) {
//     const { children, ...other } = props;
//     return (
//       <SliderThumb {...other}>
//         {children}
//         <span className='range-bar' />
//         <span className='range-bar' />
//         <span className='range-bar' />
//       </SliderThumb>
//     );
//   }

//   minAmountError = function {
//     return (
//       this.state.minAmount < this.getMinAmount() ||
//       this.state.maxAmount < this.state.minAmount ||
//       this.state.minAmount < this.state.maxAmount / (this.maxRangeAmountMultiple + 0.15) ||
//       this.state.minAmount * (this.minRangeAmountMultiple - 0.1) > this.state.maxAmount
//     );
//   };

//   maxAmountError = function {
//     return (
//       this.state.maxAmount > this.getMaxAmount() ||
//       this.state.maxAmount < this.state.minAmount ||
//       this.state.minAmount < this.state.maxAmount / (this.maxRangeAmountMultiple + 0.15) ||
//       this.state.minAmount * (this.minRangeAmountMultiple - 0.1) > this.state.maxAmount
//     );
//   };

//   rangeText = function {
//     const { t } = this.props;
//     return (
//       <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
//         <span style={{ width: t('From').length * 8 + 2, textAlign: 'left' }}>{t('From')}</span>
//         <TextField
//           variant='standard'
//           type='number'
//           size='small'
//           value={this.state.minAmount}
//           onChange={this.handleMinAmountChange}
//           error={this.minAmountError()}
//           sx={{ width: this.state.minAmount.toString().length * 9, maxWidth: 40 }}
//         />
//         <span style={{ width: t('to').length * 8, textAlign: 'center' }}>{t('to')}</span>
//         <TextField
//           variant='standard'
//           size='small'
//           type='number'
//           value={this.state.maxAmount}
//           error={this.maxAmountError()}
//           onChange={this.handleMaxAmountChange}
//           sx={{ width: this.state.maxAmount.toString().length * 9, maxWidth: 50 }}
//         />
//         <span style={{ width: this.state.currencyCode.length * 9 + 3, textAlign: 'right' }}>
//           {this.state.currencyCode}
//         </span>
//       </div>
//     );
//   };

//   AdvancedMakerOptions = function {
//     const { t } = this.props;
//     return (
//       <Paper elevation={12} style={{ padding: 8, width: `${280 / 16}em`, align: 'center' }}>
//         <Grid container spacing={1}>
//           <Grid item xs={12} align='center'>
//             <FormControl align='center'>
//               <Tooltip
//                 enterTouchDelay={0}
//                 placement='top'
//                 align='center'
//                 title={t('Let the taker chose an amount within the range')}
//               >
//                 <FormHelperText
//                   align='center'
//                   style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}
//                 >
//                   <Checkbox
//                     onChange={(e) =>
//                       this.setState({ enableAmountRange: e.target.checked, is_explicit: false }) &
//                       this.recalcBounds()
//                     }
//                   />
//                   {this.state.enableAmountRange & (this.state.minAmount != null)
//                     ? this.rangeText()
//                     : t('Enable Amount Range')}
//                 </FormHelperText>
//               </Tooltip>
//               <div style={{ display: this.state.loadingLimits == true ? '' : 'none' }}>
//                 <LinearProgress />
//               </div>
//               <div style={{ display: this.state.loadingLimits == false ? '' : 'none' }}>
//                 <RangeSlider
//                   disableSwap={true}
//                   sx={{ width: `${200 / 16}em`, align: 'center' }}
//                   disabled={!this.state.enableAmountRange || this.state.loadingLimits}
//                   value={[Number(this.state.minAmount), Number(this.state.maxAmount)]}
//                   step={(this.getMaxAmount() - this.getMinAmount()) / 5000}
//                   valueLabelDisplay='auto'
//                   components={{ Thumb: this.RangeThumbComponent }}
//                   valueLabelFormat={(x) =>
//                     parseFloat(Number(x).toPrecision(x < 100 ? 2 : 3)) +
//                     ' ' +
//                     this.state.currencyCode
//                   }
//                   marks={
//                     this.state.limits == null
//                       ? null
//                       : [
//                           {
//                             value: this.getMinAmount(),
//                             label: this.getMinAmount() + ' ' + this.state.currencyCode,
//                           },
//                           {
//                             value: this.getMaxAmount(),
//                             label: this.getMaxAmount() + ' ' + this.state.currencyCode,
//                           },
//                         ]
//                   }
//                   min={this.getMinAmount()}
//                   max={this.getMaxAmount()}
//                   onChange={this.handleRangeAmountChange}
//                 />
//               </div>
//             </FormControl>
//           </Grid>

//           <Grid item xs={12} align='center'>
//             <Accordion
//               defaultExpanded={true}
//               elevation={0}
//               sx={{ width: '17.5em', position: 'relative', left: '-8px' }}
//             >
//               <AccordionSummary expandIcon={<ExpandMoreIcon color='primary' />}>
//                 <Typography sx={{ flexGrow: 1, textAlign: 'center' }} color='text.secondary'>
//                   {t('Expiry Timers')}
//                 </Typography>
//               </AccordionSummary>
//               <AccordionDetails>
//                 <Grid container spacing={1}>
//                   <Grid item xs={12} align='center'>
//                     <LocalizationProvider dateAdapter={DateFnsUtils}>
//                       <TimePicker
//                         sx={{ align: 'center' }}
//                         ampm={false}
//                         openTo='hours'
//                         views={['hours', 'minutes']}
//                         inputFormat='HH:mm'
//                         mask='__:__'
//                         components={{
//                           OpenPickerIcon: HourglassTopIcon,
//                         }}
//                         open={this.state.openTimePicker}
//                         InputProps={{
//                           endAdornment: (
//                             <InputAdornment position='end'>
//                               <HourglassTopIcon />
//                             </InputAdornment>
//                           ),
//                         }}
//                         renderInput={(props) => <TextField {...props} />}
//                         label={t('Public Duration (HH:mm)')}
//                         value={this.state.publicExpiryTime}
//                         onChange={this.handleChangePublicDuration}
//                         minTime={new Date(0, 0, 0, 0, 10)}
//                         maxTime={new Date(0, 0, 0, 23, 59)}
//                       />
//                     </LocalizationProvider>
//                   </Grid>

//                   <Grid item xs={12} align='center'>
//                     <LocalizationProvider dateAdapter={DateFnsUtils}>
//                       <TimePicker
//                         sx={{ align: 'center' }}
//                         ampm={false}
//                         openTo='hours'
//                         views={['hours', 'minutes']}
//                         inputFormat='HH:mm'
//                         mask='__:__'
//                         components={{
//                           OpenPickerIcon: HourglassTopIcon,
//                         }}
//                         open={this.state.openTimePicker}
//                         InputProps={{
//                           endAdornment: (
//                             <InputAdornment position='end'>
//                               <HourglassTopIcon />
//                             </InputAdornment>
//                           ),
//                         }}
//                         renderInput={(props) => <TextField {...props} />}
//                         label={t('Escrow Deposit Time-Out (HH:mm)')}
//                         value={this.state.escrowExpiryTime}
//                         onChange={this.handleChangeEscrowDuration}
//                         minTime={new Date(0, 0, 0, 1, 0)}
//                         maxTime={new Date(0, 0, 0, 8, 0)}
//                       />
//                     </LocalizationProvider>
//                   </Grid>
//                 </Grid>
//               </AccordionDetails>
//             </Accordion>
//           </Grid>

//           <Grid item xs={12} align='center'>
//             <FormControl align='center'>
//               <Tooltip
//                 enterDelay={800}
//                 enterTouchDelay={0}
//                 placement='top'
//                 title={t('Set the skin-in-the-game, increase for higher safety assurance')}
//               >
//                 <FormHelperText
//                   align='center'
//                   sx={{ display: 'flex', flexWrap: 'wrap', transform: 'translate(20%, 0)' }}
//                 >
//                   {t('Fidelity Bond Size')}{' '}
//                   <LockIcon sx={{ height: `${20 / 24}em`, width: `${20 / 24}em` }} />
//                 </FormHelperText>
//               </Tooltip>
//               <Slider
//                 sx={{ width: `${220 / 16}em`, align: 'center' }}
//                 aria-label='Bond Size (%)'
//                 defaultValue={3}
//                 valueLabelDisplay='auto'
//                 valueLabelFormat={(x) => x + '%'}
//                 step={0.25}
//                 marks={[
//                   { value: 2, label: '2%' },
//                   { value: 5, label: '5%' },
//                   { value: 10, label: '10%' },
//                   { value: 15, label: '15%' },
//                 ]}
//                 min={2}
//                 max={15}
//                 onChange={(e) => this.setState({ bondSize: e.target.value })}
//               />
//             </FormControl>
//           </Grid>

//           <Grid item xs={12} align='center'>
//             <Tooltip
//               enterTouchDelay={0}
//               title={t('COMING SOON - High risk! Limited to {{limitSats}}K Sats', {
//                 limitSats: this.state.maxBondlessSats / 1000,
//               })}
//             >
//               <FormControlLabel
//                 label={t('Allow bondless takers')}
//                 control={
//                   <Checkbox
//                     disabled
//                     // disabled={ type==0 ||  type === null}
//                     color='secondary'
//                     checked={this.state.allowBondless}
//                     onChange={() => this.setState({ allowBondless: !this.state.allowBondless })}
//                   />
//                 }
//               />
//             </Tooltip>
//           </Grid>
//         </Grid>
//       </Paper>
//     );
//   };

//   makeOrderBox = function {
//     const { t } = this.props;
//     return (
//       <Box sx={{ width: this.state.tabValue == 1 ? `${270 / 16}em` : `${252 / 16}em` }}>
//         <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'relative', left: '5px' }}>
//           <Tabs value={this.state.tabValue} variant='fullWidth'>
//             <Tab
//               label={t('Order')}
//               {...this.a11yProps(0)}
//               onClick={() => this.setState({ tabValue: 0 })}
//             />
//             <Tab
//               label={t('Customize')}
//               {...this.a11yProps(1)}
//               onClick={() => this.setState({ tabValue: 1 })}
//             />
//           </Tabs>
//         </Box>
//         <Grid item xs={12} align='center'>
//           <div style={{ display: this.state.tabValue == 0 ? '' : 'none' }}>
//             {this.StandardMakerOptions()}
//           </div>
//           <div style={{ display: this.state.tabValue == 1 ? '' : 'none' }}>
//             {this.AdvancedMakerOptions()}
//           </div>
//         </Grid>
//       </Box>
//     );
//   };

//   render() {
//     const { t } = this.props;
//     return (
//       <Grid container align='center' spacing={1} sx={{ minWidth: '60%' }}>
//         {getCookie('robot_token') ? (
//           <StoreTokenDialog
//             open={this.state.openStoreToken}
//             onClose={() => this.setState({ openStoreToken: false })}
//             onClickCopy={() =>
//               copyToClipboard(getCookie('robot_token')) &
//                setAppState({ copiedToken: true })
//             }
//             copyIconColor={ copiedToken ? 'inherit' : 'primary'}
//             onClickBack={() => this.setState({ openStoreToken: false })}
//             onClickDone={this.handleCreateOfferButtonPressed}
//           />
//         ) : (
//           <NoRobotDialog
//             open={this.state.openStoreToken}
//             onClose={() => this.setState({ openStoreToken: false })}
//           />
//         )}

//         <Grid item xs={12} align='center'>
//           {this.makeOrderBox()}
//         </Grid>

//         <Grid item xs={12} align='center'>
//           {/* conditions to disable the make button */}
//           { type == null ||
//           (maker.amount == null) &
//             (this.state.enableAmountRange == false || this.state.loadingLimits) ||
//           this.state.enableAmountRange & (this.minAmountError() || this.maxAmountError()) ||
//           (maker.amount <= 0) & !this.state.enableAmountRange ||
//           this.state.is_explicit &
//             (this.state.badSatoshis != null || this.state.satoshis == null) ||
//           !this.state.is_explicit & (this.state.badPremium != null) ? (
//             <Tooltip enterTouchDelay={0} title={t('You must fill the order correctly')}>
//               <div>
//                 <Button disabled color='primary' variant='contained'>
//                   {t('Create Order')}
//                 </Button>
//               </div>
//             </Tooltip>
//           ) : (
//             <Button
//               color='primary'
//               variant='contained'
//               onClick={
//                  copiedToken
//                   ? this.handleCreateOfferButtonPressed
//                   : () => this.setState({ openStoreToken: true })
//               }
//             >
//               {t('Create Order')}
//             </Button>
//           )}
//         </Grid>
//         <Grid item xs={12} align='center'>
//           {this.state.badRequest ? (
//             <Typography component='h2' variant='subtitle2' color='secondary'>
//               {this.state.badRequest} <br />
//             </Typography>
//           ) : (
//             ''
//           )}
//           <Typography component='h2' variant='subtitle2'>
//             <div align='center'>
//               { type == null
//                 ? t('Create an order for ')
//                 :  type == 1
//                 ? t('Create a BTC buy order for ')
//                 : t('Create a BTC sell order for ')}
//               {this.state.enableAmountRange & (this.state.minAmount != null)
//                 ? this.state.minAmount + '-' + this.state.maxAmount
//                 : pn(maker.amount)}
//               {' ' + this.state.currencyCode}
//               {this.state.is_explicit
//                 ? t(' of {{satoshis}} Satoshis', { satoshis: pn(this.state.satoshis) })
//                 : this.state.premium == 0
//                 ? t(' at market price')
//                 : this.state.premium > 0
//                 ? t(' at a {{premium}}% premium', { premium: this.state.premium })
//                 : t(' at a {{discount}}% discount', { discount: -this.state.premium })}
//             </div>
//           </Typography>
//           <Grid item xs={12} align='center'>
//             <Button color='secondary' variant='contained' to='/' component={LinkRouter}>
//               {t('Back')}
//             </Button>
//           </Grid>
//         </Grid>
//       </Grid>
//     );
//   }
// }

// export default withTranslation()(MakerPage);
