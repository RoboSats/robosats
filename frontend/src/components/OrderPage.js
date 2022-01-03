import React, { Component } from "react";
import { Button , Grid, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider} from "@material-ui/core"
import { Link } from 'react-router-dom'

export default class OrderPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        isExplicit: false,
    };
    this.orderId = this.props.match.params.orderId;
    this.getOrderDetails();
  }

  getOrderDetails() {
    fetch('/api/order' + '?order_id=' + this.orderId)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
            statusCode: data.status,
            statusText: data.status_message,
            type: data.type,
            currency: data.currency,
            currencyCode: (data.currency== 1 ) ? "USD": ((data.currency == 2 ) ? "EUR":"ETH"),
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
        });
      });
  }

  render (){
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
          Robosat BTC {this.state.type ? " Sell " : " Buy "} Order
          </Typography>
          <List component="nav" aria-label="mailbox folders">
            <ListItem>
              <ListItemAvatar sx={{ width: 56, height: 56 }}>
                <Avatar 
                  alt={this.state.makerNick} 
                  src={window.location.origin +'/static/assets/avatars/' + this.state.makerNick + '.png'} 
                  sx={{ width: 56, height: 56 }}
                  />
              </ListItemAvatar>
              <ListItemText primary={this.state.makerNick} secondary="Order maker" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary={this.state.amount+" "+this.state.currencyCode} secondary="Amount and currency requested"/>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary={this.state.paymentMethod} secondary="Accepted payment methods"/>
            </ListItem>
            <Divider />
            <ListItem>
            {this.state.isExplicit ? 
              <ListItemText primary={this.state.satoshis} secondary="Amount of Satoshis"/>
              :
              <ListItemText primary={this.state.premium} secondary="Premium over market price"/>
            }
            </ListItem>
            <Divider />
            {this.state.isParticipant ?
              <>
                <ListItem>
                  <ListItemText primary={this.state.statusText} secondary="Order status"/>
                </ListItem>
              <Divider />
              { this.state.takerNick!='None' ?
                <><ListItem>
                  <ListItemText primary={this.state.takerNick} secondary="Order taker"/>
                </ListItem>
              <Divider /> </>: ""}
              </>
            :""
            }
            <ListItem>
              <ListItemText primary={'#'+this.orderId} secondary="Order ID"/>
            </ListItem>
            </List>

          <Grid item xs={12} align="center">
          {this.state.isParticipant ? "" : <Button variant='contained' color='primary' to='/home' component={Link}>Take Order</Button>}
          </Grid>
        </Grid>
      </Grid>
    );
  }
}