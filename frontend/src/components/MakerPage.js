import React, { Component } from 'react';
import { Checkbox, Slider, Switch, Tooltip, Paper, Button , Grid, Typography, TextField, Select, FormHelperText, MenuItem, FormControl, Radio, FormControlLabel, RadioGroup} from "@mui/material"
import { LocalizationProvider, TimePicker}  from '@mui/lab';
import DateFnsUtils from "@date-io/date-fns";
import { Link } from 'react-router-dom'
import getFlags from './getFlags'

import LockIcon from '@mui/icons-material/Lock';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// pretty numbers
function pn(x) {
    if(x==null){
        return(null)
    }
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");  
  }

export default class MakerPage extends Component {
  defaultCurrency = 1;
  defaultCurrencyCode = 'USD';
  defaultPaymentMethod = "not specified";
  defaultPremium = 0;
  minTradeSats = 20000;
  maxTradeSats = 800000;
  maxBondlessSats = 50000;
  minAmountFraction = 0.2;

  constructor(props) {
    super(props);
    this.state={
        is_explicit: false, 
        type: 0,
        currency: this.defaultCurrency,
        currencyCode: this.defaultCurrencyCode,
        payment_method: this.defaultPaymentMethod,
        premium: 0,
        satoshis: null,
        currencies_dict: {"1":"USD"},
        showAdvanced: false,
        allowBondless: false,
        publicExpiryTime: new Date(0, 0, 0, 23, 59),
        enableAmountRange: false,
        minAmount: null,
        bondSize: 1,
    }
    this.getCurrencyDict()
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
}
    handleAmountChange=(e)=>{
        this.setState({
            amount: e.target.value,     
        });
    }

    handleMinAmountChange=(e)=>{
        this.setState({
            minAmount: e.target.value,     
        });
    }

    handlePaymentMethodChange=(e)=>{
        this.setState({
            payment_method: e.target.value,
            badPaymentMethod: e.target.value.length > 35,    
        });
    }
    handlePremiumChange=(e)=>{
        if(e.target.value > 999){
            var bad_premium = "Must be less than 999%"
        }
        if(e.target.value < -100){
            var bad_premium = "Must be more than -100%"
        }

        this.setState({
            premium: e.target.value,
            badPremium: bad_premium,     
        });
    }

    handleSatoshisChange=(e)=>{
        if(e.target.value > this.maxTradeSats){
            var bad_sats = "Must be less than " + pn(this.maxTradeSats)
        }
        if(e.target.value < this.minTradeSats){
            var bad_sats = "Must be more than "+pn(this.minTradeSats)
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
        this.setState({
            is_explicit: true,   
        });
        this.handleSatoshisChange();
    }

    handleCreateOfferButtonPressed=()=>{
        this.state.amount == null ? this.setState({amount: 0}) : null;
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({
                type: this.state.type,
                currency: this.state.currency,
                amount: this.state.amount,
                payment_method: this.state.payment_method,
                is_explicit: this.state.is_explicit,
                premium: this.state.is_explicit ? null: this.state.premium,
                satoshis: this.state.is_explicit ? this.state.satoshis: null,
                public_duration: this.state.publicDuration,
                bond_size: this.state.bondSize,
            }),
        };
        fetch("/api/make/",requestOptions)
        .then((response) => response.json())
        .then((data) => (this.setState({badRequest:data.bad_request})
             & (data.id ? this.props.history.push('/order/' + data.id) :"")));
    }

    getCurrencyDict() {
        fetch('/static/assets/currencies.json')
          .then((response) => response.json())
          .then((data) => 
          this.setState({
            currencies_dict: data
          }));
    
      }

    getCurrencyCode(val){
        return this.state.currencies_dict[val.toString()]
    }

    handleInputBondSizeChange = (event) => {
        this.setState({bondSize: event.target.value === '' ? 1 : Number(event.target.value)});
    };

