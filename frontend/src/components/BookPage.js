import React, { Component } from "react";
import { Paper, Button , Divider, CircularProgress, ListItemButton, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, List, ListItem, ListItemText, Avatar, RouterLink, ListItemAvatar} from "@mui/material";
import { Link } from 'react-router-dom'

export default class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: new Array(),
      currency: 0,
      type: 1,
      currencies_dict: {"0":"ANY"},
      loading: true,
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
        loading: false,
      }));
  }

  handleCardClick=(e)=>{
    console.log(e)
    this.props.history.push('/order/' + e);
  }

  handleTypeChange=(e)=>{
    this.setState({
        type: e.target.value,
        loading: true,     
    });
    this.getOrderDetails(e.target.value,this.state.currency);
  }
  handleCurrencyChange=(e)=>{
    this.setState({
        currency: e.target.value,
        currencyCode: this.getCurrencyCode(e.target.value),
        loading: true,
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

  bookListItems=()=>{
    return (this.state.orders.map((order) =>
      <>
        <ListItemButton value={order.id} onClick={() => this.handleCardClick(order.id)}>

          <ListItemAvatar >
            <Avatar
                alt={order.maker_nick}
                src={window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png'} 
                />
          </ListItemAvatar>
          
          <ListItemText>
            <Typography  variant="h6">
              {order.maker_nick+" "}    
            </Typography>
          </ListItemText>
          
          <ListItemText align='left'>
            <Typography  variant="subtitle1">
              <b>{order.type ? " Sells ": " Buys "} BTC </b> for {parseFloat(
                parseFloat(order.amount).toFixed(4))+" "+ this.getCurrencyCode(order.currency)+" "}
            </Typography>
          </ListItemText>

          <ListItemText align='left'>
            <Typography  variant="subtitle1">
              via <b>{order.payment_method}</b>
            </Typography>
          </ListItemText>

          <ListItemText align='right'>
            <Typography  variant="subtitle1">
              at <b>{this.pn(order.price) + " " + this.getCurrencyCode(order.currency)}/BTC</b>
            </Typography>
          </ListItemText>

          <ListItemText align='right'>
            <Typography  variant="subtitle1">
              {order.premium > 1 ? "🔴" : "🔵" } <b>{parseFloat(parseFloat(order.premium).toFixed(4))}%</b>
            </Typography>
          </ListItemText>

        </ListItemButton>
      
        <Divider/>
      </>
    ));
  }

  render() {
      return (
        <Grid className='orderBook' container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography component="h2" variant="h2">
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
              You are {this.state.type == 0 ? <b> selling </b> : (this.state.type == 1 ? <b> buying </b> :" looking at all ")} BTC for {this.state.currencyCode}
            </Typography>
          </Grid>
          }
          {/* If loading, show circular progressbar */}
          {this.state.loading ?
          <Grid item xs={12} align="center">
            <CircularProgress />
          </Grid> : ""}

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
          : 
          <Grid item xs={12} align="center">
            <Paper elevation={0} style={{width: 1100, maxHeight: 600, overflow: 'auto'}}>
              <List >
                {this.bookListItems()}
              </List>
            </Paper>
           </Grid>
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