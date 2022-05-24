import React, { Component } from 'react';
import { withTranslation } from "react-i18next";
import {Button, Badge, ToolTip, TextField, Grid, Container, Card, CardHeader, Paper, Avatar, Typography} from "@mui/material";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { encryptMessage , decryptMessage} from "../utils/pgp";
import { getCookie } from "../utils/cookies";
import { saveAsJson, saveAsTxt } from "../utils/saveFile";
import { AuditPGPDialog } from "./Dialogs"

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyIcon from '@mui/icons-material/Key';
import { ExportIcon } from './Icons';

class Chat extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    own_pub_key: getCookie('pub_key').split('\\').join('\n'), 
    own_enc_priv_key: getCookie('enc_priv_key').split('\\').join('\n'),
    peer_pub_key: null,
    token: getCookie('robot_token'),
    messages: [],
    value:'',
    connected: false,
    peer_connected: false,
    audit: false,
  };

  rws = new ReconnectingWebSocket('ws://' + window.location.host + '/ws/chat/' + this.props.orderId + '/');

  componentDidMount() {
    this.rws.addEventListener('open', () => {
      console.log('Connected!');
      this.setState({connected: true});
      if ( this.state.peer_pub_key == null){
        this.rws.send(JSON.stringify({
          type: "message",
          message: "----PLEASE SEND YOUR PUBKEY----",
          nick: this.props.ur_nick,
        }));
      }
      this.rws.send(JSON.stringify({
        type: "message",
        message: this.state.own_pub_key,
        nick: this.props.ur_nick,
      }));
    });

    this.rws.addEventListener('message', (message) => {

      const dataFromServer = JSON.parse(message.data);
      console.log('Got reply!', dataFromServer.type);

      if (dataFromServer){
        console.log(dataFromServer)
        
        // If we receive our own key on a message
        if (dataFromServer.message == this.state.own_pub_key){console.log("ECHO OF OWN PUB KEY RECEIVED!!")}

        // If we receive a request to send our public key
        if (dataFromServer.message == `----PLEASE SEND YOUR PUBKEY----`) {
          this.rws.send(JSON.stringify({
            type: "message",
            message: this.state.own_pub_key,
            nick: this.props.ur_nick,
          })); 
        } else

        // If we receive a public key other than ours (our peer key!)
        if (dataFromServer.message.substring(0,36) == `-----BEGIN PGP PUBLIC KEY BLOCK-----` & dataFromServer.message != this.state.own_pub_key) {
          if (dataFromServer.message == this.state.peer_pub_key){
            console.log("PEER HAS RECONNECTED USING HIS PREVIOUSLY KNOWN PUBKEY")
          } else if (dataFromServer.message != this.state.peer_pub_key & this.state.peer_pub_key != null){
            console.log("PEER PUBKEY HAS CHANGED")
          }
          console.log("PEER KEY PUBKEY RECEIVED!!")
          this.setState({peer_pub_key:dataFromServer.message})
        } else

        // If we receive an encrypted message
        if (dataFromServer.message.substring(0,27) == `-----BEGIN PGP MESSAGE-----`){
          decryptMessage(
            dataFromServer.message.split('\\').join('\n'), 
            dataFromServer.user_nick == this.props.ur_nick ? this.state.own_pub_key : this.state.peer_pub_key, 
            this.state.own_enc_priv_key, 
            this.state.token)
          .then((decryptedData) =>
            this.setState((state) => 
            ({
              messages: [...state.messages,
              {
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: decryptedData.decryptedMessage,
                validSignature: decryptedData.validSignature,           
                userNick: dataFromServer.user_nick,
                showPGP: false,
                time: dataFromServer.time
              }],
            })
          ));
        }
        this.setState({peer_connected: dataFromServer.peer_connected})
      }
    });

    this.rws.addEventListener('close', () => {
      console.log('Socket is closed. Reconnect will be attempted');
      this.setState({connected: false});
    });

    this.rws.addEventListener('error', () => {
      console.error('Socket encountered error: Closing socket');
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  onButtonClicked = (e) => {
    if(this.state.value!=''){
      encryptMessage(this.state.value, this.state.own_pub_key, this.state.peer_pub_key, this.state.own_enc_priv_key, this.state.token)
      .then((encryptedMessage) =>
        console.log("Sending Encrypted MESSAGE    "+encryptedMessage) &
        this.rws.send(JSON.stringify({
          type: "message",
          message: encryptedMessage.split('\n').join('\\'),
          nick: this.props.ur_nick,
        }) 
       ) & this.setState({value: ""})
      );
    }
    e.preventDefault();
  }

  createJsonFile = () => {
    return ({
      "credentials": {
        "own_public_key": this.state.own_pub_key,
        "peer_public_key":this.state.peer_pub_key,
        "encrypted_private_key":this.state.own_enc_priv_key,
        "passphrase":this.state.token},
      "messages": this.state.messages,
    })
  }

  render() {
    const { t } = this.props;
    return (
      <Container component="main" maxWidth="xs" >
        <Grid container spacing={0.5}>
          <Grid item xs={0.3}/>
          <Grid item xs={5.5}>
            <Paper elevation={1} style={this.state.connected ? {backgroundColor: '#e8ffe6'}: {backgroundColor: '#FFF1C5'}}>
              <Typography variant='caption' sx={{color: '#111111'}}>
                {t("You")+": "}{this.state.connected ? t("connected"): t("disconnected")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={0.4}/>
          <Grid item xs={5.5}>
            <Paper elevation={1} style={this.state.peer_connected ? {backgroundColor: '#e8ffe6'}: {backgroundColor: '#FFF1C5'}}>
              <Typography variant='caption' sx={{color: '#111111'}}>
              {t("Peer")+": "}{this.state.peer_connected ? t("connected"): t("disconnected")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={0.3}/>
        </Grid>
        <Paper elevation={1} style={{ height: '300px', maxHeight: '300px' , width: '280px' ,overflow: 'auto', backgroundColor: '#F7F7F7' }}>
          {this.state.messages.map((message, index) =>
          <li style={{listStyleType:"none"}} key={index}>
            <Card elevation={5} align="left" >
            {/* If message sender is not our nick, gray color, if it is our nick, green color */}
            {message.userNick == this.props.ur_nick ?
              <CardHeader sx={{color: '#111111'}}
                avatar={
                  <Badge variant="dot" overlap="circular" badgeContent="" color={this.state.connected ? "success" : "error"}>
                    <Avatar className="flippedSmallAvatar"
                      alt={message.userNick}
                      src={window.location.origin +'/static/assets/avatars/' + message.userNick + '.png'}
                      />
                  </Badge>
                }
                style={{backgroundColor: '#eeeeee'}}
                title={message.userNick}
                subheader={this.state.audit ? message.encryptedMessage : message.plainTextMessage}
                subheaderTypographyProps={{sx: {wordWrap: "break-word", width: '200px', color: '#444444'}}}
              />
              :
              <CardHeader sx={{color: '#111111'}}
                avatar={
                  <Badge variant="dot" overlap="circular" badgeContent="" color={this.state.peer_connected ? "success" : "error"}>
                    <Avatar className="flippedSmallAvatar"
                      alt={message.userNick}
                      src={window.location.origin +'/static/assets/avatars/' + message.userNick + '.png'}
                      />
                  </Badge>
                }
                style={{backgroundColor: '#fafafa'}}
                title={message.userNick}
                subheader={this.state.audit ? message.encryptedMessage : message.plainTextMessage}
                subheaderTypographyProps={{sx: {wordWrap: "break-word", width: '200px', color: '#444444'}}}
              />}
              </Card>
            </li>)}
          <div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}></div>
        </Paper>
        <form noValidate onSubmit={this.onButtonClicked}>
          <Grid alignItems="stretch" style={{ display: "flex" }}>
            <Grid item alignItems="stretch" style={{ display: "flex"}}>
              <TextField
                label={t("Type a message")}
                variant="standard"
                size="small"
                helperText={this.state.connected ? null : t("Connecting...")}
                value={this.state.value}
                onChange={e => {
                  this.setState({ value: e.target.value });
                  this.value = this.state.value;
                }}
                sx={{width: 214}}
              />
            </Grid>
            <Grid item alignItems="stretch" style={{ display: "flex" }}>
              <Button sx={{'width':68}} disabled={!this.state.connected} type="submit" variant="contained" color="primary">{t("Send")} </Button>
            </Grid>
          </Grid>
        </form>
        <div style={{height:4}}/>
        <Grid container spacing={0}>
          <AuditPGPDialog
            open={this.state.audit}
            onClose={() => this.setState({audit:false})}
            orderId={Number(this.props.orderId)}
            messages={this.state.messages}
            own_pub_key={this.state.own_pub_key}
            own_enc_priv_key={this.state.own_enc_priv_key}
            peer_pub_key={this.state.peer_pub_key ? this.state.peer_pub_key : "Not received yet"}
            passphrase={this.state.token}
            onClickBack={() => this.setState({audit:false})}
          />
          <Grid item xs={6}>
            <Button size="small" color="primary" variant="outlined" onClick={()=>this.setState({audit:!this.state.audit})}><KeyIcon/>{t("Audit PGP")} </Button>
          </Grid>
          
          <Grid item xs={6}>
            {/* <ToolTip placement="top" enterTouchDelay={0} enterDelay={1000} enterNextDelay={2000} title={t("Save local messages and credentials as a JSON file")}> */}
              <Button size="small" color="primary" variant="outlined" onClick={()=>saveAsJson('chat_'+this.props.orderId+'.json', this.createJsonFile())}><div style={{width:28,height:20}}><ExportIcon sx={{width:20,height:20}}/></div> {t("Export All")} </Button>
            {/* </ToolTip> */}
          </Grid>
        </Grid>

      </Container>
    )
  }
}

export default withTranslation()(Chat);
