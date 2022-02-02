import React, { Component } from 'react';
import { Tooltip, Paper, Button , Grid, Typography, TextField, Select, FormHelperText, MenuItem, FormControl, Radio, FormControlLabel, RadioGroup, dividerClasses} from "@mui/material"
import { Link } from 'react-router-dom'
import getFlags from './getFlags'

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
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

export default class MakerPage extends Component {
  defaultCurrency = 1;
  defaultCurrencyCode = 'USD';
  defaultPaymentMethod = "not specified";
  defaultPremium = 0;
  minTradeSats = 10000;
  maxTradeSats = 500000;

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
        currencies_dict: {"1":"USD"}
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


  render() {
    return (
            <Grid container xs={12} align="center" spacing={1}>
                <Grid item xs={12} align="center" sx={{minWidth:380}}>
                    <Typography component="h2" variant="h2">
                        Order Maker
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center" spacing={1}>
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
                        <Tooltip placement="top" enterTouchDelay="0" title="Amount of fiat to exchange for bitcoin">
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
                                            {getFlags(value) + " " + value}
                                            </MenuItem> )}
                                </Select>
                            </div>

                </Grid>
                <br/>
                <Grid item xs={12} align="center">
                    <Tooltip placement="top" enterTouchDelay="0" title="Enter your prefered payment methods">
                        <TextField 
                            sx={{width:240}}
                            label="Payment Method(s)"
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
                        <Tooltip placement="top" enterTouchDelay="0" title="Let the price move with the market">
                            <FormControlLabel 
                            value="relative" 
                            control={<Radio color="primary"/>}
                            label="Relative"
                            labelPlacement="Top"
                            onClick={this.handleClickRelative}
                            />
                        </Tooltip>
                        <Tooltip placement="top" enterTouchDelay="0" title="Set a fix amount of satoshis">
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