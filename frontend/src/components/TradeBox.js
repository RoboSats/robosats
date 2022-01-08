import React, { Component } from "react";
import { Paper, FormControl , Grid, Typography, FormHelperText, TextField} from "@material-ui/core"
import QRCode from "react-qr-code"

export default class TradeBox extends Component {
  constructor(props) {
    super(props);
    // props.state = null
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
          <QRCode value={this.data.bondInvoice} size={340}/>
        </Grid> 
        <Grid item xs={12} align="center">
          <TextField 
            hiddenLabel
            variant="filled" 
            size="small"
            defaultValue={this.data.bondInvoice} 
            disabled="true"
            helperText="This is a HODL LN invoice will not be charged if the order succeeds or expires.
            It will be charged if the order is canceled or you lose a dispute."
            color = "secondary"
          />
        </Grid>
      </Grid>
    );
  }

  render() {
    return (
      <Grid container spacing={1} style={{ width:360}}>
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
            TradeBox
          </Typography>
          <Paper elevation={12} style={{ padding: 8,}}>
              {this.data.bondInvoice ? this.showInvoice() : ""}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}