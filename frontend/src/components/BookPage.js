import React, { Component } from "react";
import { Paper, Button , Card, CardActionArea, CardContent, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, List, ListItem, ListItemText, Avatar, Link, RouterLink} from "@material-ui/core"

export default class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: new Array(),
      currency: 1,
      type: 1,
    };
    this.getOrderDetails()
    this.state.currencyCode = this.getCurrencyCode(this.state.currency)
  }

  // Fix needed to handle HTTP 404 error when no order is found
  // Show message to be the first one to make an order
  getOrderDetails() {
    fetch('/api/book' + '?currency=' + this.state.currency + "&type=" + this.state.type)
      .then((response) => response.json())
      .then((data) => //console.log(data));
      this.setState({orders: data}));
  }

  handleCardClick=(orderId)=>{
    this.props.history.push('/order/' + orderId)
  }

  // Make these two functions sequential. getOrderDetails needs setState to be finish beforehand.
  handleTypeChange=(e)=>{
    this.setState({
        type: e.target.value,     
    });
    this.getOrderDetails();
  }
  handleCurrencyChange=(e)=>{
    this.setState({
        currency: e.target.value,
        currencyCode: this.getCurrencyCode(e.target.value),
    })
    this.getOrderDetails();
  }

  // Gets currency 3 letters code from numeric (e.g., 1 -> USD)
  // Improve this function so currencies are read from json
  getCurrencyCode(val){
    var code = (this.state.currency== 1 ) ? "USD": ((this.state.currency == 2 ) ? "EUR":"ETH")
    return (code)
  }

  // pretty numbers
  pn(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
              >
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
              >
                  <MenuItem value={1}>USD</MenuItem>
                  <MenuItem value={2}>EUR</MenuItem>
                  <MenuItem value={3}>ETH</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {this.state.orders.map((order) =>
          <Grid container item sm={6}>
            <Card >
              {/* Linking to order details not working yet as expected */}
              {/* <CardActionArea onClick={this.handleCardClick(order.id)} component={RouterLink} to="/order"> */}
              <CardActionArea >
                <CardContent>
                  <Avatar
                      alt={order.maker_nick}
                      src={window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png'} 
                      />
                  <Typography gutterBottom variant="h5" component="div">
                    {order.maker_nick}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {/* CARD PARAGRAPH CONTENT */}
                    {order.type == 0 ? "Buys bitcoin for " : "Sells bitcoin for "} 
                    {parseFloat(parseFloat(order.amount).toFixed(4))} 
                    {" " +this.getCurrencyCode(order.currency)}.

                    Prefers payment via {order.payment_method}.
                    
                    This offer is priced 
                    {order.is_explicit ? 
                    " explicitly at " + this.pn(order.satoshis) + " Sats" : (
                    " relative to the market at a premium of " + 
                    parseFloat(parseFloat(order.premium).toFixed(4)) + "%"                     
                    )}.
                    Currently that is {"42,354"} {this.getCurrencyCode(order.currency)}/BTC.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
            </Grid>
          )}
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
              You are {this.state.type == 0 ? " selling " : " buying "} BTC for {this.state.currencyCode}
            </Typography>
          </Grid>
          <Grid item xs={12} align="center">
              <Button color="secondary" variant="contained" to="/" component={Link}>
                  Back
              </Button>
          </Grid>
        </Grid>
    );
  };
}