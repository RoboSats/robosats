import React, { Component } from 'react';
import { withTranslation } from "react-i18next";
import { InputAdornment, LinearProgress, Dialog, IconButton, DialogActions, DialogContent, DialogContentText, DialogTitle, Accordion, AccordionDetails, AccordionSummary, Checkbox, Slider, Box, Tab, Tabs, SliderThumb, Tooltip, Paper, Button , Grid, Typography, TextField, Select, FormHelperText, MenuItem, FormControl, Radio, FormControlLabel, RadioGroup} from "@mui/material"
import { LocalizationProvider, TimePicker}  from '@mui/lab';
import DateFnsUtils from "@date-io/date-fns";
import { Link as LinkRouter } from 'react-router-dom'
import { styled } from '@mui/material/styles';

import getFlags from './getFlags';
import AutocompletePayments from './AutocompletePayments';
import currencyDict from '../../static/assets/currencies.json';

//icons
import LockIcon from '@mui/icons-material/Lock';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuySatsIcon from "./icons/BuySatsIcon";
import BuySatsCheckedIcon from "./icons/BuySatsCheckedIcon";
import SellSatsIcon from "./icons/SellSatsIcon";
import SellSatsCheckedIcon from "./icons/SellSatsCheckedIcon";
import ContentCopy from "@mui/icons-material/ContentCopy";

import { getCookie } from "../utils/cookies";
import { pn } from "../utils/prettyNumbers";


class MakerPage extends Component {
  defaultCurrency = 1;
  defaultCurrencyCode = 'USD';
  defaultPaymentMethod = "not specified";
  defaultPremium = 0;
  defaultMinTradeSats = 20000;
  defaultMaxTradeSats = 1200000;
  defaultMaxBondlessSats = 50000;
  maxRangeAmountMultiple = 4.8;
  minRangeAmountMultiple = 1.6;

  constructor(props) {
    super(props);
    this.state={
        minTradeSats: this.defaultMinTradeSats,
        maxTradeSats: this.defaultMaxTradeSats,
        maxBondlessSats: this.defaultMaxBondlessSats,
        is_explicit: false,
        type: 0,
        currency: this.defaultCurrency,
        currencyCode: this.defaultCurrencyCode,
        payment_method: this.defaultPaymentMethod,
        premium: 0,
        satoshis: null,
        showAdvanced: false,
        allowBondless: false,
        publicExpiryTime: new Date(0, 0, 0, 23, 59),
        escrowExpiryTime: new Date(0, 0, 0, 3, 0),
        enableAmountRange: false,
        minAmount: null,
        bondSize: 1,
        limits: null,
        minAmount: null,
        maxAmount: null,
        loadingLimits: true,
    }
    this.getLimits()
  }

  getLimits() {
    this.setState({loadingLimits:true})
    fetch('/api/limits/')
      .then((response) => response.json())
      .then((data) => this.setState({
          limits:data,
          loadingLimits:false,
          minAmount: this.state.amount ? parseFloat((this.state.amount/2).toPrecision(2)) : parseFloat(Number(data[this.state.currency]['max_amount']*0.25).toPrecision(2)),
          maxAmount: this.state.amount ? this.state.amount : parseFloat(Number(data[this.state.currency]['max_amount']*0.75).toPrecision(2)),
          minTradeSats: data["1000"]['min_amount']*100000000,
          maxTradeSats: data["1000"]['max_amount']*100000000,
          maxBondlessSats: data["1000"]['max_bondless_amount']*100000000,
        }));
  }

  a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  handleTypeChange=(e)=>{
      this.setState({
          type: e.target.value,
      });
  }
  handleCurrencyChange=(e)=>{
    this.setState({
        currency: e.target.value,
        currencyCode: this.getCurrencyCode(e.target.value),
    });
    if(this.state.enableAmountRange){
        this.setState({
            minAmount: parseFloat(Number(this.state.limits[e.target.value]['max_amount']*0.25).toPrecision(2)),
            maxAmount: parseFloat(Number(this.state.limits[e.target.value]['max_amount']*0.75).toPrecision(2)),
        })
    }
}
    handleAmountChange=(e)=>{
        this.setState({
            amount: e.target.value,
        });
    }
    handleMinAmountChange=(e)=>{
        this.setState({
            minAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
        });
    }
    handleMaxAmountChange=(e)=>{
        this.setState({
            maxAmount: parseFloat(Number(e.target.value).toPrecision(e.target.value < 100 ? 2 : 3)),
        });
    }

