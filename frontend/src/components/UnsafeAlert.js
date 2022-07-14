import React, { Component } from 'react'
import { withTranslation, Trans} from "react-i18next";
import {Paper, Alert, AlertTitle, Button, Link} from "@mui/material"
import MediaQuery from 'react-responsive'

class UnsafeAlert extends Component {
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
    'robosats.i2p',
    'r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p',
  ]

  render() {
    const { t, i18n} = this.props;
    return (
      (!this.safe_urls.includes(this.getHost()) & this.state.show) ? 
      <div>
      <MediaQuery minWidth={800}>
        <Paper elevation={6} className="alertUnsafe">
        <Alert severity="warning"  sx={{maxHeight:"100px"}} 
          action={<Button onClick={() => this.setState({show:false})}>{t("Hide")}</Button>}
          >
          <AlertTitle>{t("You are not using RoboSats privately")}</AlertTitle>
            <Trans i18nKey="desktop_unsafe_alert">
              Some features are disabled for your protection (e.g. chat) and you will not be able to complete a 
              trade without them. To protect your privacy and fully enable RoboSats, use <Link href='https://www.torproject.org/download/' target="_blank">Tor Browser</Link> and visit the <Link href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion' target="_blank">Onion</Link> site.        
            </Trans>
          </Alert>
        </Paper>
      </MediaQuery>

      <MediaQuery maxWidth={799}>
        <Paper elevation={6} className="alertUnsafe">
        <Alert severity="warning" sx={{maxHeight:"120px"}}>
        <AlertTitle>{t("You are not using RoboSats privately")}</AlertTitle>
          <Trans i18nKey="phone_unsafe_alert">
            You will not be able to complete a 
            trade. Use <Link href='https://www.torproject.org/download/' target="_blank">Tor Browser</Link> and visit the <Link href='http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion' target="_blank">Onion</Link> site.
          </Trans>
        <div style={{width: '100%'}}>
        </div>
        <div align="center">
          <Button className="hideAlertButton" onClick={() => this.setState({show:false})}>{t("Hide")}</Button>
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

export default withTranslation()(UnsafeAlert);
