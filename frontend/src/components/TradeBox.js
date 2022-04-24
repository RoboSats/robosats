import React, { Component } from "react";
import { withTranslation, Trans} from "react-i18next";
import { IconButton, Box, Link, Paper, Rating, Button, Tooltip, CircularProgress, Grid, Typography, TextField, List, ListItem, ListItemText, Divider, ListItemIcon, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material"
import QRCode from "react-qr-code";
import Countdown, { zeroPad} from 'react-countdown';
import Chat from "./Chat"
import MediaQuery from 'react-responsive'
import QrReader from 'react-qr-reader'

// Icons
import PercentIcon from '@mui/icons-material/Percent';
import BookIcon from '@mui/icons-material/Book';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import BalanceIcon from '@mui/icons-material/Balance';
import ContentCopy from "@mui/icons-material/ContentCopy";

import { getCookie } from "../utils/cookies";

// pretty numbers
function pn(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

class TradeBox extends Component {
  invoice_escrow_duration = 3;

  constructor(props) {
    super(props);
    this.state = {
      openConfirmFiatReceived: false,
      openConfirmDispute: false,
      openEnableTelegram: false,
      badInvoice: false,
      badStatement: false,
      qrscanner: false,
    }
  }



  Sound = ({soundFileName}) => (
    // Four filenames: "locked-invoice", "taker-found", "open-chat", "successful"
    <audio autoPlay src={`/static/assets/sounds/${soundFileName}.mp3`} />
  )

  togglePlay = () => {
    this.setState({ playSound: !this.state.playSound }, () => {
      this.state.playSound ? this.audio.play() : this.audio.pause();
    });
  }

  stepXofY = () => {
    // set y value
    var x = null
    var y = null
    var status = this.props.data.status

    if(this.props.data.is_maker){y = 5}
    if(this.props.data.is_taker){y = 4}

    // set x values
    if(this.props.data.is_maker){
      if (status == 0){
        x = 1
      } else if ([1,3].includes(status)){
        x = 2
      } else if ([6,7,8].includes(status)){
        x = 3
      } else if(status == 9){
        x = 4
      } else if(status == 10){
        x = 5
      }
    }
    if(this.props.data.is_taker){
      if(status == 3){
        x = 1
      }else if([6,7,8].includes(status)){
        x = 2
      }else if(status == 9){
        x = 3
      }else if(status == 10){
        x = 4
      }
    }

    // Return "(x/y)"
    if(x != null & y != null){
      return "("+x+"/"+y+")"
    }else{
      return ''
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
    .then((data) => this.props.completeSetState(data));
    this.handleClickCloseConfirmDispute();
  }

  ConfirmDisputeDialog =() =>{
    const { t } = this.props;
  return(
      <Dialog
      open={this.state.openConfirmDispute}
      onClose={this.handleClickCloseConfirmDispute}
      aria-labelledby="open-dispute-dialog-title"
      aria-describedby="open-dispute-dialog-description"
      >
        <DialogTitle id="open-dispute-dialog-title">
          {t("Do you want to open a dispute?")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("The RoboSats staff will examine the statements and evidence provided. You need to build a complete case, as the staff cannot read the chat. It is best to provide a burner contact method with your statement. The satoshis in the trade escrow will be sent to the dispute winner, while the dispute loser will lose the bond.")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmDispute} autoFocus>{t("Disagree")}</Button>
          <Button onClick={this.handleClickAgreeDisputeButton}>{t("Agree and open dispute")}</Button>
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
    const { t } = this.props;
  return(
      <Dialog
      open={this.state.openConfirmFiatReceived}
      onClose={this.handleClickCloseConfirmFiatReceived}
      aria-labelledby="fiat-received-dialog-title"
      aria-describedby="fiat-received-dialog-description"
      >
        <DialogTitle id="open-dispute-dialog-title">
          {t("Confirm you received {{currencyCode}}?", {currencyCode: this.props.data.currencyCode})}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("Confirming that you received the fiat will finalize the trade. The satoshis in the escrow will be released to the buyer. Only confirm after the {{currencyCode}} has arrived to your account. In addition, if you have received {{currencyCode}} and do not confirm the receipt, you risk losing your bond.",{currencyCode: this.props.data.currencyCode})}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmFiatReceived} autoFocus>{t("Go back")}</Button>
          <Button onClick={this.handleClickTotallyConfirmFiatReceived}>{t("Confirm")}</Button>
        </DialogActions>
      </Dialog>
    )
  }

  showQRInvoice=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2">
            {t("Robots show commitment to their peers")}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          {this.props.data.is_maker ?
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b>
              {t("Lock {{amountSats}} Sats to PUBLISH order", {amountSats: pn(this.props.data.bond_satoshis)})}
            </b> {" " + this.stepXofY()}
          </Typography>
          :
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b>
              {t("Lock {{amountSats}} Sats to TAKE order", {amountSats: pn(this.props.data.bond_satoshis)})}
            </b> {" " + this.stepXofY()}
          </Typography>
          }
        </Grid>
        <Grid item xs={12} align="center">
          <Box sx={{bgcolor:'#ffffff', width:'315px', position:'relative', left:'-5px'}} >
            <QRCode value={this.props.data.bond_invoice} size={305} style={{position:'relative', top:'3px'}}/>
          </Box>
          <Tooltip disableHoverListener enterTouchDelay="0" title={t("Copied!")}>
            <Button size="small" color="inherit" onClick={() => {navigator.clipboard.writeText(this.props.data.bond_invoice)}} align="center"> <ContentCopy/>{t("Copy to clipboard")}</Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} align="center">
        <TextField
            hiddenLabel
            variant="standard"
            size="small"
            defaultValue={this.props.data.bond_invoice}
            disabled="true"
            helperText={t("This is a hold invoice, it will freeze in your wallet. It will be charged only if you cancel or lose a dispute.")}
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }

  showBondIsLocked=()=>{
    const {t} = this.props
    return (
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1" align="center">
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap'}}>
              <LockIcon/>
              {this.props.data.is_maker ? t("Your maker bond is locked") : t("Your taker bond is locked")}
            </div>
          </Typography>
        </Grid>
    );
  }

  showBondIsSettled=()=>{
    const { t } = this.props;
    return (
        <Grid item xs={12} align="center">
          <Typography color="error" component="subtitle1" variant="subtitle1" align="center">
                <div style={{display:'flex',alignItems:'center', justifyContent:'center', flexWrap:'wrap', align:"center"}} align="center">
                    <BalanceIcon/>
                    {this.props.data.is_maker ? t("Your maker bond was settled") : t("Your taker bond was settled")}
                </div>
          </Typography>
        </Grid>
    );
  }

  showBondIsReturned=()=>{
    const { t } = this.props;
    return (
        <Grid item xs={12} align="center">
          <Typography color="green" component="subtitle1" variant="subtitle1" align="center">
            <div style={{display:'flex',alignItems:'center', justifyContent:'center', flexWrap:'wrap'}}>
              <LockOpenIcon/>
              {this.props.data.is_maker ? t("Your maker bond was unlocked") : t("Your taker bond was unlocked")}
            </div>
          </Typography>
        </Grid>
    );
  }

  showEscrowQRInvoice=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for HTLC received. */}
        <this.Sound soundFileName="locked-invoice"/>
        <Grid item xs={12} align="center">
          <Typography color="green" component="subtitle1" variant="subtitle1">
            <b>
              {t("Lock {{amountSats}} Sats as collateral", {amountSats:pn(this.props.data.escrow_satoshis)})}
            </b>{" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Box sx={{bgcolor:'#ffffff', width:'315px', position:'relative', left:'-5px'}} >
            <QRCode value={this.props.data.escrow_invoice} size={305} style={{position:'relative', top:'3px'}}/>
          </Box>
          <Tooltip disableHoverListener enterTouchDelay="0" title={t("Copied!")}>
            <Button size="small" color="inherit" onClick={() => {navigator.clipboard.writeText(this.props.data.escrow_invoice)}} align="center"> <ContentCopy/>{t("Copy to clipboard")}</Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} align="center">
          <TextField
            hiddenLabel
            variant="filled"
            size="small"
            defaultValue={this.props.data.escrow_invoice}
            disabled="true"
            helperText={t("This is a hold invoice, it will freeze in your wallet. It will be released to the buyer once you confirm to have received the {{currencyCode}}.",{currencyCode: this.props.data.currencyCode})}
            color = "secondary"
          />
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  }

  showTakerFound=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make bell sound when taker is found */}
        <this.Sound soundFileName="taker-found"/>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>{t("A taker has been found!")}</b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Divider/>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2">
            {t("Please wait for the taker to lock a bond. If the taker does not lock a bond in time, the order will be made public again.")}
          </Typography>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  }

  handleClickOpenTelegramDialog = () => {
    this.setState({openEnableTelegram: true});
  };
  handleClickCloseEnableTelegramDialog = () => {
      this.setState({openEnableTelegram: false});
  };

  handleClickEnableTelegram = () =>{
    window.open("https://t.me/"+this.props.data.tg_bot_name+'?start='+this.props.data.tg_token, '_blank').focus()
    this.handleClickCloseEnableTelegramDialog();
  };

  EnableTelegramDialog =() =>{
    const { t } = this.props;
  return(
      <Dialog
      open={this.state.openEnableTelegram}
      onClose={this.handleClickCloseEnableTelegramDialog}
      aria-labelledby="enable-telegram-dialog-title"
      aria-describedby="enable-telegram-dialog-description"
      >
        <DialogTitle id="open-dispute-dialog-title">
          {t("Enable TG Notifications")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("You will be taken to a conversation with RoboSats telegram bot. Simply open the chat and press Start. Note that by enabling telegram notifications you might lower your level of anonymity.")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseEnableTelegramDialog}> {t("Go back")} </Button>
          <Button onClick={this.handleClickEnableTelegram} autoFocus> {t("Enable")} </Button>
        </DialogActions>
      </Dialog>
    )
  }

  showMakerWait=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for HTLC received. */}
        <this.Sound soundFileName="locked-invoice"/>
        <this.EnableTelegramDialog/>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b> {t("Your order is public")} </b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">

        <List dense="true">
          <Divider/>
            <ListItem>
              <Typography component="body2" variant="body2" align="left">
                <p>{t("Be patient while robots check the book. This box will ring 🔊 once a robot takes your order, then you will have {{invoice_escrow_duration}} hours to reply. If you do not reply, you risk losing your bond.", {invoice_escrow_duration: pn(this.invoice_escrow_duration)})} </p>
                <p>{t("If the order expires untaken, your bond will return to you (no action needed).")}</p>
              </Typography>
            </ListItem>
            <Grid item xs={12} align="center">
              {this.props.data.tg_enabled ?
              <Typography color='primary' component="h6" variant="h6" align="center">{t("Telegram enabled")}</Typography>
              :
              <Button color="primary" onClick={this.handleClickOpenTelegramDialog}>
                <SendIcon/>{t("Enable Telegram Notifications")}
              </Button>
              }
            </Grid>
            <Divider/>
              <ListItem>
              <ListItemIcon>
                <BookIcon/>
              </ListItemIcon>
                <ListItemText primary={this.props.data.num_similar_orders} secondary={t("Public orders for {{currencyCode}}",{currencyCode: this.props.data.currencyCode})}/>
              </ListItem>

            <Divider/>
              <ListItem>
              <ListItemIcon>
                <PercentIcon/>
              </ListItemIcon>
                <ListItemText primary={t("Premium rank") +" "+this.props.data.premium_percentile*100+"%"}
                  secondary={t("Among public {{currencyCode}} orders (higher is cheaper)",{ currencyCode: this.props.data.currencyCode })}/>
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
      & this.props.completeSetState(data));
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
    & this.props.completeSetState(data));
  }

  handleScan = data => {
    if (data) {
      this.setState({
        invoice: data
      })
    }
  }
  handleError = err => {
    console.error(err)
  }

  handleQRbutton = () => {
    this.setState({qrscanner: !this.state.qrscanner});
  }

  showInputInvoice(){
    const { t } = this.props;
    return (

      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          {/* Make confirmation sound for HTLC received. */}
          <this.Sound soundFileName="locked-invoice"/>
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b> {t("Submit an invoice for {{amountSats}} Sats",{amountSats: pn(this.props.data.invoice_amount)})}
            </b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
            {t("The taker is committed! Before letting you send {{amountFiat}} {{currencyCode}}, we want to make sure you are able to receive the BTC. Please provide a valid invoice for {{amountSats}} Satoshis.",
            {amountFiat: parseFloat(parseFloat(this.props.data.amount).toFixed(4)),
              currencyCode: this.props.data.currencyCode,
              amountSats: pn(this.props.data.invoice_amount)}
              )
            }
          </Typography>
        </Grid>

        <Grid item xs={12} align="center">
          <TextField
              error={this.state.badInvoice}
              helperText={this.state.badInvoice ? this.state.badInvoice : "" }
              label={t("Payout Lightning Invoice")}
              required
              value={this.state.invoice}
              inputProps={{
                  style: {textAlign:"center"},
                  maxHeight: 200,
              }}
              multiline
              minRows={5}
              maxRows={this.state.qrscanner ? 5 : 14}
              onChange={this.handleInputInvoiceChanged}
          />
        </Grid>
        {this.state.qrscanner ?
        <Grid item xs={12} align="center">
          <QrReader
              delay={300}
              onError={this.handleError}
              onScan={this.handleScan}
              style={{ width: '75%' }}
            />
          </Grid>
          : null }
        <Grid item xs={12} align="center">
          <IconButton><QrCodeScannerIcon onClick={this.handleQRbutton}/></IconButton>
          <Button onClick={this.handleClickSubmitInvoiceButton} variant='contained' color='primary'>{t("Submit")}</Button>
        </Grid>

        {this.showBondIsLocked()}
      </Grid>
    )
  }

  // Asks the user for a dispute statement.
  showInDisputeStatement=()=>{
    const { t } = this.props;
    if(this.props.data.statement_submitted){
      return (
        <Grid container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography color="primary" component="subtitle1" variant="subtitle1">
              <b> {t("We have received your statement")} </b>
            </Typography>
          </Grid>
          <Grid item xs={12} align="left">
            <Typography component="body2" variant="body2">
              <p>{t("We are waiting for your trade counterpart statement. If you are hesitant about the state of the dispute or want to add more information, contact robosats@protonmail.com.")}</p>
              <p>{t("Please, save the information needed to identify your order and your payments: order ID; payment hashes of the bonds or escrow (check on your lightning wallet); exact amount of satoshis; and robot nickname. You will have to identify yourself as the user involved in this trade via email (or other contact methods).")}</p>
            </Typography>
          </Grid>
          {this.showBondIsSettled()}
        </Grid>
      )
    }else{
      return (

        // TODO Option to upload files

        <Grid container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography color="primary" component="subtitle1" variant="subtitle1">
              <b> {t("A dispute has been opened")} </b>
            </Typography>
          </Grid>
          <Grid item xs={12} align="left">
            <Typography component="body2" variant="body2">
            {t("Please, submit your statement. Be clear and specific about what happened and provide the necessary evidence. You MUST provide a contact method: burner email, XMPP or telegram username to follow up with the staff. Disputes are solved at the discretion of real robots (aka humans), so be as helpful as possible to ensure a fair outcome. Max 5000 chars.")}
            </Typography>
          </Grid>

          <Grid item xs={12} align="center">
            <TextField
                error={this.state.badStatement}
                helperText={this.state.badStatement ? this.state.badStatement : "" }
                label={t("Submit dispute statement")}
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
        {this.showBondIsSettled()}
      </Grid>
      )}
  }

  showWaitForDisputeResolution=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b> {t("We have the statements")} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
            <p>{t("Both statements have been received, wait for the staff to resolve the dispute. If you are hesitant about the state of the dispute or want to add more information, contact robosats@protonmail.com. If you did not provide a contact method, or are unsure whether you wrote it right, write us immediately.")} </p>
            <p>{t("Please, save the information needed to identify your order and your payments: order ID; payment hashes of the bonds or escrow (check on your lightning wallet); exact amount of satoshis; and robot nickname. You will have to identify yourself as the user involved in this trade via email (or other contact methods).")}</p>
          </Typography>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    )
  }

  showDisputeWinner=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="primary" component="subtitle1" variant="subtitle1">
            <b> {t("You have won the dispute")} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
            {t("You can claim the dispute resolution amount (escrow and fidelity bond) from your profile rewards. If there is anything the staff can help with, do not hesitate to contact to robosats@protonmail.com (or via your provided burner contact method).")}
          </Typography>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    )
  }

  showDisputeLoser=()=>{
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography color="error" component="subtitle1" variant="subtitle1">
            <b> {t("You have lost the dispute")} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align="left">
          <Typography component="body2" variant="body2">
          {t("Unfortunately you have lost the dispute. If you think this is a mistake you can ask to re-open the case via email to robosats@protonmail.com. However, chances of it being investigated again are low.")}
          </Typography>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    )
  }

  showWaitingForEscrow(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>{t("Your invoice looks good!")}</b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="left">
            <p>{t("We are waiting for the seller lock the trade amount.")}</p>
            <p>{t("Just hang on for a moment. If the seller does not deposit, you will get your bond back automatically. In addition, you will receive a compensation (check the rewards in your profile).")}</p>
          </Typography>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    )
  }

  showWaitingForBuyerInvoice(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        {/* Make confirmation sound for HTLC received. */}
        <this.Sound soundFileName="locked-invoice"/>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>{t("The trade collateral is locked!")}</b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="left">
            <p>{t("We are waiting for the buyer to post a lightning invoice. Once he does, you will be able to directly communicate the fiat payment details.")} </p>
            <p>{t("Just hang on for a moment. If the buyer does not cooperate, you will get back the trade collateral and your bond automatically. In addition, you will receive a compensation (check the rewards in your profile).")}</p>
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
    .then((data) => this.props.completeSetState(data));
}

