import React, { Component } from "react";
import { Button , Grid, Typography, TextField, Select, FormHelperText, MenuItem, FormControl, Radio, FormControlLabel, RadioGroup, Menu} from "@material-ui/core"
import { Link } from 'react-router-dom'
import Image from 'material-ui-image'

export default class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: this.genBase62Token(32),
    };
    this.getGenerateUser();
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

  getGenerateUser() {
    fetch('/api/usergen' + '?token=' + this.state.token)
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


  // Fix next two handler functions so they work sequentially
  // at the moment they make the request generate a new user in parallel
  // to updating the token in the state. So the it works a bit weird.

  handleAnotherButtonPressed=(e)=>{
    this.setState({
      token: this.genBase62Token(32),
    })
    this.getGenerateUser();
  }

  handleChangeToken=(e)=>{
    this.setState({
      token: e.target.value,
    })
    this.getGenerateUser();
  }

  render() {
    return (
      <Grid container spacing={1}>
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
            <div style={{ width: 200, height: 200 }}>
            <Image
              imageStyle={{ width: 200, height: 200}}
              disableError='true'
              src={this.state.avatar_url}
            />
            </div>
          </Grid>
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
            <b>{this.state.nickname ? "⚡"+this.state.nickname+"⚡" : ""}</b>
            </Typography>
          </Grid>
          {
            this.state.found ?
              <Grid item xs={12} align="center">
                <Typography component="subtitle2" variant="subtitle2" color='primary'>
                  We found your robosat, welcome back!<br/>
                </Typography>
                <Button variant='contained' color='primary' to='/home' component={Link}>Cool!</Button>
              </Grid>
             :
             <Grid item xs={12} align="center">
              <Button variant='contained' color='primary' to='/home' component={Link}>Take This Robosat!</Button>
            </Grid>
          }
          
          <Grid item xs={12} align="center">
            <Button variant='contained' to='/' component={Link} onClick={this.handleAnotherButtonPressed}>Give Me Another</Button>
          </Grid>
      </Grid>
    );
  }

}