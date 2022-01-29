import React, { Component } from "react";
import { Button , Dialog, Grid, Typography, TextField, ButtonGroup, CircularProgress, IconButton} from "@mui/material"
import { Link } from 'react-router-dom'
import Image from 'material-ui-image'
import InfoDialog from './InfoDialog'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCopy from "@mui/icons-material/ContentCopy";

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
      openInfo: false,
      showRobosat: true,
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

  getGeneratedUser=(token)=>{
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
            showRobosat:true,
        })
        &
        this.props.setAppState({
          nickname: data.nickname,
          token: this.state.token,
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

  handleAnotherButtonPressed=(e)=>{
    this.delGeneratedUser()
    // this.setState({
    //   showRobosat: false,
    //   token: this.genBase62Token(34),
    // });
    // this.getGeneratedUser(this.state.token);
    window.location.reload();
  }

  handleChangeToken=(e)=>{
    this.delGeneratedUser()
    this.setState({
      token: e.target.value,
    })
    this.getGeneratedUser(e.target.value);
    this.setState({showRobosat: false})
  }

  handleClickOpenInfo = () => {
    this.setState({openInfo: true});
  };

  handleCloseInfo = () => {
    this.setState({openInfo: false});
  };

  InfoDialog =() =>{
    return(
      <Dialog
        open={this.state.openInfo}
        onClose={this.handleCloseInfo}
        aria-labelledby="info-dialog-title"
        aria-describedby="info-dialog-description"
        scroll="paper"
      >
        <InfoDialog/>
      </Dialog>
    )
  }

  render() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center" sx={{width:370}}>
          {this.state.showRobosat ?
            <div>
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
            </div>
            : <CircularProgress />}
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
          <Grid container align="center">
            <Grid item xs={12} align="center">
              <IconButton onClick= {()=>navigator.clipboard.writeText(this.state.token)}>
                <ContentCopy/>
              </IconButton>
              <TextField
                //sx={{ input: { color: 'purple' } }}
                InputLabelProps={{
                  style: { color: 'green' },
                }}
                error={this.state.bad_request}
                label='Store your token safely'
                required='true'
                value={this.state.token}
                variant='standard'
                helperText={this.state.bad_request}
                size='small'
                // multiline = {true}
                onChange={this.handleChangeToken}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} align="center">
              <Button size='small'  onClick={this.handleAnotherButtonPressed}>Generate Another Robosat</Button>
          </Grid>
          <Grid item xs={12} align="center">
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
              <Button color='primary' to='/make/' component={Link}>Make Order</Button>
              <Button color='inherit' onClick={this.handleClickOpenInfo}>Info</Button>
              <this.InfoDialog/>
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