handleRatingUserChange=(e)=>{
  const requestOptions = {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
      body: JSON.stringify({
        'action': "rate_user",
        'rating': e.target.value,
      }),
  };
  fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
  .then((response) => response.json())
  .then((data) => this.props.completeSetState(data));
}

handleRatingRobosatsChange=(e)=>{
  if (this.state.rating_platform != null){
    return null
  }
  this.setState({rating_platform:e.target.value});

  const requestOptions = {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
      body: JSON.stringify({
        'action': "rate_platform",
        'rating': e.target.value,
      }),
  };
  fetch('/api/order/' + '?order_id=' + this.props.data.id, requestOptions)
  .then((response) => response.json())
  .then((data) => this.props.completeSetState(data));
}

  showFiatSentButton(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Button defaultValue="confirm" variant='contained' color='secondary' onClick={this.handleClickConfirmButton}>{t("Confirm {{currencyCode}} sent",{currencyCode: this.props.data.currencyCode})}</Button>
        </Grid>
      </Grid>
    )
  }

  showFiatReceivedButton(){
    const { t } = this.props;
    return(
        <Grid item xs={12} align="center">
          <Button defaultValue="confirm" variant='contained' color='secondary' onClick={this.handleClickOpenConfirmFiatReceived}>{t("Confirm {{currencyCode}} received",{currencyCode: this.props.data.currencyCode})}</Button>
        </Grid>
    )
  }

  showOpenDisputeButton(){
    const { t } = this.props;
    return(
        <Grid item xs={12} align="center">
          <Button color="inherit" onClick={this.handleClickOpenConfirmDispute}>{t("Open Dispute")}</Button>
        </Grid>
    )
  }

  showOrderExpired(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b>{t("The order has expired")}</b>
          </Typography>
        </Grid>
      </Grid>
    )
  }

  showChat=()=>{
    const { t } = this.props;
    //In Chatroom - No fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton)
      if(this.props.data.is_buyer & this.props.data.status == 9){
        var showSendButton=true;
        var showReveiceButton=false;
        var showDisputeButton=true;
      }
      if(this.props.data.is_seller & this.props.data.status == 9){
        var showSendButton=false;
        var showReveiceButton=false;
        var showDisputeButton=true;
      }

    //In Chatroom - Fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton)
      if(this.props.data.is_buyer & this.props.data.status == 10){
        var showSendButton=false;
        var showReveiceButton=false;
        var showDisputeButton=true;
      }
      if(this.props.data.is_seller & this.props.data.status == 10){
        var showSendButton=false;
        var showReveiceButton=true;
        var showDisputeButton=true;
      }

    return(
      <Grid container spacing={1}>
        {/* Make confirmation sound for Chat Open. */}
        <this.Sound soundFileName="chat-open"/>
        <Grid item xs={12} align="center">
          <Typography component="subtitle1" variant="subtitle1">
            <b> {this.props.data.is_seller ? t("Chat with the buyer"): t("Chat with the seller")}</b> {" " + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          {this.props.data.is_seller ?
          <Typography component="body2" variant="body2"  align="center">
            {this.props.data.status == 9?
            t("Say hi! Be helpful and concise. Let them know how to send you {{currencyCode}}.",{currencyCode: this.props.data.currencyCode})
            :
            t("The buyer has sent the fiat. Click 'Confirm Received' once you receive it.")
            }
          </Typography>
          :
          <Typography component="body2" variant="body2" align="center">
            {this.props.data.status == 9?
            t("Say hi! Ask for payment details and click 'Confirm Sent' as soon as the payment is sent.")
            :
            t("Wait for the seller to confirm he has received the payment.")
            }
          </Typography>
          }
        </Grid>

        <Chat orderId={this.props.data.id} ur_nick={this.props.data.ur_nick}/>
        <Grid item xs={12} align="center">
          {showDisputeButton ? this.showOpenDisputeButton() : ""}
          {showSendButton ? this.showFiatSentButton() : ""}
          {showReveiceButton ? this.showFiatReceivedButton() : ""}
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    )
  }

  showRateSelect(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        {/* Make confirmation sound for Chat Open. */}
        <this.Sound soundFileName="successful"/>
        <Grid item xs={12} align="center">
          <Typography component="h6" variant="h6">
            {t("🎉Trade finished!🥳")}
          </Typography>
        </Grid>
        {/* <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            What do you think of ⚡<b>{this.props.data.is_maker ? this.props.data.taker_nick : this.props.data.maker_nick}</b>⚡?
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Rating name="size-large" defaultValue={0} size="large" onChange={this.handleRatingUserChange} />
        </Grid> */}
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            <Trans i18nKey="rate_robosats">What do you think of 🤖<b>RoboSats</b>⚡?</Trans>
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Rating name="size-large" defaultValue={0} size="large" onChange={this.handleRatingRobosatsChange} />
        </Grid>
        {this.state.rating_platform==5 ?
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            <p><b>{t("Thank you! RoboSats loves you too ❤️")}</b></p>
            <p>{t("RoboSats gets better with more liquidity and users. Tell a bitcoiner friend about Robosats!")}</p>
          </Typography>
        </Grid>
        : null}
        {this.state.rating_platform!=5 & this.state.rating_platform!=null ?
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            <p><b>{t("Thank you for using Robosats!")}</b></p>
            <p><Trans i18nKey="let_us_know_hot_to_improve">Let us know how the platform could improve (<Link target='_blank' href="https://t.me/robosats">Telegram</Link> / <Link target='_blank' href="https://github.com/Reckless-Satoshi/robosats/issues">Github</Link>)</Trans></p>
          </Typography>
        </Grid>
        : null}
        <Grid item xs={12} align="center">
          <Button color='primary' onClick={() => {this.props.push('/')}}>{t("Start Again")}</Button>
        </Grid>
      {this.showBondIsReturned()}
    </Grid>
    )
  }

  showSendingPayment(){
    const { t } = this.props;
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h6" variant="h6">
            {t("Attempting Lightning Payment")}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            {t("RoboSats is trying to pay your lightning invoice. Remember that lightning nodes must be online in order to receive payments.")}
          </Typography>
        <br/>
        <Grid item xs={12} align="center">
          <CircularProgress/>
        </Grid>
        </Grid>
      </Grid>
    )
  }

  // Countdown Renderer callback with condition
  countdownRenderer = ({ minutes, seconds, completed }) => {
    const { t } = this.props;
    if (completed) {
      // Render a completed state
      return (<div align="center"><span> {t("Retrying!")} </span><br/><CircularProgress/></div> );

    } else {
      return (
        <span>{zeroPad(minutes)}m {zeroPad(seconds)}s </span>
      );
    }
    };

  showRoutingFailed=()=>{
    const { t } = this.props;
    if(this.props.data.invoice_expired){
      return(
        <Grid container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography component="h6" variant="h6">
            {t("Lightning Routing Failed")}
            </Typography>
          </Grid>
          <Grid item xs={12} align="center">
            <Typography component="body2" variant="body2" align="center">
              {t("Your invoice has expired or more than 3 payment attempts have been made. Muun wallet is not recommended. ")}
              <Link href="https://github.com/Reckless-Satoshi/robosats/issues/44"> {t("Check the list of compatible wallets")}</Link>
            </Typography>
          </Grid>
          <Grid item xs={12} align="center">
            <Typography color="primary" component="subtitle1" variant="subtitle1">
              <b> {t("Submit an invoice for {{amountSats}} Sats",{amountSats: pn(this.props.data.invoice_amount)})}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} align="center">
            <TextField
                error={this.state.badInvoice}
                helperText={this.state.badInvoice ? this.state.badInvoice : "" }
                label={t("Payout Lightning Invoice")}
                required
                inputProps={{
                    style: {textAlign:"center"}
                }}
                multiline
                minRows={4}
                maxRows={8}
                onChange={this.handleInputInvoiceChanged}
            />
          </Grid>
          <Grid item xs={12} align="center">
            <Button onClick={this.handleClickSubmitInvoiceButton} variant='contained' color='primary'>Submit</Button>
          </Grid>
        {this.showBondIsReturned()}
      </Grid>
      )
    }else{
    return(
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography component="h6" variant="h6">
            {t("Lightning Routing Failed")}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography component="body2" variant="body2" align="center">
            {t("RoboSats will try to pay your invoice 3 times every 5 minutes. If it keeps failing, you will be able to submit a new invoice. Check whether you have enough inbound liquidity. Remember that lightning nodes must be online in order to receive payments.")}
          </Typography>
          <List>
            <Divider/>
            <ListItemText secondary={t("Next attempt in")}>
              <Countdown date={new Date(this.props.data.next_retry_time)} renderer={this.countdownRenderer} />
            </ListItemText>
          </List>
        </Grid>
      {this.showBondIsReturned()}
    </Grid>
    )}
  }

  render() {
    const { t } = this.props;
    return (
      <Grid container spacing={1} style={{ width:this.props.width}}>
        <this.ConfirmDisputeDialog/>
        <this.ConfirmFiatReceivedDialog/>
        <Grid item xs={12} align="center">
          <MediaQuery minWidth={920}>
            <Typography component="h5" variant="h5">
              {t("Contract Box")}
            </Typography>
          </MediaQuery>
          <Paper elevation={12} style={{ padding: 8,}}>
            {/* Maker and taker Bond request */}
              {this.props.data.is_maker & this.props.data.status == 0 ? this.showQRInvoice() : ""}
              {this.props.data.is_taker & this.props.data.status == 3 ? this.showQRInvoice() : ""}

            {/* Waiting for taker and taker bond request */}
              {this.props.data.is_maker & this.props.data.status == 1 ? this.showMakerWait() : ""}
              {this.props.data.is_maker & this.props.data.status == 3 ? this.showTakerFound() : ""}

            {/* Send Invoice (buyer) and deposit collateral (seller) */}
              {this.props.data.is_seller & (this.props.data.status == 6 || this.props.data.status == 7 ) ? this.showEscrowQRInvoice() : ""}
              {this.props.data.is_buyer & (this.props.data.status == 6 || this.props.data.status == 8 )? this.showInputInvoice() : ""}
              {this.props.data.is_buyer & this.props.data.status == 7 ? this.showWaitingForEscrow() : ""}
              {this.props.data.is_seller & this.props.data.status == 8 ? this.showWaitingForBuyerInvoice() : ""}

            {/* In Chatroom  */}
              {this.props.data.status == 9 || this.props.data.status == 10 ? this.showChat(): ""}

            {/* Trade Finished */}
              {(this.props.data.is_seller & [13,14,15].includes(this.props.data.status)) ? this.showRateSelect()  : ""}
              {(this.props.data.is_buyer & this.props.data.status == 14) ? this.showRateSelect()  : ""}

            {/* Trade Finished - Payment Routing Failed */}
              {this.props.data.is_buyer & this.props.data.status == 13 ? this.showSendingPayment()  : ""}

            {/* Trade Finished - Payment Routing Failed */}
            {this.props.data.is_buyer & this.props.data.status == 15 ? this.showRoutingFailed()  : ""}

            {/* Trade Finished - TODO Needs more planning */}
            {this.props.data.status == 11 ? this.showInDisputeStatement() : ""}
            {this.props.data.status == 16 ? this.showWaitForDisputeResolution() : ""}
            {(this.props.data.status == 17 & this.props.data.is_taker) || (this.props.data.status == 18 & this.props.data.is_maker) ? this.showDisputeWinner() : ""}
            {(this.props.data.status == 18 & this.props.data.is_taker) || (this.props.data.status == 17 & this.props.data.is_maker) ? this.showDisputeLoser() : ""}

            {/* Order has expired */}
            {this.props.data.status == 5 ? this.showOrderExpired() : ""}
              {/* TODO */}
              {/*  */}
              {/*  */}


          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(TradeBox);
