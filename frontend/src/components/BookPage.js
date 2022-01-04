import React, { Component } from "react";
import { Paper, Button , Divider, Card, CardActionArea, CardContent, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, List, ListItem, ListItemText, Avatar, Link, RouterLink, ListItemAvatar} from "@material-ui/core"

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

  handleCardClick (orderId){
    this.props.history.push('/order/' + orderId);
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

  // Gets currency code (3 letters) from numeric (e.g., 1 -> USD)
  // Improve this function so currencies are read from json
  getCurrencyCode(val){
    return (val == 1 ) ? "USD": ((val == 2 ) ? "EUR":"ETH")
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
          <Grid container item sm={4}>
            <Card elevation={6} sx={{ width: 245 }}>
              {/* Linking to order details not working yet as expected */}
              {/* <CardActionArea onClick={this.handleCardClick(15)} component={RouterLink} to="/order"> */}
              <CardActionArea>
                <CardContent>

                  <List dense="true">
                    <ListItem >
                    <ListItemAvatar>
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

                      <Typography variant="subtitle1" color="text.secondary">
                      ◑ Priced {order.is_explicit ? 
                        " explicitly at " + this.pn(order.satoshis) + " Sats" : (
                        " to market with " + 
                        parseFloat(parseFloat(order.premium).toFixed(4)) + "% premium"                     
                        )}
                      </Typography>

                      <Typography variant="subtitle1" color="text.secondary">
                      ◑ <b>{" 42,354 "}{this.getCurrencyCode(order.currency)}/BTC</b>  (Binance API)
                      </Typography>
                    </ListItemText>

                  </List>

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