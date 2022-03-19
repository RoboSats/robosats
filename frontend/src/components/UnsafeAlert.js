
import {Paper, Alert, AlertTitle, Button, Grid, Typography} from "@mui/material"
import React, { Component } from 'react'
import MediaQuery from 'react-responsive'

export default class UnsafeAlert extends Component {
  constructor(props) {
    super(props);
  }
  state = {
    show: true,
  };

  getHost(){ 
    var url = (window.location != window.parent.location) ? this.getHost(document.referrer) : document.location.href;
    return url.split('/')[2]
  }

  safe_urls = [
    'robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion',
    'robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion',
    'robodevs7ixniseezbv7uryxhamtz3hvcelzfwpx3rvoipttjomrmpqd.onion',
  ]

  render() {
    return (
      (!this.safe_urls.includes(this.getHost()) & this.state.show) ? 
      <div>
      <MediaQuery minWidth={800}>
        <Paper elevation={6} className="alertUnsafe">
        <Alert severity="warning"  sx={{maxHeight:100}} 
          action={<Button onClick={() => this.setState({show:false})}>Hide</Button>}
          >
          <AlertTitle>You are not using RoboSats privately</AlertTitle>
            Some features are disabled for your protection (e.g. chat) and you will not be able to complete a 
            trade without them. To protect your privacy and fully enable RoboSats, use <a href='https://www.torproject.org/download/' target="_blank">Tor Browser</a> and visit the <a href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion' target="_blank">Onion</a> site.         
        </Alert>
        </Paper>
      </MediaQuery>

      <MediaQuery maxWidth={799}>
        <Paper elevation={6} className="alertUnsafe">
        <Alert severity="warning" sx={{maxHeight:100}}>
        <AlertTitle>You are not using RoboSats privately</AlertTitle>
          You will not be able to complete a 
          trade. Use <a href='https://www.torproject.org/download/' target="_blank">Tor Browser</a> and visit the <a href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion' target="_blank">Onion</a> site.         
        <div style={{width: '100%'}}>
        </div>
        <div align="center">
          <Button className="hideAlertButton" onClick={() => this.setState({show:false})}>Hide</Button>
        </div>
        </Alert>
        </Paper>
      </MediaQuery>
      </div>
      : 
        null
    )
  }
}