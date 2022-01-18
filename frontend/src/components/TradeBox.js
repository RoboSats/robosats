import React, { Component } from "react";
import { Link, Paper, Rating, Button, Grid, Typography, TextField, List, ListItem, ListItemText, Divider, ListItemIcon, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material"
import QRCode from "react-qr-code";

import Chat from "./Chat"

// Icons
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import BookIcon from '@mui/icons-material/Book';



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
    this.state = {
      openConfirmFiatReceived: false,
      openConfirmDispute: false,
      badInvoice: false,
      badStatement: false,
    }
  }

  handleClickOpenConfirmDispute = () => {
    this.setState({openConfirmDispute: true});
  };
  handleClickCloseConfirmDispute = () => {
      this.setState({openConfirmDispute: false});
  };

  handleClickAgreeDisputeButton=()=>{
    const requestOptions = {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
        body: JSON.stringify({
          'action': "dispute",
        }),
    };
    fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
    .then((response) => response.json())
    .then((data) => (this.props.data = data));
    this.handleClickCloseConfirmDispute();
  }

  ConfirmDisputeDialog =() =>{
  return(
      <Dialog
      open={this.state.openConfirmDispute}
      onClose={this.handleClickCloseConfirmDispute}
      aria-labelledby="open-dispute-dialog-title"
      aria-describedby="open-dispute-dialog-description"
      >
        <DialogTitle id="open-dispute-dialog-title">
          {"Do you want to open a dispute?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            The RoboSats staff will examine the statements and evidence provided by the participants.
            It is best if you provide a burner contact method on your statement for the staff to contact you.
            The satoshis in the trade escrow will be sent to the dispute winner, while the dispute 
            loser will lose the bond. 
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmDispute} autoFocus>Disagree</Button>
          <Button onClick={this.handleClickAgreeDisputeButton}> Agree </Button>
        </DialogActions>
      </Dialog>
    )
  }

  handleClickOpenConfirmFiatReceived = () => {
    this.setState({openConfirmFiatReceived: true});
  };
  handleClickCloseConfirmFiatReceived = () => {
      this.setState({openConfirmFiatReceived: false});
  };

  handleClickTotallyConfirmFiatReceived = () =>{
    this.handleClickConfirmButton();
    this.handleClickCloseConfirmFiatReceived();
  };

  ConfirmFiatReceivedDialog =() =>{
  return(
      <Dialog
      open={this.state.openConfirmFiatReceived}
      onClose={this.handleClickCloseConfirmFiatReceived}
      aria-labelledby="fiat-received-dialog-title"
      aria-describedby="fiat-received-dialog-description"
      >
        <DialogTitle id="open-dispute-dialog-title">
          {"Confirm you received " +this.props.data.currencyCode+ "?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirming that you received the fiat will finalize the trade. The satoshis
            in the escrow will be released to the buyer. Only confirm after the {this.props.data.currencyCode+ " "} 
            has arrived to your account. In addition, if you have received {this.props.data.currencyCode+ " "} 
            and do not confirm the receipt, you risk losing your bond.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmFiatReceived} autoFocus>Go back</Button>
          <Button onClick={this.handleClickTotallyConfirmFiatReceived}> Confirm </Button>
        </DialogActions>
      </Dialog>
    )
  }

  showQRInvoice=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2">
            Robosats show commitment to their peers
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          {this.props.data.isMaker ?
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b>Lock {pn(this.props.data.bondSatoshis)} Sats to PUBLISH order </b>
          </Typography>
          : 
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b>Lock {pn(this.props.data.bondSatoshis)} Sats to TAKE the order </b>
          </Typography>
          }
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.props.data.bondInvoice} size={305}/>
          <Button size="small" color="inherit" onClick={() => {navigator.clipboard.writeText(this.props.data.bondInvoice)}} align="center"> 📋Copy to clipboard</Button>
        </Grid> 
        <Grid item xs={12} align="center">
        <TextField 
            hiddenLabel
            variant="standard" 
            size="small"
            defaultValue={this.props.data.bondInvoice} 
            disabled="true"
            helperText="This is a hold invoice. It will be charged only if you cancel or lose a dispute."
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }

  showBondIsLocked=()=>{
    return (
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1" align="center">
            🔒 Your {this.props.data.isMaker ? 'maker' : 'taker'} bond is locked
          </Typography>
        </Grid>
    );
  }

  showEscrowQRInvoice=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="green" component="subtitle1" variant="subtitle1">
            <b>Deposit {pn(this.props.data.escrowSatoshis)} Sats as trade collateral </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.props.data.escrowInvoice} size={305}/>
          <Button size="small" color="inherit" onClick={() => {navigator.clipboard.writeText(this.props.data.escrowInvoice)}} align="center"> 📋Copy to clipboard</Button>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.props.data.escrowInvoice} 
            disabled="true"
            helperText="This is a hold invoice. It will be charged once the buyer confirms he sent the fiat."
            color = "secondary"
          />
        </Grid>
        {this.showBondIsLocked()}
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
        {this.showBondIsLocked()}
      </Grid>
    );
  }

  showMakerWait=()=>{
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b> Your order is public. Wait for a taker. </b>
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
                <ListItemIcon>
                  <SmartToyIcon/>
                </ListItemIcon>
                <ListItemText primary={999} secondary="Robots looking at the book"/>
              </ListItem>

            <Divider/>
              <ListItem>
              <ListItemIcon>
                <BookIcon/>
              </ListItemIcon>
                <ListItemText primary={this.props.data.numSimilarOrders} secondary={"Public orders for " + this.props.data.currencyCode}/>
              </ListItem>
              
            <Divider/>
              <ListItem>
              <ListItemIcon>
                <PercentIcon/>
              </ListItemIcon>
                <ListItemText primary="33%" secondary="Premium percentile" />
              </ListItem>
            <Divider/>

          </List>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    )
  }

  handleInputInvoiceChanged=(e)=>{
    this.setState({
        invoice: e.target.value,
        badInvoice: false,     
    });
  }

  handleClickSubmitInvoiceButton=()=>{
      this.setState({badInvoice:false});

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
      .then((data) => this.setState({badInvoice:data.bad_invoice})
      & console.log(data));
  }

  handleInputDisputeChanged=(e)=>{
    this.setState({
        statement: e.target.value,
        badStatement: false,     
    });
  }

  handleClickSubmitStatementButton=()=>{
    this.setState({badInvoice:false});

    const requestOptions = {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
        body: JSON.stringify({
          'action':'submit_statement',
          'statement': this.state.statement,
        }),
    };
    fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
    .then((response) => response.json())
    .then((data) => this.setState({badStatement:data.bad_statement})
    & console.log(data));
}

  showInputInvoice(){
    return (

      // TODO Option to upload files and images

      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1">
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
              error={this.state.badInvoice}
              helperText={this.state.badInvoice ? this.state.badInvoice : "" }
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
          <Button onClick={this.handleClickSubmitInvoiceButton} variant='contained' color='primary'>Submit</Button>
        </Grid>

        {this.showBondIsLocked()}
      </Grid>
    )
  }

  // Asks the user for a dispute statement.
  showInDisputeStatement(){
    return (

      // TODO Option to upload files

      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b> A dispute has been opened </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
            Please, submit your statement. Be clear and specific about what happened and provide the necessary 
            evidence. It is best to provide a burner email, XMPP or telegram username to follow up with the staff.
            Disputes are solved at the discretion of real robots <i>(aka humans)</i>, so be as helpful 
            as possible to ensure a fair outcome. Max 5000 chars.
          </Typography>
        </Grid>

        <Grid item xs={12} align="center">
          <TextField 
              error={this.state.badStatement}
              helperText={this.state.badStatement ? this.state.badStatement : "" }
              label={"Submit dispute statement"}
              required
              inputProps={{
                  style: {textAlign:"center"}
              }}
              multiline
              rows={4}
              onChange={this.handleInputDisputeChanged}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button onClick={this.handleClickSubmitStatementButton} variant='contained' color='primary'>Submit</Button>
        </Grid>

        {this.showBondIsLocked()}
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
        {this.showBondIsLocked()}
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
        {this.showBondIsLocked()}
      </Grid>
    )
  }

  handleClickConfirmButton=()=>{
    const requestOptions = {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
        body: JSON.stringify({
          'action': "confirm",
        }),
    };
    fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
    .then((response) => response.json())
    .then((data) => (this.props.data = data));
}

