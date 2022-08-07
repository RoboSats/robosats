import React, { Component } from 'react';
import { withTranslation } from "react-i18next";
import {Button, IconButton, Badge, Tooltip, TextField, Grid, Container, Card, CardHeader, Paper, Avatar, Typography} from "@mui/material";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { encryptMessage , decryptMessage} from "../utils/pgp";
import { getCookie } from "../utils/cookies";
import { saveAsJson } from "../utils/saveFile";
import { copyToClipboard } from "../utils/clipboard";
import { AuditPGPDialog } from "./Dialogs"

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from "@mui/icons-material/ContentCopy";
import VisibilityIcon from '@mui/icons-material/Visibility';
import CircularProgress from '@mui/material/CircularProgress';
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
    showPGP: new Array,
    waitingEcho: false,
    lastSent: '---BLANK---',
    latestIndex: 0,
    scrollNow:false,
  };

  rws = new ReconnectingWebSocket('ws://' + window.location.host + '/ws/chat/' + this.props.orderId + '/');
  
  componentDidMount() {
    this.rws.addEventListener('open', () => {
      console.log('Connected!');
      this.setState({connected: true});
      this.rws.send(JSON.stringify({
        type: "message",
        message: this.state.own_pub_key,
        nick: this.props.ur_nick,
      }));
    });

    this.rws.addEventListener('message', (message) => {

      const dataFromServer = JSON.parse(message.data);
      console.log('Got reply!', dataFromServer.type);
      console.log('PGP message index', dataFromServer.index, ' latestIndex ',this.state.latestIndex);
      if (dataFromServer){
        console.log(dataFromServer)
        this.setState({peer_connected: dataFromServer.peer_connected})

        // If we receive our own key on a message
        if (dataFromServer.message == this.state.own_pub_key){console.log("OWN PUB KEY RECEIVED!!")}

        // If we receive a public key other than ours (our peer key!)
        if (dataFromServer.message.substring(0,36) == `-----BEGIN PGP PUBLIC KEY BLOCK-----` && dataFromServer.message != this.state.own_pub_key) {
          if (dataFromServer.message == this.state.peer_pub_key){
            console.log("PEER HAS RECONNECTED USING HIS PREVIOUSLY KNOWN PUBKEY")
          } else if (dataFromServer.message != this.state.peer_pub_key & this.state.peer_pub_key != null){
            console.log("PEER PUBKEY HAS CHANGED")
          }
          console.log("PEER PUBKEY RECEIVED!!")
          this.setState({peer_pub_key:dataFromServer.message})

          // After receiving the peer pubkey we ask the server for the historic messages if any
          this.rws.send(JSON.stringify({
              type: "message",
              message: `-----SERVE HISTORY-----`,
              nick: this.props.ur_nick,
            }))
        } else

        // If we receive an encrypted message
        if (dataFromServer.message.substring(0,27) == `-----BEGIN PGP MESSAGE-----` && dataFromServer.index > this.state.latestIndex){

          decryptMessage(
            dataFromServer.message.split('\\').join('\n'), 
            dataFromServer.user_nick == this.props.ur_nick ? this.state.own_pub_key : this.state.peer_pub_key, 
            this.state.own_enc_priv_key, 
            this.state.token)
          .then((decryptedData) =>
            this.setState((state) => 
            ({
              scrollNow: true,
              waitingEcho: this.state.waitingEcho == true ? (decryptedData.decryptedMessage == this.state.lastSent ? false: true ) : false,
              lastSent: decryptedData.decryptedMessage == this.state.lastSent ? '----BLANK----': this.state.lastSent,
              latestIndex: dataFromServer.index > this.state.latestIndex ? dataFromServer.index : this.state.latestIndex,
              messages: [...state.messages,
              { 
                index: dataFromServer.index,
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: decryptedData.decryptedMessage,
                validSignature: decryptedData.validSignature,           
                userNick: dataFromServer.user_nick,
                time: dataFromServer.time
              }].sort(function(a,b) {
                // order the message array by their index (increasing)
                return a.index - b.index
              }),
            })
          ));
          
        } else

        // We allow plaintext communication. The user must write # to start
        // If we receive an plaintext message
        if (dataFromServer.message.substring(0,1) == "#"){
          console.log("Got plaintext message", dataFromServer.message)
          this.setState((state) => 
            ({
              scrollNow: true,
              messages: [...state.messages,
              { 
                index: this.state.latestIndex + 0.001,
                encryptedMessage: dataFromServer.message,
                plainTextMessage: dataFromServer.message,
                validSignature: false,           
                userNick: dataFromServer.user_nick,
                time: (new Date).toString(),
              }]}));
          } 
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
    
    // Only fire the scroll and audio when the reason for Update is a new message
    if (this.state.scrollNow){
      const audio = new Audio(`/static/assets/sounds/chat-open.mp3`)
      audio.play();
      this.scrollToBottom();
      this.setState({scrollNow:false});
    }
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  onButtonClicked = (e) => {
    // If input string contains token. Do not set message
    if(this.state.value.indexOf(this.state.token) !== -1){
      alert(`Aye! You just sent your own robot token to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`)
      this.setState({value: ""});
    }

    // If input string contains '#' send unencrypted and unlogged message
    else if(this.state.value.substring(0,1)=='#'){
        this.rws.send(JSON.stringify({
          type: "message",
          message: this.state.value,
          nick: this.props.ur_nick,
        }));
        this.setState({value: ""});
    }
    
    // Else if message is not empty send message 
    else if(this.state.value!=''){
      this.setState({value: "", waitingEcho: true, lastSent:this.state.value})
      encryptMessage(this.state.value, this.state.own_pub_key, this.state.peer_pub_key, this.state.own_enc_priv_key, this.state.token)
      .then((encryptedMessage) =>
        console.log("Sending Encrypted MESSAGE", encryptedMessage) &
        this.rws.send(JSON.stringify({
          type: "message",
          message: encryptedMessage.split('\n').join('\\'),
          nick: this.props.ur_nick,
        }) 
       )
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

  messageCard = (props) => {
    const { t } = this.props;
    return(
      <Card elevation={5} align="left" >
        <CardHeader sx={{color: '#333333'}}
          avatar={
            <Badge variant="dot" overlap="circular" badgeContent="" color={props.userConnected ? "success" : "error"}>
              <Avatar className="flippedSmallAvatar"
                alt={props.message.userNick}
                src={window.location.origin +'/static/assets/avatars/' + props.message.userNick + '.png'}
                />
            </Badge>
          }
          style={{backgroundColor: props.cardColor}}
          title={
            <Tooltip placement="top" enterTouchDelay={0} enterDelay={500} enterNextDelay={2000} title={t(props.message.validSignature ? "Verified signature by {{nickname}}": "Cannot verify signature of {{nickname}}",{"nickname": props.message.userNick})}>
              <div style={{display:'flex',alignItems:'center', flexWrap:'wrap', position:'relative',left:-5, width:240}}>
                <div style={{width:168,display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                  {props.message.userNick}
                  {props.message.validSignature ?
                    <CheckIcon sx={{height:16}} color="success"/>
                  : 
                    <CloseIcon sx={{height:16}} color="error"/> 
                  }
                </div>
                <div style={{width:20}}>
                  <IconButton sx={{height:18,width:18}}
                    onClick={()=>
                    this.setState(prevState => {
                      const newShowPGP = [...prevState.showPGP];
                      newShowPGP[props.index] = !newShowPGP[props.index];
                      return {showPGP: newShowPGP};
                  })}>
                    <VisibilityIcon color={this.state.showPGP[props.index]? "primary":"inherit"} sx={{height:16,width:16,color:this.state.showPGP[props.index]? "primary":"#333333"}}/>
                  </IconButton>
                </div>
                <div style={{width:20}}>
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t("Copied!")}>
                    <IconButton sx={{height:18,width:18}}
                      onClick={()=> copyToClipboard(this.state.showPGP[props.index] ? props.message.encryptedMessage : props.message.plainTextMessage)}>
                      <ContentCopy sx={{height:16,width:16,color:'#333333'}}/>
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </Tooltip>
          }
          subheader={this.state.showPGP[props.index] ? <a> {props.message.time} <br/> {"Valid signature: " + props.message.validSignature} <br/>  {props.message.encryptedMessage} </a> : props.message.plainTextMessage}
          subheaderTypographyProps={{sx: {wordWrap: "break-word", width: '200px', color: '#444444', fontSize: this.state.showPGP[props.index]? 11 : null }}}
        />
      </Card>
    )
  }

  render() {
    const { t } = this.props;
    return (
      <Container component="main">
        <Grid container spacing={0.5}>
          <Grid item xs={0.3}/>
          <Grid item xs={5.5}>
            <Paper elevation={1} style={this.state.connected ? {backgroundColor: '#e8ffe6'}: {backgroundColor: '#FFF1C5'}}>
              <Typography variant='caption' sx={{color: '#333333'}}>
                {t("You")+": "}{this.state.connected ? t("connected"): t("disconnected")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={0.4}/>
          <Grid item xs={5.5}>
            <Paper elevation={1} style={this.state.peer_connected ? {backgroundColor: '#e8ffe6'}: {backgroundColor: '#FFF1C5'}}>
              <Typography variant='caption' sx={{color: '#333333'}}>
              {t("Peer")+": "}{this.state.peer_connected ? t("connected"): t("disconnected")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={0.3}/>
        </Grid>
        <div style={{position:'relative', left:'-2px', margin:'0 auto', width: '285px'}}>
          <Paper elevation={1} style={{height: '300px', maxHeight: '300px' , width: '285px' ,overflow: 'auto', backgroundColor: '#F7F7F7' }}>
            {this.state.messages.map((message, index) =>
            <li style={{listStyleType:"none"}} key={index}>
              {message.userNick == this.props.ur_nick ?
                <this.messageCard message={message} index={index} cardColor={'#eeeeee'} userConnected={this.state.connected}/>
                :
                <this.messageCard message={message} index={index} cardColor={'#fafafa'} userConnected={this.state.peer_connected}/>
              }
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
                  helperText={this.state.connected ? (this.state.peer_pub_key ? null : t("Waiting for peer public key...")) : t("Connecting...")}
                  value={this.state.value}
                  onChange={e => {
                    this.setState({ value: e.target.value });
                    this.value = this.state.value;
                  }}
                  sx={{width: 219}}
                />
              </Grid>
              <Grid item alignItems="stretch" style={{ display: "flex" }}>
                <Button sx={{'width':68}} disabled={!this.state.connected || this.state.waitingEcho || this.state.peer_pub_key == null} type="submit" variant="contained" color="primary">
                  {this.state.waitingEcho ?
                    <div style={{display:'flex',alignItems:'center', flexWrap:'wrap', minWidth:68, width:68, position:"relative",left:15}}>
                      <div style={{width:20}}><KeyIcon sx={{width:18}}/></div>
                      <div style={{width:18}}><CircularProgress size={16} thickness={5}/></div>
                    </div>
                  :
                  t("Send")
                  } 
                </Button>
              </Grid>
            </Grid>
          </form>
        </div>

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
            <Tooltip placement="bottom" enterTouchDelay={0} enterDelay={500} enterNextDelay={2000} title={t("Verify your privacy")}>
              <Button size="small" color="primary" variant="outlined" onClick={()=>this.setState({audit:!this.state.audit})}><KeyIcon/>{t("Audit PGP")} </Button>
            </Tooltip>
          </Grid>
          
          <Grid item xs={6}>
            <Tooltip placement="bottom" enterTouchDelay={0} enterDelay={500} enterNextDelay={2000} title={t("Save full log as a JSON file (messages and credentials)")}>
              <Button size="small" color="primary" variant="outlined" onClick={()=>saveAsJson('complete_log_chat_'+this.props.orderId+'.json', this.createJsonFile())}><div style={{width:28,height:20}}><ExportIcon sx={{width:20,height:20}}/></div> {t("Export")} </Button>
            </Tooltip>
          </Grid>
        </Grid>

      </Container>
    )
  }
}

export default withTranslation()(Chat);
