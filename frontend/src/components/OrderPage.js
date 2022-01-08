import React, { Component } from "react";
import { Paper, Button , Grid, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider} from "@material-ui/core"
import { Link } from 'react-router-dom'

function msToTime(duration) {
  var seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h " + minutes + "m " + seconds + "s";
}

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
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default class OrderPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        isExplicit: false,
        currencies_dict: {"1":"USD"}
    };
    this.orderId = this.props.match.params.orderId;
    this.getCurrencyDict();
    this.getOrderDetails();
  }

  getOrderDetails() {
    fetch('/api/order' + '?order_id=' + this.orderId)
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        this.setState({
            statusCode: data.status,
            statusText: data.status_message,
            type: data.type,
            currency: data.currency,
            currencyCode: this.getCurrencyCode(data.currency),
            amount: data.amount,
            paymentMethod: data.payment_method,
            isExplicit: data.is_explicit,
            premium: data.premium,
            satoshis: data.satoshis,
            makerId: data.maker, 
            isParticipant: data.is_participant,
            makerNick: data.maker_nick,
            takerId: data.taker,
            takerNick: data.taker_nick,
            isBuyer:data.buyer,
            isSeller:data.seller,
            expiresAt:data.expires_at,
            badRequest:data.bad_request,
        });
      });
  }

  // Fix to use proper react props
  handleClickBackButton=()=>{
    window.history.back();
  }

  handleClickTakeOrderButton=()=>{
    console.log(this.state)
      const requestOptions = {
          method: 'POST',
          headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
          body: JSON.stringify({
            'action':'take',
          }),
      };
      fetch('/api/order/' + '?order_id=' + this.orderId, requestOptions)
      .then((response) => response.json())
      .then((data) => (console.log(data) & this.getOrderDetails(data.id)));
  }
  getCurrencyDict() {
    fetch('/api/currencies')
      .then((response) => response.json())
      .then((data) => 
      this.setState({
        currencies_dict: data
      }));
  }
  // Gets currency code (3 letters) from numeric (e.g., 1 -> USD)
  // Improve this function so currencies are read from json
  getCurrencyCode(val){
    console.log("---------------------------------")
    console.log(val)
    return this.state.currencies_dict[val.toString()]
  }

  render (){
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
          BTC {this.state.type ? " Sell " : " Buy "} Order
          </Typography>
          <Paper elevation={12} style={{ padding: 8,}}>
          <List dense="true">
            <ListItem >
              <ListItemAvatar sx={{ width: 56, height: 56 }}>
                <Avatar 
                  alt={this.state.makerNick} 
                  src={window.location.origin +'/static/assets/avatars/' + this.state.makerNick + '.png'} 
                  />
              </ListItemAvatar>
              <ListItemText primary={this.state.makerNick} secondary="Order maker" align="right"/>
            </ListItem>
            <Divider />

            {this.state.isParticipant ?
              <>
                {this.state.takerNick!='None' ?
                  <>
                    <ListItem align="left">
                      <ListItemText primary={this.state.takerNick} secondary="Order taker"/>
                      <ListItemAvatar > 
                        <Avatar
                          alt={this.state.makerNick} 
                          src={window.location.origin +'/static/assets/avatars/' + this.state.takerNick + '.png'}
                          />
                      </ListItemAvatar>
                    </ListItem>
                    <Divider />               
                  </>: 
                  ""
                  }
                  <ListItem>
                    <ListItemText primary={this.state.statusText} secondary="Order status"/>
                  </ListItem>
                  <Divider />
              </>
            :""
            }
            
            <ListItem>
              <ListItemText primary={parseFloat(parseFloat(this.state.amount).toFixed(4))+" "+this.state.currencyCode} secondary="Amount and currency requested"/>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary={this.state.paymentMethod} secondary="Accepted payment methods"/>
            </ListItem>
            <Divider />
            <ListItem>
            {this.state.isExplicit ? 
              <ListItemText primary={pn(this.state.satoshis)} secondary="Amount of Satoshis"/>
              :
              <ListItemText primary={parseFloat(parseFloat(this.state.premium).toFixed(2))+"%"} secondary="Premium over market price"/>
            }
            </ListItem>
            <Divider />

            <ListItem>
              <ListItemText primary={'#'+this.orderId} secondary="Order ID"/>
            </ListItem>
            <Divider />

            <ListItem>
              <ListItemText primary={msToTime( new Date(this.state.expiresAt) - Date.now())} secondary="Expires in "/>
            </ListItem>
            </List>

          </Paper>

          <Grid item xs={12} align="center">
          {this.state.isParticipant ? "" : <Button variant='contained' color='primary' onClick={this.handleClickTakeOrderButton}>Take Order</Button>}
          </Grid>
          <Grid item xs={12} align="center">
            <Button variant='contained' color='secondary' onClick={this.handleClickBackButton}>Back</Button>
          </Grid>

        </Grid>
      </Grid>
    );
  }
}