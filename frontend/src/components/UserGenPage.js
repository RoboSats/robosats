import React, { Component } from "react";
import { Button , Tooltip, Dialog, Grid, Typography, TextField, ButtonGroup, CircularProgress, IconButton} from "@mui/material"
import { Link } from 'react-router-dom'
import Image from 'material-ui-image'
import InfoDialog from './InfoDialog'
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CasinoIcon from '@mui/icons-material/Casino';
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
      loadingRobot: true,
      tokenHasChanged: false,
    };
    this.props.setAppState({avatarLoaded: false, nickname: null, token: null});
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
            loadingRobot:false,
        })
        &
        // Add nick and token to App state (token only if not a bad request)
        (data.bad_request ? this.props.setAppState({
          nickname: data.nickname,
          avatarLoaded: false,
        })
        :
        this.props.setAppState({
          nickname: data.nickname,
          token: this.state.token,
          avatarLoaded: false,
      }));
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

  handleClickNewRandomToken=()=>{
    this.setState({
      token: this.genBase62Token(34),
      tokenHasChanged: true,
      copied: true,
    });
  }

  handleChangeToken=(e)=>{
    this.setState({
      token: e.target.value,
      tokenHasChanged: true,
    })
  }

  handleClickSubmitToken=()=>{
    this.delGeneratedUser();
    this.getGeneratedUser(this.state.token);
    this.setState({loadingRobot: true, tokenHasChanged: false, copied: false});
    this.props.setAppState({avatarLoaded: false, nickname: null, token: null});
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
        <InfoDialog handleCloseInfo = {this.handleCloseInfo}/>
      </Dialog>
    )
  }

  render() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center" sx={{width:370, height:260}}>
          {!this.state.loadingRobot ?
            <div>
              <Grid item xs={12} align="center">
                <Typography component="h5" variant="h5">
                <b>{this.state.nickname ? "⚡"+this.state.nickname+"⚡" : ""}</b>
                </Typography>
              </Grid>
              <Grid item xs={12} align="center">
              <Tooltip enterTouchDelay="0" title="This is your trading avatar">
                <div style={{ maxWidth: 200, maxHeight: 200 }}>
                  <Image className='newAvatar'
                    disableError='true'
                    cover='true'
                    color='null'
                    src={this.state.avatar_url}
                  />
                </div>
                </Tooltip><br/>
              </Grid>
            </div>
            : <CircularProgress sx={{position: 'relative', top: 100, }}/>}
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
              <TextField sx={{maxWidth: 280}}
                //sx={{ input: { color: 'purple' } }}
                // InputLabelProps={{
                //   style: { color: 'green' },
                // }}
                error={this.state.bad_request}
                label={"Store your token safely"}
                required='true'
                value={this.state.token}
                variant='standard'
                helperText={this.state.bad_request}
                size='small'
                // multiline = {true}
                onChange={this.handleChangeToken}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    this.handleClickSubmitToken();
                  }
                }}
                InputProps={{
                  startAdornment:
                  <Tooltip disableHoverListener open={this.state.copied} enterTouchDelay="0" title="Copied!">
                    <IconButton  onClick= {()=> (navigator.clipboard.writeText(this.state.token) & this.setState({copied:true}))}>
                      <ContentCopy color={this.props.avatarLoaded & !this.state.copied & !this.state.bad_request ? 'primary' : 'inherit' } sx={{width:18, height:18}}/>
                    </IconButton>
                  </Tooltip>,
                  endAdornment:
                  <Tooltip enterTouchDelay="250" title="Generate a new token">
                    <IconButton onClick={this.handleClickNewRandomToken}><CasinoIcon/></IconButton>
                  </Tooltip>,
                  }}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} align="center">
            {this.state.tokenHasChanged ?
            <Button type="submit" size='small'  onClick= {this.handleClickSubmitToken}>
              <SmartToyIcon sx={{width:18, height:18}} />
              <span>  Generate Robot</span>
            </Button>
            :
            <Tooltip enterTouchDelay="0" title="You must enter a new token first">
              <div>
              <Button disabled={true} type="submit" size='small' >
                <SmartToyIcon sx={{width:18, height:18}} />
                <span>  Generate Robot</span>
              </Button>
              </div>
            </Tooltip>
            }
          </Grid>
          <Grid item xs={12} align="center">
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
              <Button disabled={this.state.loadingRobot} color='primary' to='/make/' component={Link}>Make Order</Button>
              <Button color='inherit' onClick={this.handleClickOpenInfo}>Info</Button>
              <this.InfoDialog/>
              <Button disabled={this.state.loadingRobot} color='secondary' to='/book/' component={Link}>View Book</Button>
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