    StandardMakerOptions = () => {
        return(
            <Paper elevation={12} style={{ padding: 8, width:240, align:'center'}}>
            <Grid item xs={12} align="center" spacing={1}>
                <FormControl component="fieldset">
                    <FormHelperText>
                        Buy or Sell Bitcoin?
                    </FormHelperText>
                    <RadioGroup row defaultValue="0" onChange={this.handleTypeChange}>
                        <FormControlLabel 
                            value="0" 
                            control={<Radio color="primary"/>}
                            label="Buy"
                            labelPlacement="Top"
                        />
                        <FormControlLabel 
                            value="1" 
                            control={<Radio color="secondary"/>}
                            label="Sell"
                            labelPlacement="Top"
                        />
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid containter xs={12} alignItems="stretch" style={{ display: "flex" }}>
                    <div style={{maxWidth:140}}>
                    <Tooltip placement="top" enterTouchDelay="500" enterDelay="700" enterNextDelay="2000" title="Amount of fiat to exchange for bitcoin">
                        <TextField
                            error={this.state.amount <= 0} 
                            helperText={this.state.amount <= 0 ? 'Invalid' : null}
                            label="Amount"
                            type="number" 
                            required="true"
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
                                required="true" 
                                defaultValue={this.defaultCurrency} 
                                inputProps={{
                                    style: {textAlign:"center"}
                                }}
                                onChange={this.handleCurrencyChange}>
                                    {Object.entries(this.state.currencies_dict)
                                    .map( ([key, value]) => <MenuItem value={parseInt(key)}>
                                        <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>{getFlags(value)}{" "+value}</div>
                                        </MenuItem> )}
                            </Select>
                        </div>

            </Grid>
            <br/>
            <Grid item xs={12} align="center">
                <Tooltip placement="top" enterTouchDelay="300" enterDelay="700" enterNextDelay="2000" title="Enter your preferred fiat payment methods. Instant recommended (e.g., Revolut, CashApp ...)">
                    <TextField 
                        sx={{width:240}}
                        label={this.state.currency==1000 ? "Swap Destination (e.g. rBTC)":"Fiat Payment Method(s)"}
                        error={this.state.badPaymentMethod}
                        helperText={this.state.badPaymentMethod ? "Must be shorter than 35 characters":""}
                        type="text" 
                        require={true}  
                        inputProps={{
                            style: {textAlign:"center"},
                            maxLength: 35
                        }}
                        onChange={this.handlePaymentMethodChange}
                    />
                </Tooltip>
            </Grid>

            <Grid item xs={12} align="center">
                <FormControl component="fieldset">
                    <FormHelperText >
                        <div align='center'>
                            Choose a Pricing Method
                        </div>
                    </FormHelperText>
                    <RadioGroup row defaultValue="relative">
                    <Tooltip placement="top" enterTouchDelay="0" enterDelay="1000" enterNextDelay="2000" title="Let the price move with the market">
                        <FormControlLabel 
                        value="relative" 
                        control={<Radio color="primary"/>}
                        label="Relative"
                        labelPlacement="Top"
                        onClick={this.handleClickRelative}
                        />
                    </Tooltip>
                    <Tooltip placement="top" enterTouchDelay="0" enterDelay="1000" enterNextDelay="2000" title="Set a fix amount of satoshis">
                        <FormControlLabel 
                        value="explicit" 
                        control={<Radio color="secondary"/>}
                        label="Explicit"
                        labelPlacement="Top"
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
                            label="Satoshis"
                            error={this.state.badSatoshis}
                            helperText={this.state.badSatoshis}
                            type="number" 
                            required="true"
                            value={this.state.satoshis} 
                            inputProps={{
                                // TODO read these from .env file
                                min:this.minTradeSats , 
                                max:this.maxTradeSats , 
                                style: {textAlign:"center"}
                            }}
                            onChange={this.handleSatoshisChange}
                            // defaultValue={this.defaultSatoshis} 
                        />
                    </div>
                    <div style={{display: this.state.is_explicit ? 'none':''}}>
                        <TextField 
                                sx={{width:240}}
                                error={this.state.badPremium}
                                helperText={this.state.badPremium}
                                label="Premium over Market (%)"
                                type="number" 
                                // defaultValue={this.defaultPremium} 
                                inputProps={{
                                    min: -100, 
                                    max: 999, 
                                    style: {textAlign:"center"}
                                }}
                                onChange={this.handlePremiumChange}
                            />
                    </div>
                </Grid>
            </Paper>
        )
    }

    handleChangePublicDuration = (date) => {
        console.log(date)
        let d = new Date(date),
            hours = d.getHours(),
            minutes = d.getMinutes();
        
        var total_secs = hours*60*60 + minutes * 60;

        this.setState({
            changedPublicExpiryTime: true,
            publicExpiryTime: date, 
            publicDuration: total_secs,
            badDuration: false,
        });
        
    }

