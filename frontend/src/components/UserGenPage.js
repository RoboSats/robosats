import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  Button,
  Tooltip,
  Grid,
  Typography,
  TextField,
  ButtonGroup,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import SmoothImage from 'react-smooth-image';
import { InfoDialog } from './Dialogs';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import CasinoIcon from '@mui/icons-material/Casino';
import ContentCopy from '@mui/icons-material/ContentCopy';
import BoltIcon from '@mui/icons-material/Bolt';
import DownloadIcon from '@mui/icons-material/Download';
import { RoboSatsNoTextIcon } from './Icons';

import { sha256 } from 'js-sha256';
import { genBase62Token, tokenStrength } from '../utils/token';
import { genKey } from '../utils/pgp';
import { getCookie, writeCookie, deleteCookie } from '../utils/cookies';
import { saveAsJson } from '../utils/saveFile';
import { copyToClipboard } from '../utils/clipboard';
import { apiClient } from '../services/api/index';
import RobotAvatar from './Robots/RobotAvatar';

class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openInfo: false,
      tokenHasChanged: false,
      token: '',
    };

    this.refCode = this.props.match.params.refCode;
  }

  componentDidMount() {
    // Checks in parent HomePage if there is already a nick and token
    // Displays the existing one
    if (this.props.nickname != null) {
      this.setState({
        nickname: this.props.nickname,
        token: this.props.token ? this.props.token : '',
        loadingRobot: false,
      });
    } else {
      const newToken = genBase62Token(36);
      this.setState({
        token: newToken,
      });
      this.getGeneratedUser(newToken);
    }
  }

  getGeneratedUser = (token) => {
    const strength = tokenStrength(token);
    const refCode = this.refCode;

    const requestBody = genKey(token).then(function (key) {
      return {
        token_sha256: sha256(token),
        public_key: key.publicKeyArmored,
        encrypted_private_key: key.encryptedPrivateKeyArmored,
        unique_values: strength.uniqueValues,
        counts: strength.counts,
        length: token.length,
        ref_code: refCode,
      };
    });
    requestBody.then((body) =>
      apiClient.post('/api/user/', body).then((data) => {
        this.setState({
          nickname: data.nickname,
          bit_entropy: data.token_bits_entropy,
          shannon_entropy: data.token_shannon_entropy,
          bad_request: data.bad_request,
          found: data.found,
          loadingRobot: false,
          stealthInvoices: data.wants_stealth,
        }) &
          // Add nick and token to App state (token only if not a bad request)
          (data.bad_request
            ? this.props.setAppState({
                nickname: data.nickname,
                avatarLoaded: false,
                activeOrderId: data.active_order_id ? data.active_order_id : null,
                referralCode: data.referral_code,
                earnedRewards: data.earned_rewards,
                lastOrderId: data.last_order_id ? data.last_order_id : null,
                stealthInvoices: data.wants_stealth,
              })
            : this.props.setAppState({
                nickname: data.nickname,
                token,
                avatarLoaded: false,
                activeOrderId: data.active_order_id ? data.active_order_id : null,
                lastOrderId: data.last_order_id ? data.last_order_id : null,
                referralCode: data.referral_code,
                earnedRewards: data.earned_rewards,
                stealthInvoices: data.wants_stealth,
                tgEnabled: data.tg_enabled,
                tgBotName: data.tg_bot_name,
                tgToken: data.tg_token,
              }) &
              writeCookie('robot_token', token) &
              writeCookie('pub_key', data.public_key.split('\n').join('\\')) &
              writeCookie('enc_priv_key', data.encrypted_private_key.split('\n').join('\\'))) &
          // If the robot has been found (recovered) we assume the token is backed up
          (data.found ? this.props.setAppState({ copiedToken: true }) : null);
      }),
    );
  };

  delGeneratedUser() {
    apiClient.delete('/api/user');

    deleteCookie('sessionid');
    deleteCookie('robot_token');
    deleteCookie('pub_key');
    deleteCookie('enc_priv_key');
  }

  handleClickNewRandomToken = () => {
    const token = genBase62Token(36);
    this.setState({
      token,
      tokenHasChanged: true,
    });
    this.props.setAppState({ copiedToken: true });
  };

  handleChangeToken = (e) => {
    this.setState({
      token: e.target.value.split(' ').join(''),
      tokenHasChanged: true,
    });
  };

  handleClickSubmitToken = () => {
    this.delGeneratedUser();
    this.getGeneratedUser(this.state.token);
    this.setState({ loadingRobot: true, tokenHasChanged: false });
    this.props.setAppState({
      avatarLoaded: false,
      nickname: null,
      token: null,
      copiedToken: false,
      lastOrderId: null,
      activeOrderId: null,
    });
  };

  handleClickOpenInfo = () => {
    this.setState({ openInfo: true });
  };

  handleCloseInfo = () => {
    this.setState({ openInfo: false });
  };

  createJsonFile = () => {
    return {
      token: getCookie('robot_token'),
      token_shannon_entropy: this.state.shannon_entropy,
      token_bit_entropy: this.state.bit_entropy,
      public_key: getCookie('pub_key').split('\\').join('\n'),
      encrypted_private_key: getCookie('enc_priv_key').split('\\').join('\n'),
    };
  };

  render() {
    const { t, i18n } = this.props;
    const fontSize = this.props.theme.typography.fontSize;
    const fontSizeFactor = fontSize / 14; // to scale sizes, default fontSize is 14
    return (
      <Grid container spacing={1}>
        <Grid item>
          <div className='clickTrough' />
        </Grid>
        <Grid
          item
          xs={12}
          align='center'
          sx={{ width: 370 * fontSizeFactor, height: 260 * fontSizeFactor }}
        >
          {this.props.avatarLoaded && this.state.nickname ? (
            <div>
              <Grid item xs={12} align='center'>
                <Typography component='h5' variant='h5'>
                  <b>
                    {this.state.nickname && getCookie('sessionid') ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                          height: 45 * fontSizeFactor,
                        }}
                      >
                        <BoltIcon
                          sx={{
                            color: '#fcba03',
                            height: 33 * fontSizeFactor,
                            width: 33 * fontSizeFactor,
                          }}
                        />
                        <a>{this.state.nickname}</a>
                        <BoltIcon
                          sx={{
                            color: '#fcba03',
                            height: 33 * fontSizeFactor,
                            width: 33 * fontSizeFactor,
                          }}
                        />
                      </div>
                    ) : (
                      ''
                    )}
                  </b>
                </Typography>
              </Grid>
              <Grid item xs={12} align='center'>
                <RobotAvatar
                  nickname={this.state.nickname}
                  smooth={true}
                  style={{ maxWidth: 203 * fontSizeFactor, maxHeight: 203 * fontSizeFactor }}
                  imageStyle={{
                    transform: '',
                    border: '2px solid #555',
                    filter: 'drop-shadow(1px 1px 1px #000000)',
                    height: `${201 * fontSizeFactor}px`,
                    width: `${201 * fontSizeFactor}px`,
                  }}
                  tooltip={t('This is your trading avatar')}
                />
                <br />
              </Grid>
            </div>
          ) : (
            <CircularProgress sx={{ position: 'relative', top: 100 }} />
          )}
        </Grid>
        {this.state.found ? (
          <Grid item xs={12} align='center'>
            <Typography variant='subtitle2' color='primary'>
              {this.state.found ? t('A robot avatar was found, welcome back!') : null}
              <br />
            </Typography>
          </Grid>
        ) : (
          ''
        )}
        <Grid container align='center'>
          <Grid item xs={12} align='center'>
            <TextField
              sx={{ maxWidth: 280 * fontSizeFactor }}
              error={!!this.state.bad_request}
              label={t('Store your token safely')}
              required={true}
              value={this.state.token}
              variant='standard'
              helperText={this.state.bad_request}
              size='small'
              onChange={this.handleChangeToken}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.handleClickSubmitToken();
                }
              }}
              InputProps={{
                startAdornment: (
                  <div
                    style={{
                      width: 50 * fontSizeFactor,
                      minWidth: 50 * fontSizeFactor,
                      position: 'relative',
                      left: -6,
                    }}
                  >
                    <Grid container>
                      <Grid item xs={6}>
                        <Tooltip
                          enterTouchDelay={250}
                          title={t('Save token and PGP credentials to file')}
                        >
                          <span>
                            <IconButton
                              color='primary'
                              disabled={
                                !this.props.avatarLoaded ||
                                (!window.NativeRobosats &&
                                  !(getCookie('robot_token') === this.state.token))
                              }
                              onClick={() =>
                                saveAsJson(this.state.nickname + '.json', this.createJsonFile())
                              }
                            >
                              <DownloadIcon
                                sx={{ width: 22 * fontSizeFactor, height: 22 * fontSizeFactor }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={6}>
                        <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                          <IconButton
                            color={this.props.copiedToken ? 'inherit' : 'primary'}
                            disabled={
                              !this.props.avatarLoaded ||
                              (!window.NativeRobosats &&
                                !(getCookie('robot_token') === this.state.token))
                            }
                            onClick={() =>
                              copyToClipboard(getCookie('robot_token')) &
                              this.props.setAppState({ copiedToken: true })
                            }
                          >
                            <ContentCopy
                              sx={{ width: 18 * fontSizeFactor, height: 18 * fontSizeFactor }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </div>
                ),
                endAdornment: (
                  <Tooltip enterTouchDelay={250} title={t('Generate a new token')}>
                    <IconButton onClick={this.handleClickNewRandomToken}>
                      <CasinoIcon
                        sx={{ width: 18 * fontSizeFactor, height: 18 * fontSizeFactor }}
                      />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
        </Grid>
        <Grid item xs={12} align='center'>
          {this.state.tokenHasChanged ? (
            <Button type='submit' size='small' onClick={this.handleClickSubmitToken}>
              <SmartToyIcon sx={{ width: 18 * fontSizeFactor, height: 18 * fontSizeFactor }} />
              <span> {t('Generate Robot')}</span>
            </Button>
          ) : (
            <Tooltip
              enterTouchDelay={0}
              enterDelay={500}
              enterNextDelay={2000}
              title={t('You must enter a new token first')}
            >
              <div>
                <Button disabled={true} type='submit' size='small'>
                  <SmartToyIcon sx={{ width: 18 * fontSizeFactor, height: 18 * fontSizeFactor }} />
                  <span>{t('Generate Robot')}</span>
                </Button>
              </div>
            </Tooltip>
          )}
        </Grid>
        <Grid item xs={12} align='center'>
          <ButtonGroup variant='contained' aria-label='outlined primary button group'>
            <Button
              disabled={
                this.state.loadingRobot !== false ||
                (!window.NativeRobosats &&
                  !(this.props.token ? getCookie('robot_token') === this.props.token : true))
              }
              color='primary'
              to='/make/'
              component={Link}
            >
              {t('Make Order')}
            </Button>
            <Button color='inherit' style={{ color: '#111111' }} onClick={this.handleClickOpenInfo}>
              {t('Info')}
            </Button>
            <InfoDialog
              open={Boolean(this.state.openInfo)}
              maxAmount='4,000,000'
              onClose={this.handleCloseInfo}
            />
            <Button
              disabled={
                this.state.loadingRobot !== false ||
                (!window.NativeRobosats &&
                  !(this.props.token ? getCookie('robot_token') === this.props.token : true))
              }
              color='secondary'
              to='/book/'
              component={Link}
            >
              {t('View Book')}
            </Button>
          </ButtonGroup>
        </Grid>

        <Grid item xs={12} align='center' sx={{ width: 370 * fontSizeFactor }}>
          <Grid item>
            <div style={{ height: 30 * fontSizeFactor }} />
          </Grid>
          <div style={{ width: 370 * fontSizeFactor, left: 30 * fontSizeFactor }}>
            <Grid container align='center'>
              <Grid item xs={0.8} />
              <Grid item xs={7.5} align='right'>
                <Typography component='h5' variant='h5'>
                  {t('Simple and Private LN P2P Exchange')}
                </Typography>
              </Grid>
              <Grid item xs={2.5} align='left'>
                <RoboSatsNoTextIcon
                  color='primary'
                  sx={{ height: 72 * fontSizeFactor, width: 72 * fontSizeFactor }}
                />
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(UserGenPage);
