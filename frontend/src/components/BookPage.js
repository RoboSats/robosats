import React, { Component } from "react";
import { Button , Divider, Card, CardActionArea, CardContent, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, List, ListItem, ListItemText, Avatar, RouterLink, ListItemAvatar} from "@material-ui/core"
import { Link } from 'react-router-dom'

export default class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: new Array(),
      currency: 0,
      type: 1,
      currencies_dict: {"0":"ANY"}
    };
    this.getCurrencyDict()
    this.getOrderDetails(this.state.type,this.state.currency)
    this.state.currencyCode = this.getCurrencyCode(this.state.currency)
  }

  getOrderDetails(type,currency) {
    fetch('/api/book' + '?currency=' + currency + "&type=" + type)
      .then((response) => response.json())
      .then((data) =>
      this.setState({
        orders: data,
        not_found: data.not_found,
      }));
  }

  handleCardClick=(e)=>{
    console.log(e)
    this.props.history.push('/order/' + e);
  }

  handleTypeChange=(e)=>{
    this.setState({
        type: e.target.value,     
    });
    this.getOrderDetails(e.target.value,this.state.currency);
  }
  handleCurrencyChange=(e)=>{
    this.setState({
        currency: e.target.value,
        currencyCode: this.getCurrencyCode(e.target.value),
    })
    this.getOrderDetails(this.state.type, e.target.value);
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

  // pretty numbers
  pn(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  bookCards=()=>{
    return (this.state.orders.map((order) =>
    <Grid container item sm={4}>
      <Card elevation={6} sx={{ width: 945 }}>

        <CardActionArea value={order.id} onClick={() => this.handleCardClick(order.id)}>
          <CardContent>

            <List dense="true">
              <ListItem >
              <ListItemAvatar >
                  <Avatar
                      alt={order.maker_nick}
                      src={window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png'} 
                      />
                </ListItemAvatar>
                <ListItemText>
                  <Typography gutterBottom variant="h6">
                    {order.maker_nick}
                  </Typography>
                </ListItemText>
              </ListItem>

              {/* CARD PARAGRAPH CONTENT */}
              <ListItemText>
                <Typography variant="subtitle1" color="text.secondary">
                ◑{order.type == 0 ? <b> Buys </b>: <b> Sells </b>} 
                  <b>{parseFloat(parseFloat(order.amount).toFixed(4))}
                  {" " +this.getCurrencyCode(order.currency)}</b> <a> worth of bitcoin</a> 
                </Typography>

                <Typography variant="subtitle1" color="text.secondary">
                ◑ Payment via <b>{order.payment_method}</b>
                </Typography>
{/* 
                <Typography variant="subtitle1" color="text.secondary">
                ◑ Priced {order.is_explicit ? 
                  " explicitly at " + this.pn(order.satoshis) + " Sats" : (
                  " at " + 
                  parseFloat(parseFloat(order.premium).toFixed(4)) + "% over the market"                     
                  )}
                </Typography> */}

                <Typography variant="subtitle1" color="text.secondary">
                ◑ <b>{" 42,354 "}{this.getCurrencyCode(order.currency)}/BTC</b>  (Binance API)
                </Typography>
              </ListItemText>

            </List>

          </CardContent>
        </CardActionArea>
      </Card>
      </Grid>
    ));
  }

  render() {
      return (
        <Grid className='orderBook' container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography component="h4" variant="h4">
              Order Book
            </Typography>
          </Grid>

          <Grid item xs={6} align="right">
            <FormControl >
              <FormHelperText>
                I want to 
              </FormHelperText>
              <Select
                  label="Select Order Type"
                  required="true" 
                  value={this.state.type} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleTypeChange}
              >   <MenuItem value={2}>ANY</MenuItem>
                  <MenuItem value={1}>BUY</MenuItem>
                  <MenuItem value={0}>SELL</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} align="left">
            <FormControl >
              <FormHelperText>
                And pay with 
              </FormHelperText>
              <Select
                  label="Select Payment Currency"
                  required="true" 
                  value={this.state.currency} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleCurrencyChange}
              >     <MenuItem value={0}>ANY</MenuItem>
                    {
                      Object.entries(this.state.currencies_dict)
                      .map( ([key, value]) => <MenuItem value={parseInt(key)}>{value}</MenuItem> )
                    }
              </Select>
            </FormControl>
          </Grid>
        { this.state.not_found ? "" :
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
              You are {this.state.type == 0 ? " buying " : (this.state.type == 1 ? " selling ":" checking ")} BTC for {this.state.currencyCode}
            </Typography>
          </Grid>
          }

        { this.state.not_found ?
          (<Grid item xs={12} align="center">
            <Grid item xs={12} align="center">
              <Typography component="h5" variant="h5">
                No orders found to {this.state.type == 0 ? ' sell ' :' buy ' } BTC for {this.state.currencyCode}
              </Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" color='primary' to='/make/' component={Link}>Make Order</Button>
            </Grid>
              <Typography component="body1" variant="body1">
                Be the first one to create an order
              </Typography>
          </Grid>)
          : this.bookCards()
          }
          <Grid item xs={12} align="center">
              <Button color="secondary" variant="contained" to="/" component={Link}>
                  Back
              </Button>
          </Grid>
        </Grid>
    );
  };
}