    handleRangeAmountChange = (e, newValue, activeThumb) => {
        var maxAmount = this.getMaxAmount();
        var minAmount = this.getMinAmount();
        var lowerValue = e.target.value[0];
        var upperValue = e.target.value[1];
        var minRange = this.minRangeAmountMultiple;
        var maxRange = this.maxRangeAmountMultiple;

        if (lowerValue > maxAmount/minRange){
            lowerValue = maxAmount/minRange
        }
        if (upperValue < minRange*minAmount){
            upperValue = minRange*minAmount
        }

        if (lowerValue > upperValue/minRange) {
            if (activeThumb === 0) {
                upperValue = minRange*lowerValue
            } else {
                lowerValue = upperValue/minRange
            }
        }else if(lowerValue < upperValue/maxRange){
            if (activeThumb === 0) {
                upperValue = maxRange*lowerValue
            } else {
                lowerValue = upperValue/maxRange
            }
        }

        this.setState({
            minAmount: parseFloat(Number(lowerValue).toPrecision(lowerValue < 100 ? 2 : 3)),
            maxAmount: parseFloat(Number(upperValue).toPrecision(upperValue < 100 ? 2 : 3)),
        });
    }

    handlePaymentMethodChange=(value)=>{
        if (value.length > 50){
            this.setState({
                badPaymentMethod: true,
            });
        }else{
        this.setState({
            payment_method: value.substring(0,53),
            badPaymentMethod: value.length > 50,
        });
    }
    }

    handlePremiumChange=(e)=>{
        const { t } = this.props;
        var max = 999;
        var min = -100;
        if(e.target.value > 999){
            var bad_premium = t("Must be less than {{max}}%", {max:max})
        }
        if(e.target.value <= -100){
            var bad_premium = t("Must be more than {{min}}%", {min:min})
        }

        this.setState({
            premium: e.target.value,
            badPremium: bad_premium,
        });
    }

    handleSatoshisChange=(e)=>{
        const { t } = this.props;
        if(e.target.value > this.state.maxTradeSats){
            var bad_sats = t("Must be less than {{maxSats}",{maxSats: pn(this.state.maxTradeSats)})
        }
        if(e.target.value < this.state.minTradeSats){
            var bad_sats = t("Must be more than {{minSats}}",{minSats: pn(this.state.minTradeSats)})
        }

        this.setState({
            satoshis: e.target.value,
            badSatoshis: bad_sats,
        });
    }
    handleClickRelative=(e)=>{
        this.setState({
            is_explicit: false,
        });
        this.handlePremiumChange();
    }

    handleClickExplicit=(e)=>{
        if(!this.state.enableAmountRange){
            this.setState({
                is_explicit: true,
            });
            this.handleSatoshisChange();
        }
    }

