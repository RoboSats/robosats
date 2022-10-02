import React, { Component } from 'react';
import { withTranslation, Trans } from 'react-i18next';
import {
  Alert,
  AlertTitle,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Box,
  Link,
  Paper,
  Rating,
  Button,
  Tooltip,
  CircularProgress,
  Grid,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import QRCode from 'react-qr-code';
import Countdown, { zeroPad } from 'react-countdown';
import Chat from './EncryptedChat';
import TradeSummary from './TradeSummary';
import MediaQuery from 'react-responsive';
import { copyToClipboard } from '../utils/clipboard';
import { apiClient } from '../services/api';

// Icons
import PercentIcon from '@mui/icons-material/Percent';
import BookIcon from '@mui/icons-material/Book';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import BalanceIcon from '@mui/icons-material/Balance';
import ContentCopy from '@mui/icons-material/ContentCopy';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import LinkIcon from '@mui/icons-material/Link';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NewTabIcon } from './Icons';

import { getCookie } from '../utils/cookies';
import { pn } from '../utils/prettyNumbers';

class TradeBox extends Component {
  invoice_escrow_duration = 3;

  constructor(props) {
    super(props);
    this.state = {
      openConfirmFiatReceived: false,
      openConfirmDispute: false,
      receiveTab: 0,
      address: '',
      miningFee: 1.05,
      badInvoice: false,
      badAddress: false,
      badStatement: false,
    };
  }

  Sound = (soundFileName) => (
    // Four filenames: "locked-invoice", "taker-found", "open-chat", "successful"
    <audio autoPlay src={`/static/assets/sounds/${soundFileName}.mp3`} />
  );

  stepXofY = () => {
    // set y value
    let x = null;
    let y = null;
    const status = this.props.data.status;

    if (this.props.data.is_maker) {
      y = 5;
    }
    if (this.props.data.is_taker) {
      y = 4;
    }

    // set x values
    if (this.props.data.is_maker) {
      if (status == 0) {
        x = 1;
      } else if ([1, 2, 3].includes(status)) {
        x = 2;
      } else if ([6, 7, 8].includes(status)) {
        x = 3;
      } else if (status == 9) {
        x = 4;
      } else if (status == 10) {
        x = 5;
      }
    }
    if (this.props.data.is_taker) {
      if (status == 3) {
        x = 1;
      } else if ([6, 7, 8].includes(status)) {
        x = 2;
      } else if (status == 9) {
        x = 3;
      } else if (status == 10) {
        x = 4;
      }
    }

    // Return "(x/y)"
    if ((x != null) & (y != null)) {
      return '(' + x + '/' + y + ')';
    } else {
      return '';
    }
  };

  handleClickOpenConfirmDispute = () => {
    this.setState({ openConfirmDispute: true });
  };

  handleClickCloseConfirmDispute = () => {
    this.setState({ openConfirmDispute: false });
  };

