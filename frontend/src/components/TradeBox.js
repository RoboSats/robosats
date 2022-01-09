import React, { Component } from "react";
import { Paper, Button, Grid, Typography, TextField, List, ListItem, ListItemText, Divider} from "@material-ui/core"
import QRCode from "react-qr-code";

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

export default class TradeBox extends Component {
  constructor(props) {
    super(props);
  }
  
  showQRInvoice=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2">
            Robots around here usually show commitment
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          {this.props.data.isMaker ?
          <Typography component="subtitle1" variant="subtitle1">
            <b>Lock {pn(this.props.data.bondSatoshis)} Sats to PUBLISH order </b>
          </Typography>
          : 
          <Typography component="subtitle1" variant="subtitle1">
            <b>Lock {pn(this.props.data.bondSatoshis)} Sats to TAKE the order </b>
          </Typography>
          }
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.props.data.bondInvoice} size={305}/>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.props.data.bondInvoice} 
            disabled="true"
            helperText="This is a HODL LN invoice. It will not be charged if the order succeeds or expires.
            It will be charged if the order is cancelled or you lose a dispute."
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }
  showEscrowQRInvoice=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>Deposit {pn(this.props.data.escrowSatoshis)} Sats as trade collateral </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.props.data.escrowInvoice} size={305}/>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.props.data.escrowInvoice} 
            disabled="true"
            helperText="This is a HODL LN invoice. It will be charged once the buyer confirms he sent the fiat."
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }

  showTakerFound=()=>{

    // TODO Make some sound here! The maker might have been waiting for long
 
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>A taker has been found! </b>
          </Typography>
        </Grid>
        <Divider/>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2">
            Please wait for the taker to confirm his commitment by locking a bond.
          </Typography>
        </Grid>
      </Grid>
    );
  }

  showMakerWait=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b> Your order is public, wait for a taker. </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">

        <List dense="true">
          <Divider/>
            <ListItem>
              <Typography component="body2" variant="body2" align="left">
                <p>Be patient while robots check the book. 
                It might take some time. This box will ring 🔊 once a robot takes your order. </p>
                <p>Please note that if your premium is too high, or if your currency or payment
                  methods are not popular, your order might expire untaken. Your bond will
                  return to you (no action needed).</p> 
              </Typography>
            </ListItem>

            {/* TODO API sends data for a more confortable wait */}
            <Divider/>
              <ListItem>
                <ListItemText primary={999} secondary="Robots looking at the book"/>
              </ListItem>

            <Divider/>
              <ListItem>
                <ListItemText primary={999} secondary={"Active orders for " + this.props.data.currencyCode}/>
              </ListItem>
              
            <Divider/>
              <ListItem>
                <ListItemText primary="33%" secondary="Premium percentile" />
              </ListItem>
          </List>
        </Grid>
      </Grid>
    )
  }

  handleInputInvoiceChanged=(e)=>{
    this.setState({
        invoice: e.target.value,     
    });
  }

  // Fix this, clunky because it takes time. this.props.data does not refresh until next refresh of OrderPage.

  handleClickSubmitInvoiceButton=()=>{
      const requestOptions = {
          method: 'POST',
          headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
          body: JSON.stringify({
            'action':'update_invoice',
            'invoice': this.state.invoice,
          }),
      };
      fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
      .then((response) => response.json())
      .then((data) => (this.props.data = data));
  }

  showInputInvoice(){
    return (

      // TODO Camera option to read QR

      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b> Submit a LN invoice for {pn(this.props.data.invoiceAmount)} Sats </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
            The taker is committed! Before letting you send {" "+ parseFloat(parseFloat(this.props.data.amount).toFixed(4))+
            " "+ this.props.data.currencyCode}, we want to make sure you are able to receive the BTC. Please provide a 
            valid invoice for {pn(this.props.data.invoiceAmount)} Satoshis.
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <TextField 
              label={"Payout Lightning Invoice"}
              required
              inputProps={{
                  style: {textAlign:"center"}
              }}
              multiline
              onChange={this.handleInputInvoiceChanged}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button variant='contained' color='primary' onClick={this.handleClickSubmitInvoiceButton}>Submit</Button>
        </Grid>
      </Grid>
    )
  }

  showWaitingForEscrow(){

    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>Your invoice looks good!</b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="left">
            <p>We are waiting for the seller to deposit the full trade BTC amount
              into the escrow.</p>
              <p> Just hang on for a moment. If the seller does not deposit, 
                you will get your bond back automatically.</p>
          </Typography>
        </Grid>
      </Grid>
    )
  }

  showWaitingForBuyerInvoice(){

    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>The trade collateral is locked! :D </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="left">
            <p> We are waiting for the buyer to post a lightning invoice. Once
              he does, you will be able to directly communicate the fiat payment
              details. </p>
            <p> Just hang on for a moment. If the buyer does not cooperate, 
                you will get back the trade collateral and your bond automatically.</p>
          </Typography>
        </Grid>
      </Grid>
    )
  }

  handleClickFiatConfirmButton=()=>{
    const requestOptions = {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
        body: JSON.stringify({
          'action':'confirm',
          'invoice': this.state.invoice,
        }),
    };
    fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
    .then((response) => response.json())
    .then((data) => (this.props.data = data));
}


  showFiatSentButton(){
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Button variant='contained' color='primary' onClick={this.handleClickFiatConfirmButton}>Confirm {this.props.data.currencyCode} was sent. </Button>
        </Grid>
      </Grid>
    )
  }

  // showFiatReceivedButton(){

  // }

  // showOpenDisputeButton(){

  // }

  // showRateSelect(){

  // }


  render() {
    return (
      <Grid container spacing={1} style={{ width:330}}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
            TradeBox
          </Typography>
          <Paper elevation={12} style={{ padding: 8,}}>
            {/* Maker and taker Bond request */}
              {this.props.data.bondInvoice ? this.showQRInvoice() : ""}

            {/* Waiting for taker and taker bond request */}
              {this.props.data.isMaker & this.props.data.statusCode == 1 ? this.showMakerWait() : ""}
              {this.props.data.isMaker & this.props.data.statusCode == 3 ? this.showTakerFound() : ""}

            {/* Send Invoice (buyer) and deposit collateral (seller) */}
              {this.props.data.isSeller & this.props.data.escrowInvoice != null ? this.showEscrowQRInvoice() : ""}
              {this.props.data.isBuyer & this.props.data.invoiceAmount != null ? this.showInputInvoice() : ""}
              {this.props.data.isBuyer & this.props.data.statusCode == 7 ? this.showWaitingForEscrow() : ""}
              {this.props.data.isSeller & this.props.data.statusCode == 8 ? this.showWaitingForBuyerInvoice() : ""}

            {/* In Chatroom */}
              {this.props.data.isBuyer & this.props.data.statusCode == 9 ? this.showChat() & this.showFiatSentButton() : ""}
              {this.props.data.isSeller & this.props.data.statusCode ==9 ? this.showChat()  : ""}
              {this.props.data.isBuyer & this.props.data.statusCode == 10 ? this.showChat() & this.showOpenDisputeButton() : ""}
              {this.props.data.isSeller & this.props.data.statusCode == 10 ? this.showChat() & this.showFiatReceivedButton() & this.showOpenDisputeButton(): ""}

            {/* Trade Finished */}
              {this.props.data.isSeller & this.props.data.statusCode > 12 & this.props.data.statusCode < 15 ? this.showRateSelect()  : ""}
              {/* TODO */}
              {/*  */}
              {/*  */}


          </Paper>
        </Grid>
      </Grid>
    );
  }
}