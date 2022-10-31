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

import SmartToyIcon from '@mui/icons-material/SmartToy';
import CasinoIcon from '@mui/icons-material/Casino';
import ContentCopy from '@mui/icons-material/ContentCopy';
import BoltIcon from '@mui/icons-material/Bolt';
import DownloadIcon from '@mui/icons-material/Download';
import { RoboSatsNoTextIcon } from '../components/Icons';

import { sha256 } from 'js-sha256';
import { genBase62Token, tokenStrength, saveAsJson } from '../utils';
import { genKey } from '../pgp';
import { systemClient } from '../services/System';
import { apiClient } from '../services/api/index';
import RobotAvatar from '../components/RobotAvatar';

class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenHasChanged: false,
      inputToken: '',
      found: false,
    };

    this.refCode = this.props.match.params.refCode;
  }

  componentDidMount() {
    // Checks in parent HomePage if there is already a nick and token
    // Displays the existing one
    if (this.props.robot.nickname != null) {
      this.setState({ inputToken: this.props.robot.token });
    } else if (this.props.robot.token) {
      this.setState({ inputToken: this.props.robot.token });
      this.getGeneratedUser(this.props.robot.token);
    } else {
      const newToken = genBase62Token(36);
      this.setState({
        inputToken: newToken,
      });
      this.getGeneratedUser(newToken);
    }
  }

  getGeneratedUser = (token) => {
    const strength = tokenStrength(token);
    const refCode = this.refCode;
    this.props.setRobot({ ...this.props.robot, loading: true, avatarLoaded: false });

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
        this.setState({ found: data.found, bad_request: data.bad_request });
        this.props.setOrder(
          data.active_order_id
            ? data.active_order_id
            : data.last_order_id
            ? data.last_order_id
            : this.props.order,
        );
        // Add nick and token to App state (token only if not a bad request)
        data.bad_request
          ? this.props.setRobot({
              ...this.props.robot,
              avatarLoaded: true,
              loading: false,
              nickname: data.nickname ?? this.props.robot.nickname,
              activeOrderId: data.active_order_id ?? null,
              referralCode: data.referral_code ?? this.props.referralCode,
              earnedRewards: data.earned_rewards ?? this.props.eartnedRewards,
              lastOrderId: data.last_order_id ?? this.props.lastOrderId,
              stealthInvoices: data.wants_stealth ?? this.props.stealthInvoices,
              tgEnabled: data.tg_enabled,
              tgBotName: data.tg_bot_name,
              tgToken: data.tg_token,
            })
          : this.props.setRobot({
              ...this.props.robot,
              nickname: data.nickname,
              token: token,
              loading: false,
              activeOrderId: data.active_order_id ? data.active_order_id : null,
              lastOrderId: data.last_order_id ? data.last_order_id : null,
              referralCode: data.referral_code,
              earnedRewards: data.earned_rewards ?? 0,
              stealthInvoices: data.wants_stealth,
              tgEnabled: data.tg_enabled,
              tgBotName: data.tg_bot_name,
              tgToken: data.tg_token,
              bitsEntropy: data.token_bits_entropy,
              shannonEntropy: data.token_shannon_entropy,
              pubKey: data.public_key,
              encPrivKey: data.encrypted_private_key,
              copiedToken: data.found ? true : this.props.robot.copiedToken,
            }) &
            systemClient.setCookie('robot_token', token) &
            systemClient.setCookie('pub_key', data.public_key.split('\n').join('\\')) &
            systemClient.setCookie(
              'enc_priv_key',
              data.encrypted_private_key.split('\n').join('\\'),
            );
      }),
    );
  };

  delGeneratedUser() {
    apiClient.delete('/api/user');

    systemClient.deleteCookie('sessionid');
    systemClient.deleteCookie('robot_token');
    systemClient.deleteCookie('pub_key');
    systemClient.deleteCookie('enc_priv_key');
  }

  handleClickNewRandomToken = () => {
    const inputToken = genBase62Token(36);
    this.setState({
      inputToken,
      tokenHasChanged: true,
    });
    this.props.setRobot({ ...this.props.robot, copiedToken: true });
  };

  handleChangeToken = (e) => {
    this.setState({
      inputToken: e.target.value.split(' ').join(''),
      tokenHasChanged: true,
    });
  };

  handleClickSubmitToken = () => {
    this.delGeneratedUser();
    this.getGeneratedUser(this.state.inputToken);
    this.setState({ tokenHasChanged: false });
    this.props.setRobot({
      ...this.props.robot,
      avatarLoaded: false,
      nickname: null,
      token: null,
      copiedToken: false,
      lastOrderId: null,
      activeOrderId: null,
    });
  };

  createJsonFile = () => {
    return {
      token: this.props.robot.token,
      token_shannon_entropy: this.props.robot.shannonEntropy,
      token_bit_entropy: this.props.robot.bitsEntropy,
      public_key: this.props.robot.pub_key,
      encrypted_private_key: this.props.robot.enc_priv_key,
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
          {this.props.robot.avatarLoaded && this.props.robot.nickname ? (
            <div>
              <Grid item xs={12} align='center'>
                <Typography component='h5' variant='h5'>
                  <b>
                    {this.props.robot.nickname && systemClient.getCookie('sessionid') ? (
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
                        <a>{this.props.robot.nickname}</a>
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
                  nickname={this.props.robot.nickname}
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
                  tooltipPosition='top'
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
              value={this.state.inputToken}
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
                                !this.props.robot.avatarLoaded ||
                                !(systemClient.getCookie('robot_token') == this.state.inputToken)
                              }
                              onClick={() =>
                                saveAsJson(
                                  this.props.robot.nickname + '.json',
                                  this.createJsonFile(),
                                )
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
                            color={this.props.robot.copiedToken ? 'inherit' : 'primary'}
                            disabled={
                              !this.props.robot.avatarLoaded ||
                              !(systemClient.getCookie('robot_token') === this.state.inputToken)
                            }
                            onClick={() =>
                              systemClient.copyToClipboard(systemClient.getCookie('robot_token')) &
                              this.props.setRobot({ ...this.props.robot, copiedToken: true })
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

        <Grid item xs={12} align='center' sx={{ width: '26.43em' }}>
          <Grid item>
            <div style={{ height: '2.143em' }} />
          </Grid>
          <div style={{ width: '26.43em', left: '2.143em' }}>
            <Grid container align='center'>
              <Grid item xs={0.8} />
              <Grid item xs={7.5} align='right'>
                <Typography component='h5' variant='h5'>
                  {t('Simple and Private LN P2P Exchange')}
                </Typography>
              </Grid>
              <Grid item xs={2.5} align='left'>
                <RoboSatsNoTextIcon color='primary' sx={{ height: '3.143em', width: '3.143em' }} />
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(UserGenPage);