    AdvancedMakerOptions = () => {
        return(
            <Paper elevation={12} style={{ padding: 8, width:250, align:'center'}}>
            
            <Grid container xs={12}  spacing={1}>

            <Grid item xs={12} align="center" spacing={1}>
                    <FormControl align="center">
                        <FormHelperText>
                            <Tooltip enterTouchDelay="0" title={"Set the skin-in-the-game (increase for higher safety assurance)"}>
                                <div align="center" style={{display:'flex',flexWrap:'wrap', transform: 'translate(20%, 0)'}}>
                                    Fidelity Bond Size <LockIcon sx={{height:20,width:20}}/>
                                </div>
                            </Tooltip>
                        </FormHelperText>

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
                    <LocalizationProvider dateAdapter={DateFnsUtils}>
                        <TimePicker
                            ampm={false}
                            openTo="hours"
                            views={['hours', 'minutes']}
                            inputFormat="HH:mm"
                            mask="__:__"
                            renderInput={(props) => <TextField {...props} />}
                            label="Public Duration (HH:mm)"
                            value={this.state.publicExpiryTime}
                            onChange={this.handleChangePublicDuration}
                            minTime={new Date(0, 0, 0, 0, 10)}
                            maxTime={new Date(0, 0, 0, 23, 59)}
                        />
                    </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} align="center" spacing={1}>
                <FormControl align="center">
                        <FormHelperText>
                            <Tooltip enterTouchDelay="0" title={"COMING SOON - Let the taker chose an amount within the range"}>
                            <div align="center">
                                Amount Range 
                            </div>
                            </Tooltip>
                        </FormHelperText>
                        <Grid container xs={12} align="left">
                            <Grid item xs={3} align="left">
                                <Checkbox 
                                    disabled
                                    //disabled={this.state.amount == null}
                                    onChange={()=>this.setState({enableAmountRange:!this.state.enableAmountRange})}/>
                            </Grid>
                            <Grid item xs={9} align="left">
                            <Slider
                                sx={{width:140, align:"center"}}
                                disabled={!this.state.enableAmountRange}
                                aria-label="Amount Range"
                                defaultValue={this.state.amount}
                                track="inverted"
                                value={this.state.minAmount ? this.state.minAmount : this.state.amount}
                                step={this.state.amount/100}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(x) => (x+" "+this.state.currencyCode)}
                                marks={this.state.amount == null ?
                                    null
                                    :
                                    [{value: this.state.amount*this.minAmountFraction,label: parseFloat(parseFloat(this.state.amount*this.minAmountFraction).toFixed(4))+" "+ this.state.currencyCode},
                                    {value: this.state.amount,label: this.state.amount+" "+this.state.currencyCode}]}
                                min={this.state.amount*this.minAmountFraction}
                                max={this.state.amount}
                                onChange={this.handleMinAmountChange}
                            />
                            </Grid>
                        </Grid>
                    </FormControl>
                </Grid>

                <Grid item xs={12} align="center" spacing={1}>
                    <Tooltip enterTouchDelay="0" title={"COMING SOON - High risk! Limited to "+ this.maxBondlessSats/1000 +"K Sats"}>
                        <FormControlLabel
                            label={<a>Allow bondless taker (<a href="https://git.robosats.com" target="_blank">info</a>)</a>}
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
  render() {
    return (
            <Grid container xs={12} align="center" spacing={1} sx={{minWidth:380}}>
                {/* <Grid item xs={12} align="center" sx={{minWidth:380}}>
                    <Typography component="h4" variant="h4">
                        ORDER MAKER
                    </Typography>
                </Grid> */}
                <Grid item xs={12} align="center">
                    <div className="advancedSwitch">
                    {/* <Tooltip enterTouchDelay="0" title="Coming soon"> */}
                        <FormControlLabel
                            size="small"
                            disableTypography={true}
                            label={<Typography variant="body2">Advanced</Typography>} 
                            labelPlacement="start" control={
                            <Switch
                                size="small"
                                checked={this.state.showAdvanced} 
                                onChange={()=> this.setState({showAdvanced: !this.state.showAdvanced})}/>}
                        />
                    {/* </Tooltip> */}
                    </div>
                </Grid>

                <Grid item xs={12} align="center" spacing={1}>
                    <div style={{ display: this.state.showAdvanced == false ? '':'none'}}>
                        <this.StandardMakerOptions/>
                    </div>
                    <div style={{ display: this.state.showAdvanced == true ? '':'none'}}>
                        <this.AdvancedMakerOptions/>
                    </div>
                </Grid>

            <Grid item xs={12} align="center">
                {/* conditions to disable the make button */}
                {(this.state.amount == null || 
                    this.state.amount <= 0 || 
                    (this.state.is_explicit & (this.state.badSatoshis != null || this.state.satoshis == null)) || 
                    (!this.state.is_explicit & this.state.badPremium != null))
                    ?
                    <Tooltip enterTouchDelay="0" title="You must fill the form correctly">
                        <div><Button disabled color="primary" variant="contained" onClick={this.handleCreateOfferButtonPressed} >Create Order</Button></div>
                    </Tooltip>
                    :
                    <Button color="primary" variant="contained" onClick={this.handleCreateOfferButtonPressed} >Create Order</Button>
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
                        Create a BTC {this.state.type==0 ? "buy":"sell"} order for {pn(this.state.amount)} {this.state.currencyCode} 
                        {this.state.is_explicit ? " of " + pn(this.state.satoshis) + " Satoshis" : 
                            (this.state.premium == 0 ? " at market price" : 
                                (this.state.premium > 0 ? " at a " + this.state.premium + "% premium":" at a " + -this.state.premium + "% discount")
                            )
                        }
                    </div>
                </Typography>
                <Grid item xs={12} align="center">
                    <Button color="secondary" variant="contained" to="/" component={Link}>
                        Back
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
  }
}