handleRatingChange=(e)=>{
  const requestOptions = {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
      body: JSON.stringify({
        'action': "rate",
        'rating': e.target.value,
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
          <Button defaultValue="confirm" variant='contained' color='secondary' onClick={this.handleClickConfirmButton}>Confirm {this.props.data.currencyCode} sent</Button>
        </Grid>
      </Grid>
    )
  }

  showFiatReceivedButton(){
    return(
        <Grid item xs={12} align="center">
          <Button defaultValue="confirm" variant='contained' color='secondary' onClick={this.handleClickOpenConfirmFiatReceived}>Confirm {this.props.data.currencyCode} received</Button>
        </Grid>
    )
  }

  showOpenDisputeButton(){
    // TODO, show alert about how opening a dispute might involve giving away personal data and might mean losing the bond. Ask for double confirmation.
    return(
        <Grid item xs={12} align="center">
          <Button color="inherit" onClick={this.handleClickOpenConfirmDispute}>Open Dispute</Button>
        </Grid>
    )
  }

  showChat(sendFiatButton, receivedFiatButton, openDisputeButton){
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>Chatting with {this.props.data.isMaker ? this.props.data.takerNick : this.props.data.makerNick}</b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          {this.props.data.isSeller ? 
          <Typography component="body2" variant="body2"  align="center">
            Say hi! Be helpful and concise. Let him know how to send you {this.props.data.currencyCode}. 
          </Typography>
          :
          <Typography component="body2" variant="body2" align="center">
            Say hi! Ask for payment details and click "Confirm Sent" as soon as the payment is sent.
          </Typography>
          }
          <Divider/>
        </Grid>

        <Chat orderId={this.props.data.id} urNick={this.props.data.urNick}/>

        <Grid item xs={12} align="center">
          {openDisputeButton ? this.showOpenDisputeButton() : ""}
          {sendFiatButton ? this.showFiatSentButton() : ""}
          {receivedFiatButton ? this.showFiatReceivedButton() : ""}
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    )
  }

  showRateSelect(){
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h6" variant="h6">
            🎉Trade finished!🥳
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            What do you think of <b>{this.props.data.isMaker ? this.props.data.takerNick : this.props.data.makerNick}</b>?
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Rating name="size-large" defaultValue={2} size="large" onChange={this.handleRatingChange} />
        </Grid>
        <Grid item xs={12} align="center">
          <Button color='primary' href='/' component="a">Start Again</Button> 
        </Grid>
      </Grid>
    )
  }

  render() {
    return (
      <Grid container spacing={1} style={{ width:330}}>
        <this.ConfirmDisputeDialog/>
        <this.ConfirmFiatReceivedDialog/>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
            Contract Box
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

            {/* In Chatroom - No fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton) */}
              {this.props.data.isBuyer & this.props.data.statusCode == 9 ? this.showChat(true,false,true) : ""} 
              {this.props.data.isSeller & this.props.data.statusCode == 9 ? this.showChat(false,false,true)  : ""}
            
            {/* In Chatroom - Fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton) */}
              {this.props.data.isBuyer & this.props.data.statusCode == 10 ? this.showChat(false,false,true) : ""}
              {this.props.data.isSeller & this.props.data.statusCode == 10 ? this.showChat(false,true,true) : ""}

            {/* Trade Finished */}
              {(this.props.data.isSeller & this.props.data.statusCode > 12 & this.props.data.statusCode < 15) ? this.showRateSelect()  : ""}
              {(this.props.data.isBuyer & this.props.data.statusCode == 14) ? this.showRateSelect()  : ""}

            {/* Trade Finished - Payment Routing Failed */}
              {this.props.data.isBuyer & this.props.data.statusCode == 15 ? this.showUpdateInvoice()  : ""}

            {/* Trade Finished - TODO Needs more planning */}
            {this.props.data.statusCode == 11 ? this.showInDisputeStatement() : ""}
            

              {/* TODO */}
              {/*  */}
              {/*  */}


          </Paper>
        </Grid>
      </Grid>
    );
  }
}