    handleCreateOfferButtonPressed=()=>{
        this.state.amount == null ? this.setState({amount: 0}) : null;
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({
                type: this.state.type,
                currency: this.state.currency,
                amount: this.state.has_range ? null : this.state.amount,
                has_range: this.state.enableAmountRange,
                min_amount: this.state.minAmount,
                max_amount: this.state.maxAmount,
                payment_method: this.state.payment_method,
                is_explicit: this.state.is_explicit,
                premium: this.state.is_explicit ? null: this.state.premium,
                satoshis: this.state.is_explicit ? this.state.satoshis: null,
                public_duration: this.state.publicDuration,
                escrow_duration: this.state.escrowDuration,
                bond_size: this.state.bondSize,
                bondless_taker: this.state.allowBondless,
            }),
        };
        fetch("/api/make/",requestOptions)
        .then((response) => response.json())
        .then((data) => (this.setState({badRequest:data.bad_request})
             & (data.id ? this.props.history.push('/order/' + data.id) :"")));
        this.setState({openStoreToken:false});
    }

    getCurrencyCode(val){
        return currencyDict[val.toString()]
    }

    handleInputBondSizeChange = (event) => {
        this.setState({bondSize: event.target.value === '' ? 1 : Number(event.target.value)});
    };

    priceNow = () => {
        if (this.state.loadingLimits){
            return "...";
        }
        else if (this.state.is_explicit & this.state.amount > 0 & this.state.satoshis > 0){
            return parseFloat(Number(this.state.amount / (this.state.satoshis/100000000)).toPrecision(5));
        }
        else if (!this.state.is_explicit){
            var price = this.state.limits[this.state.currency]['price'];
            return parseFloat(Number(price*(1+this.state.premium/100)).toPrecision(5));
        }
        return "...";
    }

    StandardMakerOptions = () => {
        const { t } = this.props;
        return(
            <Paper elevation={12} style={{ padding: 8, width:'260px', align:'center'}}>
            <Grid item xs={12} align="center" spacing={1}>
                <div style={{position:'relative', left:'5px'}}>
                <FormControl component="fieldset">
                    <FormHelperText sx={{textAlign:"center"}}>
                        {t("Buy or Sell Bitcoin?")}
                    </FormHelperText>

                    <RadioGroup row defaultValue="0" onChange={this.handleTypeChange}>
                        <FormControlLabel
                            value="0"
                            control={<Radio icon={<BuySatsIcon sx={{width:"30px",height:"30px"}} color="text.secondary"/>} checkedIcon={<BuySatsCheckedIcon sx={{width:"30px",height:"30px"}} color="primary"/>}/>}
                            label={this.state.type == 0 ? <Typography color="primary"><b>{t("Buy")}</b></Typography>: <Typography color="text.secondary">{t("Buy")}</Typography>}
                            labelPlacement="end"
                        />
                        <FormControlLabel
                            value="1"
                            control={<Radio color="secondary" icon={<SellSatsIcon sx={{width:"30px",height:"30px"}} color="text.secondary"/>} checkedIcon={<SellSatsCheckedIcon sx={{width:"30px",height:"30px"}} color="secondary"/>}/>}
                            label={this.state.type == 1 ? <Typography color="secondary"><b>{t("Sell")}</b></Typography>: <Typography color="text.secondary">{t("Sell")}</Typography>}
                            labelPlacement="end"
                        />
                    </RadioGroup>
                </FormControl>
                </div>
            </Grid>

            <Grid containter xs={12} alignItems="stretch" style={{ display: "flex" }}>
                    <div style={{maxWidth:150}}>
                    <Tooltip placement="top" enterTouchDelay="500" enterDelay="700" enterNextDelay="2000" title={t("Amount of fiat to exchange for bitcoin")}>
                        <TextField
                            disabled = {this.state.enableAmountRange}
                            variant = {this.state.enableAmountRange ? 'filled' : 'outlined'}
                            error={(this.state.amount <= this.getMinAmount() || this.state.amount >= this.getMaxAmount()) & this.state.amount != "" }
                            helperText={this.state.amount <= this.getMinAmount() & this.state.amount != "" ? t("Too low") 
                                : (this.state.amount >= this.getMaxAmount() & this.state.amount != "" ? t("Too high") : null)}
                            label={t("Amount")}
                            type="number"
                            required="true"
                            value={this.state.amount}
                            inputProps={{
                                min:0 ,
                                style: {textAlign:"center"}
                            }}
                            onChange={this.handleAmountChange}
                        />
                    </Tooltip>
                        </div>
                        <div >
                            <Select
                                sx={{width:'120px'}}
                                required="true"
                                defaultValue={this.defaultCurrency}
                                inputProps={{
                                    style: {textAlign:"center"}
                                }}
                                onChange={this.handleCurrencyChange}>
                                    {Object.entries(currencyDict)
                                    .map( ([key, value]) => <MenuItem value={parseInt(key)}>
                                        <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>{getFlags(value)}{" "+value}</div>
                                        </MenuItem> )}
                            </Select>
                        </div>

            </Grid>
            <Grid item xs={12} align="center">
                <Tooltip placement="top" enterTouchDelay="300" enterDelay="700" enterNextDelay="2000" title={t("Enter your preferred fiat payment methods. Fast methods are highly recommended.")}>
                    <AutocompletePayments
                        onAutocompleteChange={this.handlePaymentMethodChange}
                        optionsType={this.state.currency==1000 ? "swap":"fiat"}
                        error={this.state.badPaymentMethod}
                        helperText={this.state.badPaymentMethod ? t("Must be shorter than 65 characters"):""}
                        label={this.state.currency==1000 ? t("Swap Destination(s)") : t("Fiat Payment Method(s)")}
                        listHeaderText={t("You can add new methods")}
                        addNewButtonText={t("Add New")}
                        />
                </Tooltip>
            </Grid>

            <Grid item xs={12} align="center">
                <FormControl component="fieldset">
                    <FormHelperText >
                        <div align='center'>
                            {t("Choose a Pricing Method")}
                        </div>
                    </FormHelperText>
                    <RadioGroup row defaultValue="relative">
                    <Tooltip placement="top" enterTouchDelay="0" enterDelay="1000" enterNextDelay="2000" title={t("Let the price move with the market")}>
                        <FormControlLabel
                        value="relative"
                        control={<Radio color="primary"/>}
                        label={t("Relative")}
                        labelPlacement="end"
                        onClick={this.handleClickRelative}
                        />
                    </Tooltip>
                    <Tooltip placement="top" enterTouchDelay="0" enterDelay="1000" enterNextDelay="2000" title={t("Set a fix amount of satoshis")}>
                        <FormControlLabel
                        disabled={this.state.enableAmountRange}
                        value="explicit"
                        control={<Radio color="secondary"/>}
                        label={t("Explicit")}
                        labelPlacement="end"
                        onClick={this.handleClickExplicit}
                        />
                    </Tooltip>
                    </RadioGroup>
                </FormControl>
            </Grid>
                {/* conditional shows either Premium % field or Satoshis field based on pricing method */}
                <Grid item xs={12} align="center">
                    <div style={{display: this.state.is_explicit ? '':'none'}}>
                    <TextField
                            sx={{width:240}}
                            label={t("Satoshis")}
                            error={this.state.badSatoshis}
                            helperText={this.state.badSatoshis}
                            type="number"
                            required="true"
                            value={this.state.satoshis}
                            inputProps={{
                                min:this.state.minTradeSats ,
                                max:this.state.maxTradeSats ,
                                style: {textAlign:"center"}
                            }}
                            onChange={this.handleSatoshisChange}
                        />
                    </div>
                    <div style={{display: this.state.is_explicit ? 'none':''}}>
                        <TextField
                                sx={{width:240}}
                                error={this.state.badPremium}
                                helperText={this.state.badPremium}
                                label={t("Premium over Market (%)")}
                                type="number"
                                inputProps={{
                                    min: -100,
                                    max: 999,
                                    style: {textAlign:"center"}
                                }}
                                onChange={this.handlePremiumChange}
                            />
                    </div>
                <Grid item>
                <Tooltip placement="top" enterTouchDelay="0" enterDelay="1000" enterNextDelay="2000" title={this.state.is_explicit? t("Your order fixed exchange rate"): t("Your order's current exchange rate. Rate will move with the market.")}>
                    <Typography variant="caption" color="text.secondary">
                        {(this.state.is_explicit ? t("Order rate:"): t("Order current rate:"))+" "+pn(this.priceNow())+" "+this.state.currencyCode+"/BTC"}
                    </Typography>
                </Tooltip>
                </Grid>
                </Grid>
            </Paper>
        )
    }

    handleChangePublicDuration = (date) => {
        let d = new Date(date),
            hours = d.getHours(),
            minutes = d.getMinutes();

        var total_secs = hours*60*60 + minutes * 60;

        this.setState({
            publicExpiryTime: date,
            publicDuration: total_secs,
        });
    }

    handleChangeEscrowDuration = (date) => {
        let d = new Date(date),
            hours = d.getHours(),
            minutes = d.getMinutes();

        var total_secs = hours*60*60 + minutes * 60;

        this.setState({
            escrowExpiryTime: date,
            escrowDuration: total_secs,
        });
    }

    getMaxAmount = () => {
        if (this.state.limits == null){
            var max_amount = null
        }else{
            var max_amount = this.state.limits[this.state.currency]['max_amount']*(1+this.state.premium/100)
        }
        // times 0.98 to allow a bit of margin with respect to the backend minimum
        return parseFloat(Number(max_amount*0.98).toPrecision(2))
    }

    getMinAmount = () => {
        if (this.state.limits == null){
            var min_amount = null
        }else{
            var min_amount = this.state.limits[this.state.currency]['min_amount']*(1+this.state.premium/100)
        }
        // times 1.1 to allow a bit of margin with respect to the backend minimum
        return parseFloat(Number(min_amount*1.1).toPrecision(2))
    }

    RangeSlider = styled(Slider)(({ theme }) => ({
        color: 'primary',
        height: 3,
        padding: '13px 0',
        '& .MuiSlider-thumb': {
          height: 27,
          width: 27,
          backgroundColor: '#fff',
          border: '1px solid currentColor',
          '&:hover': {
            boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)',
          },
          '& .range-bar': {
            height: 9,
            width: 1,
            backgroundColor: 'currentColor',
            marginLeft: 1,
            marginRight: 1,
          },
        },
        '& .MuiSlider-track': {
          height: 3,
        },
        '& .MuiSlider-rail': {
          color: theme.palette.mode === 'dark' ? '#bfbfbf' : '#d8d8d8',
          opacity: theme.palette.mode === 'dark' ? undefined : 1,
          height: 3,
        },
      }));

    RangeThumbComponent(props) {
        const { children, ...other } = props;
        return (
            <SliderThumb {...other}>
            {children}
            <span className="range-bar" />
            <span className="range-bar" />
            <span className="range-bar" />
            </SliderThumb>
        );
    }

    minAmountError=()=>{
        return this.state.minAmount < this.getMinAmount() || this.state.maxAmount < this.state.minAmount || this.state.minAmount < this.state.maxAmount/(this.maxRangeAmountMultiple+0.15) || this.state.minAmount*(this.minRangeAmountMultiple-0.1) > this.state.maxAmount
    }
    maxAmountError=()=>{
        return this.state.maxAmount > this.getMaxAmount() || this.state.maxAmount < this.state.minAmount || this.state.minAmount < this.state.maxAmount/(this.maxRangeAmountMultiple+0.15) || this.state.minAmount*(this.minRangeAmountMultiple-0.1) > this.state.maxAmount
    }

    rangeText =()=> {
        const { t } = this.props;
        return (
            <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                <span style={{width: 40}}>{t("From")}</span>
                <TextField
                    variant="standard"
                    type="number"
                    size="small"
                    value={this.state.minAmount}
                    onChange={this.handleMinAmountChange}
                    error={this.minAmountError()}
                    sx={{width: this.state.minAmount.toString().length * 9, maxWidth: 40}}
                  />
                <span style={{width: t("to").length*8, align:"center"}}>{t("to")}</span>
                <TextField
                    variant="standard"
                    size="small"
                    type="number"
                    value={this.state.maxAmount}
                    error={this.maxAmountError()}
                    onChange={this.handleMaxAmountChange}
                    sx={{width: this.state.maxAmount.toString().length * 9, maxWidth: 50}}
                  />
                <span style={{width: this.state.currencyCode.length*9+4, align:"right"}}>{this.state.currencyCode}</span>
            </div>
            )

      }

    AdvancedMakerOptions = () => {
        const { t } = this.props;
        return(
            <Paper elevation={12} style={{ padding: 8, width:'280px', align:'center'}}>

            <Grid container xs={12}  spacing={1}>

            <Grid item xs={12} align="center" spacing={1}>
                <FormControl align="center">
                        <FormHelperText>
                            <Tooltip enterTouchDelay="0" placement="top" align="center" title={t("Let the taker chose an amount within the range")}>
                            <div align="center" style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                                <Checkbox onChange={(e)=>this.setState({enableAmountRange:e.target.checked, is_explicit: false})}/>
                                {this.state.enableAmountRange & this.state.minAmount != null? <this.rangeText/> : t("Enable Amount Range")}
                            </div>
                            </Tooltip>
                        </FormHelperText>
                            <div style={{ display: this.state.loadingLimits == true ? '':'none'}}>
                                <LinearProgress />
                            </div>
                            <div style={{ display: this.state.loadingLimits == false ? '':'none'}}>
                            <this.RangeSlider
                                disableSwap={true}
                                sx={{width:200, align:"center"}}
                                disabled={!this.state.enableAmountRange || this.state.loadingLimits}
                                value={[this.state.minAmount, this.state.maxAmount]}
                                step={(this.getMaxAmount()-this.getMinAmount())/5000}
                                valueLabelDisplay="auto"
                                components={{ Thumb: this.RangeThumbComponent }}
                                valueLabelFormat={(x) => (parseFloat(Number(x).toPrecision(x < 100 ? 2 : 3))+" "+this.state.currencyCode)}
                                marks={this.state.limits == null?
                                    null
                                    :
                                    [{value: this.getMinAmount(),label: this.getMinAmount()+" "+ this.state.currencyCode},
                                    {value: this.getMaxAmount(),label: this.getMaxAmount()+" "+this.state.currencyCode}]}
                                min={this.getMinAmount()}
                                max={this.getMaxAmount()}
                                onChange={this.handleRangeAmountChange}
                            />
                            </div>
                    </FormControl>
                </Grid>

                <Grid item xs={12} align="center" spacing={1}>
                    <Accordion elevation={0} sx={{width:'280px', position:'relative', left:'-12px'}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon color="primary"/>}>
                            <Typography sx={{flexGrow: 1, textAlign: "center"}} color="text.secondary">{t("Expiry Timers")}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Grid container xs={12}  spacing={1}>
                            <Grid item xs={12} align="center" spacing={1}>
                                <LocalizationProvider dateAdapter={DateFnsUtils}>
                                    <TimePicker
                                        sx={{width:210, align:"center"}}
                                        ampm={false}
                                        openTo="hours"
                                        views={['hours', 'minutes']}
                                        inputFormat="HH:mm"
                                        mask="__:__"
                                        components={{
                                            OpenPickerIcon: HourglassTopIcon
                                        }}
                                        open={this.state.openTimePicker}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <HourglassTopIcon />
                                                </InputAdornment>)
                                            }}
                                        renderInput={(props) => <TextField {...props} />}
                                        label={t("Public Duration (HH:mm)")}
                                        value={this.state.publicExpiryTime}
                                        onChange={this.handleChangePublicDuration}
                                        minTime={new Date(0, 0, 0, 0, 10)}
                                        maxTime={new Date(0, 0, 0, 23, 59)}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            
                            <Grid item xs={12} align="center" spacing={1}>
                                <LocalizationProvider dateAdapter={DateFnsUtils}>
                                    <TimePicker
                                        sx={{width:210, align:"center"}}
                                        ampm={false}
                                        openTo="hours"
                                        views={['hours', 'minutes']}
                                        inputFormat="HH:mm"
                                        mask="__:__"
                                        components={{
                                            OpenPickerIcon: HourglassTopIcon
                                        }}
                                        open={this.state.openTimePicker}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <HourglassTopIcon />
                                                </InputAdornment>)
                                            }}
                                        renderInput={(props) => <TextField {...props} />}
                                        label={t("Escrow Deposit Time-Out (HH:mm)")}
                                        value={this.state.escrowExpiryTime}
                                        onChange={this.handleChangeEscrowDuration}
                                        minTime={new Date(0, 0, 0, 1, 0)}
                                        maxTime={new Date(0, 0, 0, 8, 0)}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>


                <Grid item xs={12} align="center" spacing={1}>
                    <FormControl align="center">
                    <Tooltip enterDelay="800" enterTouchDelay="0" placement="top" title={t("Set the skin-in-the-game, increase for higher safety assurance")}>
                        <FormHelperText>
                                <div align="center" style={{display:'flex',flexWrap:'wrap', transform: 'translate(20%, 0)'}}>
                                    {t("Fidelity Bond Size")} <LockIcon sx={{height:20,width:20}}/>
                                </div>
                        </FormHelperText>
                        </Tooltip>
                        <Slider
                            sx={{width:220, align:"center"}}
                            aria-label="Bond Size (%)"
                            defaultValue={1}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(x) => (x+'%')}
                            step={0.25}
                            marks={[{value: 1,label: '1%'},{value: 5,label: '5%'},{value: 10,label: '10%'},{value: 15,label: '15%'}]}
                            min={1}
                            max={15}
                            onChange={(e) => this.setState({bondSize: e.target.value})}
                        />

                    </FormControl>
                </Grid>

                <Grid item xs={12} align="center" spacing={1}>
                    <Tooltip enterTouchDelay="0" title={t("COMING SOON - High risk! Limited to {{limitSats}}K Sats",{ limitSats: this.state.maxBondlessSats/1000})}>
                        <FormControlLabel
                            label={t("Allow bondless takers")}
                            control={
                                <Checkbox
                                    disabled
                                    //disabled={this.state.type==0}
                                    color="secondary"
                                    checked={this.state.allowBondless}
                                    onChange={()=> this.setState({allowBondless: !this.state.allowBondless})}
                                    />
                            }
                            />
                    </Tooltip>
                </Grid>
            </Grid>
            </Paper>
        )
    }

    StoreTokenDialog = () =>{
        const { t } = this.props;
        
        // If there is a robot cookie, prompt user to store it
        // Else, prompt user to generate a robot
        if (getCookie("robot_token")){
            return(
                <Dialog
                open={this.state.openStoreToken}
                onClose={() => this.setState({openStoreToken:false})}
                >
                    <DialogTitle >
                    {t("Store your robot token")}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText>
                        {t("You might need to recover your robot avatar in the future: store it safely. You can simply copy it into another application.")}
                    </DialogContentText>
                    <br/>
                    <Grid align="center">
                        <TextField
                            sx={{width:"100%", maxWidth:"550px"}}
                            disabled
                            label={t("Back it up!")}
                            value={getCookie("robot_token") }
                            variant='filled'
                            size='small'
                            InputProps={{
                                endAdornment:
                                <Tooltip disableHoverListener enterTouchDelay="0" title={t("Copied!")}>
                                    <IconButton onClick= {()=> (navigator.clipboard.writeText(getCookie("robot_token")) & this.props.setAppState({copiedToken:true}))}>
                                        <ContentCopy color={this.props.copiedToken ? "inherit" : "primary"}/>
                                    </IconButton>
                                </Tooltip>,
                                }}
                            />
                    </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({openStoreToken:false})} autoFocus>{t("Go back")}</Button>
                        <Button onClick={this.handleCreateOfferButtonPressed}>{t("Done")}</Button>
                    </DialogActions>
                </Dialog>
            )
        }else{
            return(
                <Dialog
                open={this.state.openStoreToken}
                onClose={() => this.setState({openStoreToken:false})}
                >
                    <DialogTitle>
                        {t("You do not have a robot avatar")}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {t("You need to generate a robot avatar in order to become an order maker")}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({openStoreToken:false})} autoFocus>{t("Go back")}</Button>
                        <Button onClick={() => this.setState({openStoreToken:false})} to="/" component={LinkRouter}>{t("Generate Robot")}</Button>
                    </DialogActions>
                </Dialog>
            )
        }
  }

    makeOrderBox=()=>{
        const [value, setValue] = React.useState(this.state.showAdvanced);
        const { t } = this.props;
        const handleChange = (event, newValue) => {
        this.setState({showAdvanced:newValue})
        setValue(newValue);
        };
        return(
            <Box sx={{width: this.state.showAdvanced? '270px':'252px'}}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', position:'relative',left:'5px'}}>
                        <Tabs value={value? value:0} onChange={handleChange} variant="fullWidth" >
                            <Tab label={t("Order")} {...this.a11yProps(0)} />
                            <Tab label={t("Customize")} {...this.a11yProps(1)} />
                        </Tabs>
                    </Box>

                    <Grid item xs={12} align="center" spacing={1}>
                        <div style={{ display: this.state.showAdvanced == false ? '':'none'}}>
                            <this.StandardMakerOptions/>
                        </div>
                        <div style={{ display: this.state.showAdvanced == true ? '':'none'}}>
                            <this.AdvancedMakerOptions/>
                        </div>
                    </Grid>
                </Box>
        )
    }
  render() {
    const { t } = this.props;
    return (
            <Grid container xs={12} align="center" spacing={1} sx={{minWidth:380}}>
                {/* <Grid item xs={12} align="center" sx={{minWidth:380}}>
                    <Typography component="h4" variant="h4">
                        ORDER MAKER
                    </Typography>
                </Grid> */}
                <this.StoreTokenDialog/>

                <Grid item xs={12} align="center">
                <this.makeOrderBox/>
                </Grid>

            <Grid item xs={12} align="center">
                {/* conditions to disable the make button */}
                {(this.state.amount == null & (this.state.enableAmountRange == false || this.state.loadingLimits) ||
                    this.state.enableAmountRange & (this.minAmountError() || this.maxAmountError()) ||
                    this.state.amount <= 0 & !this.state.enableAmountRange ||
                    (this.state.is_explicit & (this.state.badSatoshis != null || this.state.satoshis == null)) ||
                    (!this.state.is_explicit & this.state.badPremium != null))
                    ?
                    <Tooltip enterTouchDelay="0" title={t("You must fill the order correctly")}>
                        <div><Button disabled color="primary" variant="contained">{t("Create Order")}</Button></div>
                    </Tooltip>
                    :
                    <Button color="primary" 
                        variant="contained" 
                        onClick={this.props.copiedToken ? this.handleCreateOfferButtonPressed : (() => this.setState({openStoreToken:true}))}
                        >
                        {t("Create Order")}
                    </Button>
                    }

            </Grid>
            <Grid item xs={12} align="center">
                {this.state.badRequest ?
                <Typography component="subtitle2" variant="subtitle2" color="secondary">
                    {this.state.badRequest} <br/>
                </Typography>
                : ""}
                <Typography component="subtitle2" variant="subtitle2">
                    <div align='center'>
                        {this.state.type==0 ?
                            t("Create a BTC buy order for ")
                        :
                            t("Create a BTC sell order for ")
                        }
                        {this.state.enableAmountRange & this.state.minAmount != null?
                            this.state.minAmount+"-"+this.state.maxAmount
                        :
                            pn(this.state.amount)}
                        {" " + this.state.currencyCode}
                        {this.state.is_explicit ?
                            t(" of {{satoshis}} Satoshis",{satoshis: pn(this.state.satoshis)})
                        :
                            (this.state.premium == 0 ? t(" at market price") :
                                (this.state.premium > 0 ?
                                    t(" at a {{premium}}% premium", {premium: this.state.premium})
                                :
                                    t(" at a {{discount}}% discount", {discount: -this.state.premium}))
                            )
                        }
                    </div>
                </Typography>
                <Grid item xs={12} align="center">
                    <Button color="secondary" variant="contained" to="/" component={LinkRouter}>
                        {t("Back")}
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
  }
}

export default withTranslation()(MakerPage);
