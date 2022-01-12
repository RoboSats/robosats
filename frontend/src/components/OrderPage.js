import React, { Component } from "react";
import { Alert, Paper, CircularProgress, Button , Grid, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Box, LinearProgress} from "@mui/material"
import TradeBox from "./TradeBox";

function msToTime(duration) {
  var seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h " + minutes + "m " + seconds + "s";
}

// TO DO fix Progress bar to go from 100 to 0, from total_expiration time, showing time_left
function LinearDeterminate() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 0) {
          return 100;
        }
        const diff = 1;
        return Math.max(oldProgress - diff, 0);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
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
        delay: 2000, // Refresh every 2 seconds by default
        currencies_dict: {"1":"USD"}
    };
    this.orderId = this.props.match.params.orderId;
    this.getCurrencyDict();
    this.getOrderDetails();
  }

  getOrderDetails() {
    this.setState(null)
    fetch('/api/order' + '?order_id=' + this.orderId)
      .then((response) => response.json())
      .then((data) => {console.log(data) &
        this.setState({
            id: data.id,
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
            isMaker: data.is_maker,
            isTaker: data.is_taker,
            isBuyer: data.is_buyer,
            isSeller: data.is_seller,
            penalty: data.penalty,
            expiresAt: data.expires_at,
            badRequest: data.bad_request,
            bondInvoice: data.bond_invoice,
            bondSatoshis: data.bond_satoshis,
            escrowInvoice: data.escrow_invoice,
            escrowSatoshis: data.escrow_satoshis,
            invoiceAmount: data.invoice_amount,
        })
      });
  }

  // These are used to refresh the data
  componentDidMount() {
    this.interval = setInterval(this.tick, this.state.delay);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.delay !== this.state.delay) {
      clearInterval(this.interval);
      this.interval = setInterval(this.tick, this.state.delay);
    }
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  tick = () => {
    this.getOrderDetails();
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
      .then((data) => (this.setState({badRequest:data.bad_request}) 
      & console.log(data)
      & this.getOrderDetails(data.id)));
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
    let code = val ? this.state.currencies_dict[val.toString()] : "" 
    return code
  }

  handleClickCancelOrderButton=()=>{
    console.log(this.state)
      const requestOptions = {
          method: 'POST',
          headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
          body: JSON.stringify({
            'action':'cancel',
          }),
      };
      fetch('/api/order/' + '?order_id=' + this.orderId, requestOptions)
      .then((response) => response.json())
      .then((data) => (console.log(data) & this.getOrderDetails(data.id)));
  }

  orderBox=()=>{
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
          {this.state.type ? "Sell " : "Buy "} Order Details
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
              <ListItemText primary={this.state.makerNick + (this.state.type ? " (Seller)" : " (Buyer)")} secondary="Order maker" align="right"/>
            </ListItem>
            <Divider />

            {this.state.isParticipant ?
              <>
                {this.state.takerNick!='None' ?
                  <>
                    <ListItem align="left">
                      <ListItemText primary={this.state.takerNick + (this.state.type ? " (Buyer)" : " (Seller)")} secondary="Order taker"/>
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
              <ListItemText primary={parseFloat(parseFloat(this.state.amount).toFixed(4))+" "+this.state.currencyCode} secondary="Amount"/>
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
              <ListItemText primary={msToTime( new Date(this.state.expiresAt) - Date.now())} secondary="Expires"/>
            </ListItem>
            <LinearDeterminate />
            </List>
            
            {/* If the user has a penalty/limit */}
            {this.state.penalty ? 
            <>
              <Divider />
              <Grid item xs={12} align="center">
                <Alert severity="warning" sx={{maxWidth:360}}>
                  You cannot take an order yet! Wait {this.state.penalty} seconds 
                </Alert>  
              </Grid>
            </>
            : null} 

          </Paper>
        </Grid>

        {/* Participants cannot see the Back or Take Order buttons */}
        {this.state.isParticipant ? "" :
          <>
            <Grid item xs={12} align="center">
              <Button variant='contained' color='primary' onClick={this.handleClickTakeOrderButton}>Take Order</Button>
            </Grid>
            <Grid item xs={12} align="center">
              <Button variant='contained' color='secondary' onClick={this.handleClickBackButton}>Back</Button>
            </Grid>
          </>
          }

        {/* Makers can cancel before trade escrow deposited  (status <9)*/}
        {/* Only free cancel before bond locked (status 0)*/}
        {this.state.isMaker & this.state.statusCode < 9 ?
        <Grid item xs={12} align="center">
          <Button variant='contained' color='secondary' onClick={this.handleClickCancelOrderButton}>Cancel</Button>
        </Grid>
        :""}
        {this.state.isMaker & this.state.statusCode > 0 & this.state.statusCode < 9 ?
        <Grid item xs={12} align="center">
          <Typography color="secondary" variant="subtitle2" component="subtitle2">Cancelling now forfeits the maker bond</Typography>
        </Grid>
        :""}
        
        {/* Takers can cancel before commiting the bond (status 3)*/}
        {this.state.isTaker & this.state.statusCode == 3 ?
        <Grid item xs={12} align="center">
          <Button variant='contained' color='secondary' onClick={this.handleClickCancelOrderButton}>Cancel</Button>
        </Grid>
        :""}

        </Grid>
    )
  }
  
  orderDetailsPage (){
    return(
      this.state.badRequest ?
        <div align='center'>
          <Typography component="subtitle2" variant="subtitle2" color="secondary" >
            {this.state.badRequest}<br/>
          </Typography>
          <Button variant='contained' color='secondary' onClick={this.handleClickBackButton}>Back</Button>
        </div>
        :
        (this.state.isParticipant ? 
          <Grid container xs={12} align="center" spacing={2}>
            <Grid item xs={6} align="left">
              {this.orderBox()}
            </Grid>
            <Grid item xs={6} align="left">
              <TradeBox data={this.state}/>
            </Grid>
          </Grid>
          :
          <Grid item xs={12} align="center">
            {this.orderBox()}
          </Grid>)
    )
  }

  render (){
    return ( 
      // Only so nothing shows while requesting the first batch of data
      (this.state.statusCode == null & this.state.badRequest == null) ? <CircularProgress /> : this.orderDetailsPage()
    );
  }
}
