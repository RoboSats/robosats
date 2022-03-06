import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import {Button, TextField, Grid, Container, Card, CardHeader, Paper, Avatar, FormHelperText} from "@mui/material";


export default class Chat extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    messages: [],
    value:'',
  };

  client = new W3CWebSocket('ws://' + window.location.host + '/ws/chat/' + this.props.orderId + '/');

  componentDidMount() {
    this.client.onopen = () => {
      console.log('WebSocket Client Connected')
    }
    this.client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);
      console.log('Got reply!', dataFromServer.type);
      if (dataFromServer){
        this.setState((state) =>
        ({
          messages: [...state.messages,
          {
            msg: dataFromServer.message,
            userNick: dataFromServer.user_nick,
          }],

        })

        )
      }

    }
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  onButtonClicked = (e) => {
    if(this.state.value!=''){
      this.client.send(JSON.stringify({
        type: "message",
        message: this.state.value,
        nick: this.props.ur_nick,
      }));
      this.state.value = ''
    }
    e.preventDefault();
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
            <Paper style={{ height: 300, maxHeight: 300, overflow: 'auto', boxShadow: 'none', }}>
              {this.state.messages.map(message => <>
              <Card elevation={5} align="left" >
              {/* If message sender is not our nick, gray color, if it is our nick, green color */}
              {message.userNick == this.props.ur_nick ? 
                <CardHeader
                  avatar={
                    <Avatar
                      alt={message.userNick}
                      src={window.location.origin +'/static/assets/avatars/' + message.userNick + '.png'} 
                      />
                  }
                  style={{backgroundColor: '#e8ffe6'}}
                  title={message.userNick}
                  subheader={message.msg}
                  subheaderTypographyProps={{sx: {wordWrap: "break-word", width: 200}}}
                />
                :
                <CardHeader
                  avatar={
                    <Avatar
                      alt={message.userNick}
                      src={window.location.origin +'/static/assets/avatars/' + message.userNick + '.png'} 
                      />
                  }
                  style={{backgroundColor: '#fcfcfc'}}
                  title={message.userNick}
                  subheader={message.msg}
                  subheaderTypographyProps={{sx: {wordWrap: "break-word", width: 200}}}
                />} 
                </Card>
              </>)}
              <div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}></div>
            </Paper>
            <form noValidate onSubmit={this.onButtonClicked}>
              <Grid containter alignItems="stretch" style={{ display: "flex" }}>
                <Grid item alignItems="stretch" style={{ display: "flex" }}>
                  <TextField
                    label="Type a message"
                    variant="outlined"
                    size="small"
                    value={this.state.value}
                    onChange={e => {
                      this.setState({ value: e.target.value });
                      this.value = this.state.value;
                    }}
                  />
                </Grid>
                <Grid item alignItems="stretch" style={{ display: "flex" }}>
                  <Button type="submit" variant="contained" color="primary" > Send </Button>
                </Grid>
              </Grid>
            </form>
            <FormHelperText>
              The chat has no memory: if you leave, messages are lost. <a target="_blank" href="https://github.com/Reckless-Satoshi/robosats/blob/main/docs/sensitive-data-PGP-guide.md/"> Learn easy PGP encryption.</a>
            </FormHelperText>
      </Container>
    )
  }
}
