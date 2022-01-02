import React, { Component } from 'react';
import { Button , Grid, Typography, TextField, Select, FormHelperText, MenuItem, FormControl, Radio, FormControlLabel, RadioGroup, Menu} from "@material-ui/core"
import { Link } from 'react-router-dom'

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

export default class MakerPage extends Component {
  defaultCurrency = 1;
  defaultCurrencyCode = 'USD';
  defaultAmount = 0 ;
  defaultPaymentMethod = "Not specified";
  defaultPremium = 0;

  constructor(props) {
    super(props);
    this.state={
        explicit: false, 
        type: 0,
        currency: this.defaultCurrency,
        currencyCode: this.defaultCurrencyCode,
        amount: this.defaultAmount,
        payment_method: this.defaultPaymentMethod,
        premium: 0,
        satoshis: null,
    }
  }

  handleTypeChange=(e)=>{
      this.setState({
          type: e.target.value,     
      });
  }
  handleCurrencyChange=(e)=>{
    var code = (e.target.value == 1 ) ? "USD": ((e.target.value == 2 ) ? "EUR":"ETH")
    this.setState({
        currency: e.target.value,
        currencyCode: code,
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
        });
    }
    handlePremiumChange=(e)=>{
        this.setState({
            premium: e.target.value,     
        });
    }
    handleSatoshisChange=(e)=>{
        this.setState({
            satoshis: e.target.value,     
        });
    }
    handleClickRelative=(e)=>{
        this.setState({
            explicit: false, 
            satoshis: null,
            premium: 0,     
        });
    }
    handleClickExplicit=(e)=>{
        this.setState({
            explicit: true,
            satoshis: 10000, 
            premium: null,     
        });
    }

    handleCreateOfferButtonPressed=()=>{
        console.log(this.state)
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type':'application/json', 'X-CSRFToken': csrftoken},
            body: JSON.stringify({
                type: this.state.type,
                currency: this.state.currency,
                amount: this.state.amount,
                payment_method: this.state.payment_method,
                explicit: this.state.explicit,
                premium: this.state.premium,
                satoshis: this.state.satoshis,
            }),
        };
        fetch("/api/make/",requestOptions)
        .then((response) => response.json())
        .then((data) => this.props.history.push('/order/' + data.id));
    }

  render() {
    return (
        <Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <Typography component="h4" variant="h4">
                    Make an Order
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl component="fieldset">
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
                    <FormHelperText>
                        <div align='center'>
                            Choose Buy or Sell Bitcoin
                        </div>
                    </FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl >
                    <Select
                        require={true} 
                        defaultValue={this.defaultCurrency} 
                        inputProps={{
                            style: {textAlign:"center"}
                        }}
                        onChange={this.handleCurrencyChange}
                    >
                        <MenuItem value={1}>USD</MenuItem>
                        <MenuItem value={2}>EUR</MenuItem>
                        <MenuItem value={3}>ETH</MenuItem>
                    </Select>
                    <FormHelperText>
                        <div align='center'>
                            Select Payment Currency
                        </div>
                    </FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl >
                    <TextField 
                        type="number" 
                        require={true} 
                        defaultValue={this.defaultAmount} 
                        inputProps={{
                            min:0 , 
                            style: {textAlign:"center"}
                        }}
                        onChange={this.handleAmountChange}
                    />
                </FormControl>
                <FormHelperText>
                        <div align='center'>
                            Amount of Fiat to Trade
                        </div>
                </FormHelperText>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl >
                    <TextField 
                        type="text" 
                        require={true}  
                        inputProps={{
                            style: {textAlign:"center"}
                        }}
                        onChange={this.handlePaymentMethodChange}
                    />
                    <FormHelperText>
                        <div align='center'>
                            Enter the Payment Method(s)
                        </div>
                    </FormHelperText>
                </FormControl>
            </Grid>
            <Grid item xs={12} align="center">
                <FormControl component="fieldset">
                    <RadioGroup row defaultValue="relative">
                        <FormControlLabel 
                        value="relative" 
                        control={<Radio color="primary"/>}
                        label="Relative"
                        labelPlacement="Top"
                        onClick={this.handleClickRelative}
                        />
                        <FormControlLabel 
                        value="explicit" 
                        control={<Radio color="secondary"/>}
                        label="Explicit"
                        labelPlacement="Top"
                        onClick={this.handleClickExplicit}
                        onShow="false"
                        />
                    </RadioGroup>
                    <FormHelperText >
                        <div align='center'>
                            Choose a Pricing Method
                        </div>
                    </FormHelperText>
                </FormControl>
            </Grid>
{/* conditional shows either Premium % field or Satoshis field based on pricing method */}
            { this.state.explicit 
                    ? <Grid item xs={12} align="center">
                            <FormControl >
                                <TextField 
                                    type="number" 
                                    require={true} 
                                    inputProps={{
                                        // TODO read these from .env file
                                        min:10000 , 
                                        max:500000 , 
                                        style: {textAlign:"center"}
                                    }}
                                    onChange={this.handleSatoshisChange}
                                    defaultValue={this.defaultSatoshis} 
                                />
                                <FormHelperText>
                                    <div align='center'>
                                        Explicit Amount in Satoshis
                                    </div>
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    :   <Grid item xs={12} align="center">
                            <FormControl >
                                <TextField 
                                    type="number" 
                                    require={true} 
                                    defaultValue={this.defaultPremium} 
                                    inputProps={{
                                        style: {textAlign:"center"}
                                    }}
                                    onChange={this.handlePremiumChange}
                                />
                                <FormHelperText>
                                    <div align='center'>
                                        Premium Relative to Market Price (%)
                                    </div>
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                }
            <Grid item xs={12} align="center">
                <Button color="primary" variant="contained" onClick={this.handleCreateOfferButtonPressed}>
                    Create Order
                </Button>
                <Typography component="subtitle2" variant="subtitle2">
                    <div align='center'>
                        Create a BTC {this.state.type==0 ? "buy":"sell"} order for {this.state.amount} {this.state.currencyCode} 
                        {this.state.explicit ? " of " + this.state.satoshis + " Satoshis" : 
                            (this.state.premium == 0 ? " at market price" : 
                                (this.state.premium > 0 ? " at a " + this.state.premium + "% premium":" at a " + -this.state.premium + "% discount")
                            )
                        }
                    </div>
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <Button color="secondary" variant="contained" to="/" component={Link}>
                    Back
                </Button>
            </Grid>
        </Grid>
      
    );
  }
}