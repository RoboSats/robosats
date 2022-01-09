import React, { Component } from "react";
import { Paper, FormControl , Grid, Typography, FormHelperText, TextField, List, ListItem, ListItemText, Divider} from "@material-ui/core"
import QRCode from "react-qr-code";

export default class TradeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      delay: 100, // checks for new state in OrderPage ever 100 ms
    };
    this.data = this.props.data
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


  handleDelayChange = (e) => {
    this.setState({ delay: Number(e.target.value) });
  }
  tick = () => {
    this.data = this.props.data;
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
          {this.data.isMaker ?
          <Typography component="subtitle1" variant="subtitle1">
            <b>Lock {this.data.bondSatoshis} Sats to PUBLISH order </b>
          </Typography>
          : 
          <Typography component="subtitle1" variant="subtitle1">
            <b>Lock {this.data.bondSatoshis} Sats to TAKE the order </b>
          </Typography>
          }
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.data.bondInvoice} size={305}/>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.data.bondInvoice} 
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
            <b>Deposit {this.data.escrowSatoshis} Sats as trade collateral </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <QRCode value={this.data.escrowInvoice} size={305}/>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.data.escrowInvoice} 
            disabled="true"
            helperText="This is a HODL LN invoice. It will be charged once the buyer confirms he sent the fiat."
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }

  showTakerFound=()=>{

    // Make some sound here! The maker might have been waiting for long
 
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>A taker has been found! </b>
          </Typography>
        </Grid>
        <Divider/>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body">
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
                <ListItemText primary={999} secondary={"Active orders for" + this.data.currencyCode}/>
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

  // showInputInvoice(){

  // }

  // showWaitingForEscrow(){

  // }
  // showWaitingForBuyerInvoice({

  // })

  // showFiatSentButton(){

  // }
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
              {this.data.bondInvoice ? this.showQRInvoice() : ""}

            {/* Waiting for taker and taker bond request */}
              {this.data.isMaker & this.data.statusCode == 1 ? this.showMakerWait() : ""}
              {this.data.isMaker & this.data.statusCode == 3 ? this.showTakerFound() : ""}

            {/* Send Invoice (buyer) and deposit collateral (seller) */}
              {this.data.isSeller & this.data.escrowInvoice != null ? this.showEscrowQRInvoice() : ""}
              {this.data.isBuyer & this.data.invoiceAmount != null ? this.showInputInvoice() : ""}
              {this.data.isBuyer & this.data.statusCode == 7 ? this.showWaitingForEscrow() : ""}
              {this.data.isSeller & this.data.statusCode == 8 ? this.showWaitingForBuyerInvoice() : ""}

            {/* In Chatroom */}
              {this.data.isBuyer & this.data.statusCode == 9 ? this.showChat() & this.showFiatSentButton() : ""}
              {this.data.isSeller & this.data.statusCode ==9 ? this.showChat()  : ""}
              {this.data.isBuyer & this.data.statusCode == 10 ? this.showChat() & this.showOpenDisputeButton() : ""}
              {this.data.isSeller & this.data.statusCode == 10 ? this.showChat() & this.showFiatReceivedButton() & this.showOpenDisputeButton(): ""}

            {/* Trade Finished */}
              {this.data.isSeller & this.data.statusCode > 12 & this.data.statusCode < 15 ? this.showRateSelect()  : ""}
              {/* TODO */}
              {/*  */}
              {/*  */}


          </Paper>
        </Grid>
      </Grid>
    );
  }
}