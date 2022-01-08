import React, { Component } from "react";
import { Paper, FormControl , Grid, Typography, FormHelperText, TextField, List, ListItem, ListItemText, Divider} from "@material-ui/core"
import QRCode from "react-qr-code"

export default class TradeBox extends Component {
  constructor(props) {
    super(props);
    this.data = this.props.data
  }

  showInvoice=()=>{
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

  render() {
    return (
      <Grid container spacing={1} style={{ width:330}}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
            TradeBox
          </Typography>
          <Paper elevation={12} style={{ padding: 8,}}>
              {this.data.bondInvoice ? this.showInvoice() : ""}
              {this.data.isMaker & this.data.statusCode == 1 ? this.showMakerWait() : ""}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}