  handleClickAgreeDisputeButton = () => {
    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'dispute',
      })
      .then((data) => this.props.completeSetState(data));
    this.handleClickCloseConfirmDispute();
  };

  ConfirmDisputeDialog = () => {
    const { t } = this.props;
    return (
      <Dialog
        open={this.state.openConfirmDispute}
        onClose={this.handleClickCloseConfirmDispute}
        aria-labelledby='open-dispute-dialog-title'
        aria-describedby='open-dispute-dialog-description'
      >
        <DialogTitle id='open-dispute-dialog-title'>
          {t('Do you want to open a dispute?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {t(
              'The RoboSats staff will examine the statements and evidence provided. You need to build a complete case, as the staff cannot read the chat. It is best to provide a burner contact method with your statement. The satoshis in the trade escrow will be sent to the dispute winner, while the dispute loser will lose the bond.',
            )}
          </DialogContentText>
          <br />
          <DialogContentText id='alert-dialog-description'>
            {t(
              'Make sure to EXPORT the chat log. The staff might request your exported chat log JSON in order to solve discrepancies. It is your responsibility to store it.',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmDispute} autoFocus>
            {t('Disagree')}
          </Button>
          <Button onClick={this.handleClickAgreeDisputeButton}>
            {t('Agree and open dispute')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  handleClickOpenConfirmFiatReceived = () => {
    this.setState({ openConfirmFiatReceived: true });
  };

  handleClickCloseConfirmFiatReceived = () => {
    this.setState({ openConfirmFiatReceived: false });
  };

  handleClickTotallyConfirmFiatReceived = () => {
    this.handleClickConfirmButton();
    this.handleClickCloseConfirmFiatReceived();
  };

  ConfirmFiatReceivedDialog = () => {
    const { t } = this.props;
    return (
      <Dialog
        open={this.state.openConfirmFiatReceived}
        onClose={this.handleClickCloseConfirmFiatReceived}
        aria-labelledby='fiat-received-dialog-title'
        aria-describedby='fiat-received-dialog-description'
      >
        <DialogTitle id='open-dispute-dialog-title'>
          {t('Confirm you received {{amount}} {{currencyCode}}?', {
            currencyCode: this.props.data.currencyCode,
            amount: pn(
              parseFloat(
                parseFloat(this.props.data.amount).toFixed(
                  this.props.data.currency == 1000 ? 8 : 4,
                ),
              ),
            ),
          })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {t(
              'Confirming that you received the fiat will finalize the trade. The satoshis in the escrow will be released to the buyer. Only confirm after the {{amount}} {{currencyCode}} have arrived to your account. In addition, if you have received the payment and do not confirm it, you risk losing your bond.',
              {
                currencyCode: this.props.data.currencyCode,
                amount: pn(
                  parseFloat(
                    parseFloat(this.props.data.amount).toFixed(
                      this.props.data.currency == 1000 ? 8 : 4,
                    ),
                  ),
                ),
              },
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmFiatReceived} autoFocus>
            {t('Go back')}
          </Button>
          <Button onClick={this.handleClickTotallyConfirmFiatReceived}>{t('Confirm')}</Button>
        </DialogActions>
      </Dialog>
    );
  };

  showQRInvoice = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* <Grid item xs={12} align="center">
          <Typography  variant="body2">
            {t("Robots show commitment to their peers")}
          </Typography>
        </Grid> */}
        <Grid item xs={12} align='center'>
          {this.props.data.is_maker ? (
            <Typography color='primary' variant='subtitle1'>
              <b>
                {t('Lock {{amountSats}} Sats to PUBLISH order', {
                  amountSats: pn(this.props.data.bond_satoshis),
                })}
              </b>{' '}
              {' ' + this.stepXofY()}
            </Typography>
          ) : (
            <Typography color='primary' variant='subtitle1'>
              <b>
                {t('Lock {{amountSats}} Sats to TAKE order', {
                  amountSats: pn(this.props.data.bond_satoshis),
                })}
              </b>{' '}
              {' ' + this.stepXofY()}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} align='center'>
          {this.compatibleWalletsButton()}
        </Grid>

        <Grid item xs={12} align='center'>
          <QRCode
            bgColor={'rgba(255, 255, 255, 0)'}
            fgColor={this.props.theme.palette.text.primary}
            value={this.props.data.bond_invoice}
            size={305}
          />
          <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
            <Button
              size='small'
              color='inherit'
              onClick={() => {
                copyToClipboard(this.props.data.bond_invoice);
              }}
              align='center'
            >
              {' '}
              <ContentCopy />
              {t('Copy to clipboard')}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} align='center'>
          <TextField
            hiddenLabel
            variant='standard'
            size='small'
            defaultValue={this.props.data.bond_invoice}
            disabled={true}
            helperText={t(
              'This is a hold invoice, it will freeze in your wallet. It will be charged only if you cancel or lose a dispute.',
            )}
            color='secondary'
          />
        </Grid>
      </Grid>
    );
  };

  showBondIsLocked = () => {
    const { t } = this.props;
    return (
      <Grid item xs={12} align='center'>
        <Typography color='primary' variant='subtitle1' align='center'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <LockIcon />
            {this.props.data.is_maker
              ? t('Your maker bond is locked')
              : t('Your taker bond is locked')}
          </div>
        </Typography>
      </Grid>
    );
  };

  showBondIsSettled = () => {
    const { t } = this.props;
    return (
      <Grid item xs={12} align='center'>
        <Typography color='error' variant='subtitle1' align='center'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              align: 'center',
            }}
            align='center'
          >
            <BalanceIcon />
            {this.props.data.is_maker
              ? t('Your maker bond was settled')
              : t('Your taker bond was settled')}
          </div>
        </Typography>
      </Grid>
    );
  };

  showBondIsReturned = () => {
    const { t } = this.props;
    return (
      <Grid item xs={12} align='center'>
        <Typography color='green' variant='subtitle1' align='center'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <LockOpenIcon />
            {this.props.data.is_maker
              ? t('Your maker bond was unlocked')
              : t('Your taker bond was unlocked')}
          </div>
        </Typography>
      </Grid>
    );
  };

  showEscrowQRInvoice = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make sound for Taker found or HTLC received. */}
        {this.props.data.is_maker ? this.Sound('taker-found') : this.Sound('locked-invoice')}
        <Grid item xs={12} align='center'>
          <Typography color='orange' variant='subtitle1'>
            <b>
              {t('Lock {{amountSats}} Sats as collateral', {
                amountSats: pn(this.props.data.escrow_satoshis),
              })}
            </b>
            {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <Typography variant='body2'>
            {t(
              'You risk losing your bond if you do not lock the collateral. Total time available is {{deposit_timer_hours}}h {{deposit_timer_minutes}}m.',
              this.depositHoursMinutes(),
            )}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <QRCode
            bgColor={'rgba(255, 255, 255, 0)'}
            fgColor={this.props.theme.palette.text.primary}
            value={this.props.data.escrow_invoice}
            size={305}
          />
          <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
            <Button
              size='small'
              color='inherit'
              onClick={() => {
                copyToClipboard(this.props.data.escrow_invoice);
              }}
              align='center'
            >
              {' '}
              <ContentCopy />
              {t('Copy to clipboard')}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} align='center'>
          <TextField
            hiddenLabel
            variant='filled'
            size='small'
            defaultValue={this.props.data.escrow_invoice}
            disabled={true}
            helperText={t(
              'This is a hold invoice, it will freeze in your wallet. It will be released to the buyer once you confirm to have received the {{currencyCode}}.',
              { currencyCode: this.props.data.currencyCode },
            )}
            color='secondary'
          />
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  };

  showTakerFound = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make bell sound when taker is found. SUPRESSED: It's annoying, not the right moment! Play only after taker locks bon */}
        {/* {this.Sound("taker-found")} */}
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b>{t('A taker has been found!')}</b> {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Divider />
        <Grid item xs={12} align='center'>
          <Typography variant='body2'>
            {t(
              'Please wait for the taker to lock a bond. If the taker does not lock a bond in time, the order will be made public again.',
            )}
          </Typography>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  };

  depositHoursMinutes = () => {
    const hours = parseInt(this.props.data.escrow_duration / 3600);
    const minutes = parseInt((this.props.data.escrow_duration - hours * 3600) / 60);
    const dict = { deposit_timer_hours: hours, deposit_timer_minutes: minutes };
    return dict;
  };

  handleClickPauseOrder = () => {
    this.props.completeSetState({ pauseLoading: true });
    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'pause',
      })
      .then((data) => this.props.getOrderDetails(data.id));
  };

  showMakerWait = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for HTLC received. */}
        {this.Sound('locked-invoice')}
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b> {t('Your order is public')} </b> {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'Be patient while robots check the book. This box will ring 🔊 once a robot takes your order, then you will have {{deposit_timer_hours}}h {{deposit_timer_minutes}}m to reply. If you do not reply, you risk losing your bond.',
                  this.depositHoursMinutes(),
                )}
              </Typography>
            </ListItem>

            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'If the order expires untaken, your bond will return to you (no action needed).',
                )}
              </Typography>
            </ListItem>

            <Divider />

            <Grid container>
              <Grid item xs={10}>
                <ListItem>
                  <ListItemIcon>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={this.props.data.num_similar_orders}
                    secondary={t('Public orders for {{currencyCode}}', {
                      currencyCode: this.props.data.currencyCode,
                    })}
                  />
                </ListItem>
              </Grid>

              <Grid item xs={2}>
                <div style={{ position: 'relative', top: '7px', right: '14px' }}>
                  {this.props.pauseLoading ? (
                    <CircularProgress sx={{ width: '30px', height: '30px' }} />
                  ) : (
                    <Tooltip
                      placement='top'
                      enterTouchDelay={500}
                      enterDelay={700}
                      enterNextDelay={2000}
                      title={t('Pause the public order')}
                    >
                      <Button color='primary' onClick={this.handleClickPauseOrder}>
                        <PauseCircleIcon sx={{ width: '36px', height: '36px' }} />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </Grid>
            </Grid>

            <Divider />
            <ListItem>
              <ListItemIcon>
                <PercentIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  t('Premium rank') + ' ' + parseInt(this.props.data.premium_percentile * 100) + '%'
                }
                secondary={t('Among public {{currencyCode}} orders (higher is cheaper)', {
                  currencyCode: this.props.data.currencyCode,
                })}
              />
            </ListItem>
            <Divider />
          </List>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  };

  showPausedOrder = () => {
    const { t } = this.props;
    return (
      <Grid container align='center' spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b> {t('Your order is paused')} </b> {' ' + this.stepXofY()}
          </Typography>
        </Grid>

        <Grid item xs={12} align='center'>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'Your public order has been paused. At the moment it cannot be seen or taken by other robots. You can choose to unpause it at any time.',
                )}
              </Typography>
            </ListItem>

            <Grid item xs={12} align='center'>
              {this.props.pauseLoading ? (
                <CircularProgress />
              ) : (
                <Button color='primary' onClick={this.handleClickPauseOrder}>
                  <PlayCircleIcon sx={{ width: '36px', height: '36px' }} />
                  {t('Unpause Order')}
                </Button>
              )}
            </Grid>

            <Divider />
          </List>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  };

  handleInputInvoiceChanged = (e) => {
    this.setState({
      invoice: e.target.value,
      badInvoice: false,
    });
  };

  handleClickSubmitInvoiceButton = () => {
    this.setState({ badInvoice: false });

    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'update_invoice',
        invoice: this.state.invoice,
      })
      .then(
        (data) =>
          this.setState({ badInvoice: data.bad_invoice }) & this.props.completeSetState(data),
      );
  };

  handleInputAddressChanged = (e) => {
    this.setState({
      address: e.target.value,
      badAddress: false,
    });
  };

  handleMiningFeeChanged = (e) => {
    let fee = e.target.value;
    if (fee > 50) {
      fee = 50;
    }

    this.setState({
      miningFee: fee,
    });
  };

  handleClickSubmitAddressButton = () => {
    this.setState({ badInvoice: false });

    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'update_address',
        address: this.state.address,
        mining_fee_rate: Math.max(1, this.state.miningFee),
      })
      .then(
        (data) =>
          this.setState({ badAddress: data.bad_address }) & this.props.completeSetState(data),
      );
  };

  handleInputDisputeChanged = (e) => {
    this.setState({
      statement: e.target.value,
      badStatement: false,
    });
  };

  handleClickSubmitStatementButton = () => {
    this.setState({ badInvoice: false });

    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'submit_statement',
        statement: this.state.statement,
      })
      .then(
        (data) =>
          this.setState({ badStatement: data.bad_statement }) & this.props.completeSetState(data),
      );
  };

  handleScan = (data) => {
    if (data) {
      this.setState({
        invoice: data,
      });
    }
  };

  handleError = (err) => {
    console.error(err);
  };

  compatibleWalletsButton = () => {
    const { t } = this.props;

    return (
      <Button
        color='primary'
        component={Link}
        href={'https://learn.robosats.com/docs/wallets/'}
        target='_blank'
        align='center'
      >
        <AccountBalanceWalletIcon />
        {t('See Compatible Wallets')}
        <NewTabIcon sx={{ width: 16, height: 16 }} />
      </Button>
    );
  };

  showInputInvoice() {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          {/* Make sound for Taker found or HTLC received. */}
          {this.props.data.is_maker ? this.Sound('taker-found') : this.Sound('locked-invoice')}
          <Typography color='primary' variant='subtitle1'>
            <b>
              {' '}
              {t('Submit payout info for {{amountSats}} Sats', {
                amountSats: pn(this.props.data.invoice_amount),
              })}
            </b>{' '}
            {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <List dense={true}>
          <Divider />
          <ListItem>
            <Typography variant='body2'>
              {t(
                'Before letting you send {{amountFiat}} {{currencyCode}}, we want to make sure you are able to receive the BTC.',
                {
                  amountFiat: pn(
                    parseFloat(
                      parseFloat(this.props.data.amount).toFixed(
                        this.props.data.currency == 1000 ? 8 : 4,
                      ),
                    ),
                  ),
                  currencyCode: this.props.data.currencyCode,
                },
              )}
            </Typography>
          </ListItem>
        </List>

        <Grid item xs={12} align='center'>
          <ToggleButtonGroup size='small' value={this.state.receiveTab} exclusive>
            <ToggleButton
              value={0}
              disableRipple={true}
              onClick={() => this.setState({ receiveTab: 0 })}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <BoltIcon /> {t('Lightning')}
              </div>
            </ToggleButton>
            <ToggleButton
              value={1}
              disabled={!this.props.data.swap_allowed}
              onClick={() =>
                this.setState({
                  receiveTab: 1,
                  miningFee: parseFloat(this.props.data.suggested_mining_fee_rate),
                })
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <LinkIcon /> {t('Onchain')}
              </div>
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        {/* LIGHTNING PAYOUT TAB */}
        <div style={{ display: this.state.receiveTab == 0 ? '' : 'none' }}>
          <div style={{ height: 15 }} />
          <Grid container spacing={1}>
            <Grid item xs={12} align='center'>
              <Typography variant='body2'>
                {t('Submit a valid invoice for {{amountSats}} Satoshis.', {
                  amountSats: pn(this.props.data.invoice_amount),
                })}
              </Typography>
            </Grid>

            <Grid item xs={12} align='center'>
              {this.compatibleWalletsButton()}
            </Grid>

            <Grid item xs={12} align='center'>
              <TextField
                error={this.state.badInvoice}
                helperText={this.state.badInvoice ? t(this.state.badInvoice) : ''}
                label={t('Payout Lightning Invoice')}
                required
                value={this.state.invoice}
                inputProps={{
                  style: { textAlign: 'center' },
                  maxHeight: 200,
                }}
                multiline
                minRows={4}
                maxRows={8}
                onChange={this.handleInputInvoiceChanged}
              />
            </Grid>
            <Grid item xs={12} align='center'>
              <Button
                onClick={this.handleClickSubmitInvoiceButton}
                variant='contained'
                color='primary'
              >
                {t('Submit')}
              </Button>
            </Grid>
          </Grid>
        </div>

        {/* ONCHAIN PAYOUT TAB */}
        <div style={{ display: this.state.receiveTab == 1 ? '' : 'none' }}>
          <List dense={true}>
            <ListItem>
              <Typography variant='body2'>
                <b>{t('EXPERIMENTAL: ')}</b>
                {t('RoboSats will do a swap and send the Sats to your onchain address.')}
              </Typography>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary={
                  pn(
                    parseInt(
                      (this.props.data.invoice_amount * this.props.data.swap_fee_rate) / 100,
                    ),
                  ) +
                  ' Sats (' +
                  this.props.data.swap_fee_rate +
                  '%)'
                }
                secondary={t('Swap fee')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary={
                  pn(parseInt(Math.max(1, this.state.miningFee) * 141)) +
                  ' Sats (' +
                  Math.max(1, this.state.miningFee) +
                  ' Sats/vByte)'
                }
                secondary={t('Mining fee')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary={
                  <b>
                    {pn(
                      parseInt(
                        this.props.data.invoice_amount -
                          Math.max(1, this.state.miningFee) * 141 -
                          (this.props.data.invoice_amount * this.props.data.swap_fee_rate) / 100,
                      ),
                    ) + ' Sats'}
                  </b>
                }
                secondary={t('Final amount you will receive')}
              />
            </ListItem>
          </List>
          <TextField
            error={this.state.badAddress}
            helperText={this.state.badAddress ? t(this.state.badAddress) : ''}
            label={t('Bitcoin Address')}
            required
            value={this.state.invoice}
            sx={{ width: 170 }}
            inputProps={{
              style: { textAlign: 'center' },
            }}
            onChange={this.handleInputAddressChanged}
          />
          <TextField
            error={this.state.miningFee < 1 || this.state.miningFee > 50}
            helperText={this.state.miningFee < 1 || this.state.miningFee > 50 ? 'Invalid' : ''}
            label={t('Mining Fee')}
            required
            sx={{ width: 110 }}
            value={this.state.miningFee}
            type='number'
            inputProps={{
              max: 50,
              min: 1,
              style: { textAlign: 'center' },
            }}
            onChange={this.handleMiningFeeChanged}
          />
          <div style={{ height: 10 }} />

          <Grid item xs={12} align='center'>
            <Button
              onClick={this.handleClickSubmitAddressButton}
              variant='contained'
              color='primary'
            >
              {t('Submit')}
            </Button>
          </Grid>
        </div>
        <List>
          <Divider />
        </List>

        {this.showBondIsLocked()}
      </Grid>
    );
  }

  // Asks the user for a dispute statement.
  showInDisputeStatement = () => {
    const { t } = this.props;
    if (this.props.data.statement_submitted) {
      return (
        <Grid container spacing={1}>
          <Grid item xs={12} align='center'>
            <Typography color='primary' variant='subtitle1'>
              <b> {t('We have received your statement')} </b>
            </Typography>
          </Grid>
          <Grid item xs={12} align='center'>
            <List dense={true}>
              <Divider />
              <ListItem>
                <Typography variant='body2'>
                  {t(
                    'We are waiting for your trade counterpart statement. If you are hesitant about the state of the dispute or want to add more information, contact robosats@protonmail.com.',
                  )}
                </Typography>
              </ListItem>
              <ListItem>
                <Typography variant='body2'>
                  {t(
                    'Please, save the information needed to identify your order and your payments: order ID; payment hashes of the bonds or escrow (check on your lightning wallet); exact amount of satoshis; and robot nickname. You will have to identify yourself as the user involved in this trade via email (or other contact methods).',
                  )}
                </Typography>
              </ListItem>
              <Divider />
            </List>
          </Grid>
          {this.showBondIsSettled()}
        </Grid>
      );
    } else {
      return (
        // TODO Option to upload files

        <Grid container spacing={1}>
          <Grid item xs={12} align='center'>
            <Typography color='primary' variant='subtitle1'>
              <b> {t('A dispute has been opened')} </b>
            </Typography>
          </Grid>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2'>
                {t(
                  'Please, submit your statement. Be clear and specific about what happened and provide the necessary evidence. You MUST provide a contact method: burner email, XMPP or telegram username to follow up with the staff. Disputes are solved at the discretion of real robots (aka humans), so be as helpful as possible to ensure a fair outcome. Max 5000 chars.',
                )}
              </Typography>
            </ListItem>

            <Grid item xs={12} align='center'>
              <TextField
                error={this.state.badStatement}
                helperText={this.state.badStatement ? this.state.badStatement : ''}
                label={t('Submit dispute statement')}
                required
                inputProps={{
                  style: { textAlign: 'center' },
                }}
                multiline
                rows={4}
                onChange={this.handleInputDisputeChanged}
              />
            </Grid>
            <Grid item xs={12} align='center'>
              <Button
                onClick={this.handleClickSubmitStatementButton}
                variant='contained'
                color='primary'
              >
                Submit
              </Button>
            </Grid>
          </List>
          {this.showBondIsSettled()}
        </Grid>
      );
    }
  };

  showWaitForDisputeResolution = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography color='primary' variant='subtitle1'>
            <b> {t('We have the statements')} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2'>
                {t(
                  'Both statements have been received, wait for the staff to resolve the dispute. If you are hesitant about the state of the dispute or want to add more information, contact robosats@protonmail.com. If you did not provide a contact method, or are unsure whether you wrote it right, write us immediately.',
                )}
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant='body2'>
                {t(
                  'Please, save the information needed to identify your order and your payments: order ID; payment hashes of the bonds or escrow (check on your lightning wallet); exact amount of satoshis; and robot nickname. You will have to identify yourself as the user involved in this trade via email (or other contact methods).',
                )}
              </Typography>
            </ListItem>
            <Divider />
          </List>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    );
  };

  showDisputeWinner = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography color='primary' variant='subtitle1'>
            <b> {t('You have won the dispute')} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align='left'>
          <Typography variant='body2'>
            {t(
              'You can claim the dispute resolution amount (escrow and fidelity bond) from your profile rewards. If there is anything the staff can help with, do not hesitate to contact to robosats@protonmail.com (or via your provided burner contact method).',
            )}
          </Typography>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    );
  };

  showDisputeLoser = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography color='error' variant='subtitle1'>
            <b> {t('You have lost the dispute')} </b>
          </Typography>
        </Grid>
        <Grid item xs={12} align='left'>
          <Typography variant='body2'>
            {t(
              'Unfortunately you have lost the dispute. If you think this is a mistake you can ask to re-open the case via email to robosats@protonmail.com. However, chances of it being investigated again are low.',
            )}
          </Typography>
        </Grid>
        {this.showBondIsSettled()}
      </Grid>
    );
  };

  showWaitingForEscrow() {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b>{t('Your info looks good!')}</b> {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2' align='left'>
                {t('We are waiting for the seller to lock the trade amount.')}
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'Just hang on for a moment. If the seller does not deposit, you will get your bond back automatically. In addition, you will receive a compensation (check the rewards in your profile).',
                )}
              </Typography>
            </ListItem>
            <Divider />
          </List>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  }

  showWaitingForBuyerInvoice() {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for HTLC received. */}
        {this.Sound('locked-invoice')}
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b>{t('The trade collateral is locked!')}</b> {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <List dense={true}>
            <Divider />
            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'We are waiting for the buyer to post a lightning invoice. Once he does, you will be able to directly communicate the fiat payment details.',
                )}
              </Typography>
            </ListItem>

            <ListItem>
              <Typography variant='body2' align='left'>
                {t(
                  'Just hang on for a moment. If the buyer does not cooperate, you will get back the trade collateral and your bond automatically. In addition, you will receive a compensation (check the rewards in your profile).',
                )}
              </Typography>
            </ListItem>
            <Divider />
          </List>
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  }

  handleClickConfirmButton = () => {
    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'confirm',
      })
      .then((data) => this.props.completeSetState(data));
  };

  handleRatingUserChange = (e) => {
    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'rate_user',
        rating: e.target.value,
      })
      .then((data) => this.props.completeSetState(data));
  };

  handleRatingRobosatsChange = (e) => {
    if (this.state.rating_platform != null) {
      return null;
    }
    this.setState({ rating_platform: e.target.value });

    apiClient
      .post('/api/order/?order_id=' + this.props.data.id, {
        action: 'rate_platform',
        rating: e.target.value,
      })
      .then((data) => this.props.completeSetState(data));
  };

  showFiatSentButton() {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Button
            defaultValue='confirm'
            variant='contained'
            color='secondary'
            onClick={this.handleClickConfirmButton}
          >
            {t('Confirm {{amount}} {{currencyCode}} sent', {
              currencyCode: this.props.data.currencyCode,
              amount: pn(
                parseFloat(
                  parseFloat(this.props.data.amount).toFixed(
                    this.props.data.currency == 1000 ? 8 : 4,
                  ),
                ),
              ),
            })}
          </Button>
        </Grid>
      </Grid>
    );
  }

  showFiatReceivedButton() {
    const { t } = this.props;
    return (
      <Grid item xs={12} align='center'>
        <Button
          defaultValue='confirm'
          variant='contained'
          color='secondary'
          onClick={this.handleClickOpenConfirmFiatReceived}
        >
          {t('Confirm {{amount}} {{currencyCode}} received', {
            currencyCode: this.props.data.currencyCode,
            amount: pn(
              parseFloat(
                parseFloat(this.props.data.amount).toFixed(
                  this.props.data.currency == 1000 ? 8 : 4,
                ),
              ),
            ),
          })}
        </Button>
      </Grid>
    );
  }

  disputeCountdownRenderer = ({ hours, minutes }) => {
    return (
      <span>
        {hours}h {zeroPad(minutes)}m{' '}
      </span>
    );
  };

  showOpenDisputeButton() {
    const { t } = this.props;
    const now = Date.now();
    const expires_at = new Date(this.props.data.expires_at);
    // open dispute button enables 12h before expiry
    expires_at.setHours(expires_at.getHours() - 12);
    return (
      <Tooltip
        placement='top'
        componentsProps={{
          tooltip: { sx: { position: 'relative', top: 42 } },
        }}
        disableHoverListener={now > expires_at}
        disableTouchListener={now > expires_at}
        enterTouchDelay={0}
        title={
          <Trans i18nKey='open_dispute'>
            To open a dispute you need to wait
            <Countdown date={expires_at} renderer={this.disputeCountdownRenderer} />
          </Trans>
        }
      >
        <Grid item xs={12} align='center'>
          <Button
            disabled={now < expires_at}
            color='inherit'
            onClick={this.handleClickOpenConfirmDispute}
          >
            {t('Open Dispute')}
          </Button>
        </Grid>
      </Tooltip>
    );
  }

  handleRenewOrderButtonPressed = () => {
    this.setState({ renewLoading: true });
    const body = {
      type: this.props.data.type,
      currency: this.props.data.currency,
      amount: this.props.data.has_range ? null : this.props.data.amount,
      has_range: this.props.data.has_range,
      min_amount: this.props.data.min_amount,
      max_amount: this.props.data.max_amount,
      payment_method: this.props.data.payment_method,
      is_explicit: this.props.data.is_explicit,
      premium: this.props.data.is_explicit ? null : this.props.data.premium,
      satoshis: this.props.data.is_explicit ? this.props.data.satoshis : null,
      public_duration: this.props.data.public_duration,
      escrow_duration: this.props.data.escrow_duration,
      bond_size: this.props.data.bond_size,
      bondless_taker: this.props.data.bondless_taker,
    };
    apiClient
      .post('/api/make/', body)
      .then(
        (data) =>
          this.setState({ badRequest: data.bad_request }) &
          (data.id
            ? this.props.push('/order/' + data.id) & this.props.getOrderDetails(data.id)
            : ''),
      );
  };

  showOrderExpired = () => {
    const { t } = this.props;
    const show_renew = this.props.data.is_maker;

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b>{t('The order has expired')}</b>
          </Typography>
        </Grid>

        <Grid item xs={12} align='center'>
          <Typography variant='body2'>{t(this.props.data.expiry_message)}</Typography>
        </Grid>
        {show_renew ? (
          <Grid item xs={12} align='center'>
            {this.state.renewLoading ? (
              <CircularProgress />
            ) : (
              <Button
                variant='contained'
                color='primary'
                onClick={this.handleRenewOrderButtonPressed}
              >
                {t('Renew Order')}
              </Button>
            )}
          </Grid>
        ) : null}
      </Grid>
    );
  };

  showChat = () => {
    const { t } = this.props;
    // In Chatroom - No fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton)
    if (this.props.data.is_buyer & (this.props.data.status == 9)) {
      var showSendButton = true;
      var showReveiceButton = false;
      var showDisputeButton = true;
    }
    if (this.props.data.is_seller & (this.props.data.status == 9)) {
      var showSendButton = false;
      var showReveiceButton = false;
      var showDisputeButton = true;
    }

    // In Chatroom - Fiat sent - showChat(showSendButton, showReveiceButton, showDisputeButton)
    if (this.props.data.is_buyer & (this.props.data.status == 10)) {
      var showSendButton = false;
      var showReveiceButton = false;
      var showDisputeButton = true;
    }
    if (this.props.data.is_seller & (this.props.data.status == 10)) {
      var showSendButton = false;
      var showReveiceButton = true;
      var showDisputeButton = true;
    }

    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for Chat Open. */}
        {this.Sound('locked-invoice')}
        <Grid item xs={12} align='center'>
          <Typography variant='subtitle1'>
            <b>
              {' '}
              {this.props.data.is_seller ? t('Chat with the buyer') : t('Chat with the seller')}
            </b>{' '}
            {' ' + this.stepXofY()}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          {this.props.data.is_seller ? (
            <Typography variant='body2' align='center'>
              {this.props.data.status == 9
                ? t(
                    'Say hi! Be helpful and concise. Let them know how to send you {{amount}} {{currencyCode}}.',
                    {
                      currencyCode: this.props.data.currencyCode,
                      amount: pn(
                        parseFloat(
                          parseFloat(this.props.data.amount).toFixed(
                            this.props.data.currency == 1000 ? 8 : 4,
                          ),
                        ),
                      ),
                    },
                  )
                : t("The buyer has sent the fiat. Click 'Confirm Received' once you receive it.")}
            </Typography>
          ) : (
            <Typography variant='body2' align='center'>
              {this.props.data.status == 9
                ? t(
                    "Say hi! Ask for payment details and click 'Confirm Sent' as soon as the payment is sent.",
                  )
                : t('Wait for the seller to confirm he has received the payment.')}
            </Typography>
          )}
        </Grid>

        <Chat orderId={this.props.data.id} ur_nick={this.props.data.ur_nick} />
        <Grid item xs={12} align='center'>
          {showDisputeButton ? this.showOpenDisputeButton() : ''}
          {showSendButton ? this.showFiatSentButton() : ''}
          {showReveiceButton ? this.showFiatReceivedButton() : ''}
        </Grid>
        {this.showBondIsLocked()}
      </Grid>
    );
  };

  showRateSelect() {
    const { t } = this.props;
    const show_renew = this.props.data.is_maker;

    return (
      <Grid container spacing={1}>
        {/* Make confirmation sound for Chat Open. */}
        {this.Sound('successful')}
        <Grid item xs={12} align='center'>
          <Typography component='h6' variant='h6'>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <BoltIcon sx={{ width: 25, height: 37 }} color='warning' />
              {t('Trade finished!')}
              <BoltIcon sx={{ width: 25, height: 37 }} color='warning' />
            </div>
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <Typography variant='body2' align='center'>
            <Trans i18nKey='rate_robosats'>
              What do you think of <b>RoboSats</b>?
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <Rating
            name='size-large'
            defaultValue={0}
            size='large'
            onChange={this.handleRatingRobosatsChange}
          />
        </Grid>
        {this.state.rating_platform == 5 ? (
          <Grid item xs={12} align='center'>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Typography variant='body2' align='center'>
                <b>{t('Thank you! RoboSats loves you too')}</b>{' '}
              </Typography>
              <FavoriteIcon color='error' />
            </div>
            <Typography variant='body2' align='center'>
              {t(
                'RoboSats gets better with more liquidity and users. Tell a bitcoiner friend about Robosats!',
              )}
            </Typography>
          </Grid>
        ) : null}
        {(this.state.rating_platform != 5) & (this.state.rating_platform != null) ? (
          <Grid item xs={12} align='center'>
            <Typography variant='body2' align='center'>
              <b>{t('Thank you for using Robosats!')}</b>
            </Typography>
            <Typography variant='body2' align='center'>
              <Trans i18nKey='let_us_know_hot_to_improve'>
                Let us know how the platform could improve (
                <Link target='_blank' href='https://t.me/robosats'>
                  Telegram
                </Link>{' '}
                /{' '}
                <Link target='_blank' href='https://github.com/Reckless-Satoshi/robosats/issues'>
                  Github
                </Link>
                )
              </Trans>
            </Typography>
          </Grid>
        ) : null}

        {/* SHOW TXID IF USER RECEIVES ONCHAIN */}
        {this.props.data.txid ? (
          <Grid item xs={12} align='left'>
            <Alert severity='success'>
              <AlertTitle>
                {t('Your TXID')}
                <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                  <IconButton
                    color='inherit'
                    onClick={() => {
                      copyToClipboard(this.props.data.txid);
                    }}
                  >
                    <ContentCopy sx={{ width: 16, height: 16 }} />
                  </IconButton>
                </Tooltip>
              </AlertTitle>
              <Typography
                variant='body2'
                align='center'
                sx={{ wordWrap: 'break-word', width: 220 }}
              >
                <Link
                  target='_blank'
                  href={
                    'http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/' +
                    (this.props.data.network == 'testnet' ? 'testnet/' : '') +
                    'tx/' +
                    this.props.data.txid
                  }
                >
                  {this.props.data.txid}
                </Link>
              </Typography>
            </Alert>
          </Grid>
        ) : null}

        <Grid item container spacing={3}>
          <Grid item xs={show_renew ? 6 : 12} align='center'>
            <Button
              color='primary'
              variant='outlined'
              onClick={() => {
                this.props.push('/');
              }}
            >
              <RocketLaunchIcon />
              {t('Start Again')}
            </Button>
          </Grid>

          {show_renew ? (
            <Grid item xs={6} align='center'>
              {this.state.renewLoading ? (
                <CircularProgress />
              ) : (
                <Button
                  color='primary'
                  variant='outlined'
                  onClick={this.handleRenewOrderButtonPressed}
                >
                  <RefreshIcon />
                  {t('Renew Order')}
                </Button>
              )}
            </Grid>
          ) : null}
        </Grid>

        <TradeSummary
          isMaker={this.props.data.is_maker}
          makerNick={this.props.data.maker_nick}
          takerNick={this.props.data.taker_nick}
          currencyCode={this.props.data.currencyCode}
          makerSummary={this.props.data.maker_summary}
          takerSummary={this.props.data.taker_summary}
          platformSummary={this.props.data.platform_summary}
          orderId={this.props.data.orderId}
        />
      </Grid>
    );
  }

  showSendingPayment() {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <Typography component='h6' variant='h6'>
            {t('Attempting Lightning Payment')}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          <Typography variant='body2' align='center'>
            {t(
              'RoboSats is trying to pay your lightning invoice. Remember that lightning nodes must be online in order to receive payments.',
            )}
          </Typography>
          <br />
          <Grid item xs={12} align='center'>
            <CircularProgress />
          </Grid>
        </Grid>
      </Grid>
    );
  }

  // Countdown Renderer callback with condition
  countdownRenderer = ({ minutes, seconds, completed }) => {
    const { t } = this.props;
    if (completed) {
      // Render a completed state
      return (
        <div align='center'>
          <span> {t('Retrying!')} </span>
          <br />
          <CircularProgress />
        </div>
      );
    } else {
      return (
        <span>
          {zeroPad(minutes)}m {zeroPad(seconds)}s{' '}
        </span>
      );
    }
  };

  failureReason = () => {
    const { t } = this.props;
    return (
      <Grid item xs={12} align='center'>
        <Typography variant='body2' align='center'>
          <b>{t('Failure reason:')}</b>
        </Typography>
        <Typography variant='body2' align='center'>
          {t(this.props.data.failure_reason)}
        </Typography>
      </Grid>
    );
  };

  showRoutingFailed = () => {
    const { t } = this.props;
    if (this.props.data.invoice_expired) {
      return (
        <Grid container spacing={1}>
          <Grid item xs={12} align='center'>
            <Typography component='h6' variant='h6'>
              {t('Lightning Routing Failed')}
            </Typography>
          </Grid>

          {this.props.data.failure_reason ? this.failureReason() : null}

          <Grid item xs={12} align='center'>
            <Typography variant='body2' align='center'>
              {t(
                'Your invoice has expired or more than 3 payment attempts have been made. Submit a new invoice.',
              )}
            </Typography>
          </Grid>

          <Grid item xs={12} align='center'>
            {this.compatibleWalletsButton()}
          </Grid>

          <Grid item xs={12} align='center'>
            <Typography color='primary' variant='subtitle1'>
              <b>
                {' '}
                {t('Submit an invoice for {{amountSats}} Sats', {
                  amountSats: pn(this.props.data.invoice_amount),
                })}
              </b>
            </Typography>
          </Grid>
          <Grid item xs={12} align='center'>
            <TextField
              error={this.state.badInvoice}
              helperText={this.state.badInvoice ? t(this.state.badInvoice) : ''}
              label={t('Payout Lightning Invoice')}
              required
              inputProps={{
                style: { textAlign: 'center' },
              }}
              multiline
              minRows={4}
              maxRows={8}
              onChange={this.handleInputInvoiceChanged}
            />
          </Grid>
          <Grid item xs={12} align='center'>
            <Button
              onClick={this.handleClickSubmitInvoiceButton}
              variant='contained'
              color='primary'
            >
              Submit
            </Button>
          </Grid>
          {this.showBondIsReturned()}
        </Grid>
      );
    } else {
      return (
        <Grid container spacing={1}>
          <Grid item xs={12} align='center'>
            <Typography component='h6' variant='h6'>
              {t('Lightning Routing Failed')}
            </Typography>
          </Grid>

          {this.props.data.failure_reason ? this.failureReason() : null}

          <Grid item xs={12} align='center'>
            <Typography variant='body2' align='center'>
              {t(
                'RoboSats will try to pay your invoice 3 times with a one minute pause in between. If it keeps failing, you will be able to submit a new invoice. Check whether you have enough inbound liquidity. Remember that lightning nodes must be online in order to receive payments.',
              )}
            </Typography>
            <List>
              <Divider />
              <ListItemText secondary={t('Next attempt in')}>
                <Countdown
                  date={new Date(this.props.data.next_retry_time)}
                  renderer={this.countdownRenderer}
                />
              </ListItemText>
            </List>
          </Grid>
          {this.showBondIsReturned()}
        </Grid>
      );
    }
  };

  render() {
    const { t } = this.props;
    return (
      <Grid container spacing={1} style={{ width: this.props.width }}>
        {this.ConfirmDisputeDialog()}
        {this.ConfirmFiatReceivedDialog()}
        <Grid item xs={12} align='center'>
          <MediaQuery minWidth={920}>
            <Typography component='h5' variant='h5'>
              {t('Contract Box')}
            </Typography>
          </MediaQuery>
          <Paper elevation={12} style={{ padding: 8 }}>
            {/* Maker and taker Bond request */}
            {this.props.data.is_maker & (this.props.data.status == 0) ? this.showQRInvoice() : ''}
            {this.props.data.is_taker & (this.props.data.status == 3) ? this.showQRInvoice() : ''}

            {/* Waiting for taker and taker bond request */}
            {this.props.data.is_maker & (this.props.data.status == 2) ? this.showPausedOrder() : ''}
            {this.props.data.is_maker & (this.props.data.status == 1) ? this.showMakerWait() : ''}
            {this.props.data.is_maker & (this.props.data.status == 3) ? this.showTakerFound() : ''}

            {/* Send Invoice (buyer) and deposit collateral (seller) */}
            {this.props.data.is_seller &
            (this.props.data.status == 6 || this.props.data.status == 7)
              ? this.showEscrowQRInvoice()
              : ''}
            {this.props.data.is_buyer & (this.props.data.status == 6 || this.props.data.status == 8)
              ? this.showInputInvoice()
              : ''}
            {this.props.data.is_buyer & (this.props.data.status == 7)
              ? this.showWaitingForEscrow()
              : ''}
            {this.props.data.is_seller & (this.props.data.status == 8)
              ? this.showWaitingForBuyerInvoice()
              : ''}

            {/* In Chatroom  */}
            {this.props.data.status == 9 || this.props.data.status == 10 ? this.showChat() : ''}

            {/* Trade Finished */}
            {this.props.data.is_seller & [13, 14, 15].includes(this.props.data.status)
              ? this.showRateSelect()
              : ''}
            {this.props.data.is_buyer & (this.props.data.status == 14) ? this.showRateSelect() : ''}

            {/* Trade Finished - Payment Routing Failed */}
            {this.props.data.is_buyer & (this.props.data.status == 13)
              ? this.showSendingPayment()
              : ''}

            {/* Trade Finished - Payment Routing Failed */}
            {this.props.data.is_buyer & (this.props.data.status == 15)
              ? this.showRoutingFailed()
              : ''}

            {/* Trade Finished - TODO Needs more planning */}
            {this.props.data.status == 11 ? this.showInDisputeStatement() : ''}
            {this.props.data.status == 16 ? this.showWaitForDisputeResolution() : ''}
            {(this.props.data.status == 17) & this.props.data.is_taker ||
            (this.props.data.status == 18) & this.props.data.is_maker
              ? this.showDisputeWinner()
              : ''}
            {(this.props.data.status == 18) & this.props.data.is_taker ||
            (this.props.data.status == 17) & this.props.data.is_maker
              ? this.showDisputeLoser()
              : ''}

            {/* Order has expired */}
            {this.props.data.status == 5 ? this.showOrderExpired() : ''}
            {/* TODO */}
            {/*  */}
            {/*  */}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(TradeBox);
