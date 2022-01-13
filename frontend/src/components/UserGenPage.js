import React, { Component } from "react";
import { Button , Grid, Typography, TextField, ButtonGroup} from "@mui/material"
import { Link } from 'react-router-dom'
import Image from 'material-ui-image'

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

export default class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: this.genBase62Token(34),
    };
    this.getGeneratedUser(this.state.token);
  }

  // sort of cryptographically strong function to generate Base62 token client-side
  genBase62Token(length)
  {   
      return window.btoa(Array.from(
        window.crypto.getRandomValues(
          new Uint8Array(length * 2)))
          .map((b) => String.fromCharCode(b))
          .join("")).replace(/[+/]/g, "")
          .substring(0, length);
  }

  getGeneratedUser(token) {
    fetch('/api/user' + '?token=' + token)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
            nickname: data.nickname,
            bit_entropy: data.token_bits_entropy,
            avatar_url: 'static/assets/avatars/' + data.nickname + '.png',
            shannon_entropy: data.token_shannon_entropy,
            bad_request: data.bad_request,
            found: data.found,
        });
      });
  }

  delGeneratedUser() {
    const requestOptions = {
      method: 'DELETE',
      headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken')},
    };
    fetch("/api/user", requestOptions)
      .then((response) => response.json())
      .then((data) => console.log(data));
  }

  // Fix next two handler functions so they work sequentially
  // at the moment they make the request generate a new user in parallel
  // to updating the token in the state. So the it works a bit weird.

  handleAnotherButtonPressed=(e)=>{
    this.delGeneratedUser()
    this.setState({
      token: this.genBase62Token(34),
    })
    this.reload_for_csrf_to_work();
  }

  handleChangeToken=(e)=>{
    this.delGeneratedUser()
    this.setState({
      token: e.target.value,
    })
    this.getGeneratedUser(e.target.value);
  }

  // TO FIX CSRF TOKEN IS NOT UPDATED UNTIL WINDOW IS RELOADED
  reload_for_csrf_to_work=()=>{
    window.location.reload()
  }

  render() {
    return (
      <Grid container spacing={1}>
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
            <b>{this.state.nickname ? "⚡"+this.state.nickname+"⚡" : ""}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} align="center">
            <div style={{ maxWidth: 200, maxHeight: 200 }}>
              <Image className='newAvatar'
                disableError='true'
                cover='true'
                color='null'
                src={this.state.avatar_url}
              />
            </div><br/>
          </Grid>
          {
            this.state.found ?
              <Grid item xs={12} align="center">
                <Typography component="subtitle2" variant="subtitle2" color='primary'>
                  {this.state.found}<br/>
                </Typography>
              </Grid>
             :
             ""
          }
          <Grid item xs={12} align="center">
            <TextField
              error={this.state.bad_request}
              label='Token - Store safely'
              required='true'
              value={this.state.token}
              variant='standard'
              helperText={this.state.bad_request}
              size='small'
              // multiline = {true}
              onChange={this.handleChangeToken}
            />
          </Grid>
          <Grid item xs={12} align="center">
              <Button onClick={this.handleAnotherButtonPressed}>Generate Another Robosat</Button>
          </Grid>
          <Grid item xs={12} align="center">
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
              <Button color='primary' to='/make/' component={Link}>Make Order</Button>
              <Button color='inherit' to='/info' component={Link}>INFO</Button>
              <Button color='secondary' to='/book/' component={Link}>View Book</Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
            Simple and Private Lightning peer-to-peer Exchange
          </Typography>
          </Grid>
      </Grid>
    );
  }
}