import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  TextField,
  Chip,
  Tooltip,
  IconButton,
  Badge,
  Tab,
  Tabs,
  Alert,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Box,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import Countdown, { zeroPad } from 'react-countdown';
import { StoreTokenDialog, NoRobotDialog } from './Dialogs';

import currencyDict from '../../static/assets/currencies.json';
import PaymentText from './PaymentText';
import TradeBox from './TradeBox';
import FlagWithProps from './FlagWithProps';
import LinearDeterminate from './LinearDeterminate';
import MediaQuery from 'react-responsive';
import { t } from 'i18next';

// icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NumbersIcon from '@mui/icons-material/Numbers';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArticleIcon from '@mui/icons-material/Article';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckIcon from '@mui/icons-material/Check';
import { SendReceiveIcon } from './Icons';

import { getCookie } from '../utils/cookies';
import { pn } from '../utils/prettyNumbers';
import { copyToClipboard } from '../utils/clipboard';
import { getWebln } from '../utils/webln';
import { apiClient } from '../services/api';

class OrderPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_explicit: false,
      delay: 60000, // Refresh every 60 seconds by default
      total_secs_exp: 300,
      loading: true,
      openCancel: false,
      openCollaborativeCancel: false,
      openInactiveMaker: false,
      openWeblnDialog: false,
      waitingWebln: false,
      openStoreToken: false,
      tabValue: 1,
      orderId: this.props.match.params.orderId,
    };

    // Refresh delays according to Order status
    this.statusToDelay = {
      0: 2000, // 'Waiting for maker bond'
      1: 25000, // 'Public'
      2: 90000, // 'Paused'
      3: 2000, // 'Waiting for taker bond'
      4: 999999, // 'Cancelled'
      5: 999999, // 'Expired'
      6: 6000, // 'Waiting for trade collateral and buyer invoice'
      7: 8000, // 'Waiting only for seller trade collateral'
      8: 8000, // 'Waiting only for buyer invoice'
      9: 10000, // 'Sending fiat - In chatroom'
      10: 10000, // 'Fiat sent - In chatroom'
      11: 30000, // 'In dispute'
      12: 999999, // 'Collaboratively cancelled'
      13: 3000, // 'Sending satoshis to buyer'
      14: 999999, // 'Sucessful trade'
      15: 10000, // 'Failed lightning network routing'
      16: 180000, // 'Wait for dispute resolution'
      17: 180000, // 'Maker lost dispute'
      18: 180000, // 'Taker lost dispute'
    };
  }

  completeSetState = (newStateVars) => {
    // In case the reply only has "bad_request"
    // Do not substitute these two for "undefined" as
    // otherStateVars will fail to assign values
    if (newStateVars.currency == null) {
      newStateVars.currency = this.state.currency;
      newStateVars.amount = this.state.amount;
      newStateVars.status = this.state.status;
    }

    const otherStateVars = {
      amount: newStateVars.amount ? newStateVars.amount : null,
      loading: false,
      delay: this.setDelay(newStateVars.status),
      currencyCode: this.getCurrencyCode(newStateVars.currency),
      penalty: newStateVars.penalty, // in case penalty time has finished, it goes back to null
      invoice_expired: newStateVars.invoice_expired, // in case invoice had expired, it goes back to null when it is valid again
    };

    const completeStateVars = Object.assign({}, newStateVars, otherStateVars);
    this.setState(completeStateVars);
  };

  getOrderDetails = (id) => {
    this.setState({ orderId: id });
    apiClient.get('/api/order/?order_id=' + id).then(this.orderDetailsReceived);
  };

  orderDetailsReceived = (data) => {
    if (data.status !== this.state.status) {
      this.handleWebln(data);
    }
    this.completeSetState(data);
    this.setState({ pauseLoading: false });
  };

  // These are used to refresh the data
  componentDidMount() {
    this.getOrderDetails(this.props.match.params.orderId);
    this.interval = setInterval(this.tick, this.state.delay);
  }

  componentDidUpdate() {
    clearInterval(this.interval);
    this.interval = setInterval(this.tick, this.state.delay);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick = () => {
    this.getOrderDetails(this.state.orderId);
  };

  handleWebln = async (data) => {
    const webln = await getWebln();
    // If Webln implements locked payments compatibility, this logic might be simplier
    if (data.is_maker & (data.status == 0)) {
      webln.sendPayment(data.bond_invoice);
      this.setState({ waitingWebln: true, openWeblnDialog: true });
    } else if (data.is_taker & (data.status == 3)) {
      webln.sendPayment(data.bond_invoice);
      this.setState({ waitingWebln: true, openWeblnDialog: true });
    } else if (data.is_seller & (data.status == 6 || data.status == 7)) {
      webln.sendPayment(data.escrow_invoice);
      this.setState({ waitingWebln: true, openWeblnDialog: true });
    } else if (data.is_buyer & (data.status == 6 || data.status == 8)) {
      this.setState({ waitingWebln: true, openWeblnDialog: true });
      webln
        .makeInvoice(data.trade_satoshis)
        .then((invoice) => {
          if (invoice) {
            this.sendWeblnInvoice(invoice.paymentRequest);
            this.setState({ waitingWebln: false, openWeblnDialog: false });
          }
        })
        .catch(() => {
          this.setState({ waitingWebln: false, openWeblnDialog: false });
        });
    } else {
      this.setState({ waitingWebln: false });
    }
  };

  sendWeblnInvoice = (invoice) => {
    apiClient
      .post('/api/order/?order_id=' + this.state.orderId, {
        action: 'update_invoice',
        invoice,
      })
      .then((data) => this.completeSetState(data));
  };

  // Countdown Renderer callback with condition
  countdownRenderer = ({ total, hours, minutes, seconds, completed }) => {
    const { t } = this.props;
    if (completed) {
      // Render a completed state
      return <span> {t('The order has expired')}</span>;
    } else {
      let col = 'inherit';
      const fraction_left = total / 1000 / this.state.total_secs_exp;
      // Make orange at 25% of time left
      if (fraction_left < 0.25) {
        col = 'orange';
      }
      // Make red at 10% of time left
      if (fraction_left < 0.1) {
        col = 'red';
      }
      // Render a countdown, bold when less than 25%
      return fraction_left < 0.25 ? (
        <b>
          <span style={{ color: col }}>
            {hours}h {zeroPad(minutes)}m {zeroPad(seconds)}s{' '}
          </span>
        </b>
      ) : (
        <span style={{ color: col }}>
          {hours}h {zeroPad(minutes)}m {zeroPad(seconds)}s{' '}
        </span>
      );
    }
  };

  timerRenderer(seconds) {
    const hours = parseInt(seconds / 3600);
    const minutes = parseInt((seconds - hours * 3600) / 60);
    return (
      <span>
        {hours > 0 ? hours + 'h' : ''} {minutes > 0 ? zeroPad(minutes) + 'm' : ''}{' '}
      </span>
    );
  }

  // Countdown Renderer callback with condition
  countdownPenaltyRenderer = ({ minutes, seconds, completed }) => {
    const { t } = this.props;
    if (completed) {
      // Render a completed state
      return <span> {t('Penalty lifted, good to go!')}</span>;
    } else {
      return (
        <span>
          {' '}
          {t('You cannot take an order yet! Wait {{timeMin}}m {{timeSec}}s', {
            timeMin: zeroPad(minutes),
            timeSec: zeroPad(seconds),
          })}{' '}
        </span>
      );
    }
  };

  handleTakeAmountChange = (e) => {
    if ((e.target.value != '') & (e.target.value != null)) {
      this.setState({ takeAmount: parseFloat(e.target.value) });
    } else {
      this.setState({ takeAmount: e.target.value });
    }
  };

  amountHelperText = () => {
    const { t } = this.props;
    if ((this.state.takeAmount < this.state.min_amount) & (this.state.takeAmount != '')) {
      return t('Too low');
    } else if ((this.state.takeAmount > this.state.max_amount) & (this.state.takeAmount != '')) {
      return t('Too high');
    } else {
      return null;
    }
  };

  takeOrderButton = () => {
    const { t } = this.props;
    if (this.state.has_range) {
      return (
        <Grid
          container
          align='center'
          alignItems='stretch'
          justifyContent='center'
          style={{ display: 'flex' }}
        >
          {this.InactiveMakerDialog()}
          {this.tokenDialog()}
          <div style={{ maxWidth: 120 }}>
            <Tooltip
              placement='top'
              enterTouchDelay={500}
              enterDelay={700}
              enterNextDelay={2000}
              title={t('Enter amount of fiat to exchange for bitcoin')}
            >
              <Paper elevation={5} sx={{ maxHeight: 40 }}>
                <TextField
                  error={
                    (this.state.takeAmount < this.state.min_amount ||
                      this.state.takeAmount > this.state.max_amount) &
                    (this.state.takeAmount != '')
                  }
                  helperText={this.amountHelperText()}
                  label={t('Amount {{currencyCode}}', { currencyCode: this.state.currencyCode })}
                  size='small'
                  type='number'
                  required={true}
                  value={this.state.takeAmount}
                  inputProps={{
                    min: this.state.min_amount,
                    max: this.state.max_amount,
                    style: { textAlign: 'center' },
                  }}
                  onChange={this.handleTakeAmountChange}
                />
              </Paper>
            </Tooltip>
          </div>
          <div
            style={{
              height: 38,
              top: '1px',
              position: 'relative',
              display:
                this.state.takeAmount < this.state.min_amount ||
                this.state.takeAmount > this.state.max_amount ||
                this.state.takeAmount == '' ||
                this.state.takeAmount == null
                  ? ''
                  : 'none',
            }}
          >
            <Tooltip
              placement='top'
              enterTouchDelay={0}
              enterDelay={500}
              enterNextDelay={1200}
              title={t('You must specify an amount first')}
            >
              <Paper elevation={4}>
                <Button sx={{ height: 38 }} variant='contained' color='primary' disabled={true}>
                  {t('Take Order')}
                </Button>
              </Paper>
            </Tooltip>
          </div>
          <div
            style={{
              height: 38,
              top: '1px',
              position: 'relative',
              display:
                this.state.takeAmount < this.state.min_amount ||
                this.state.takeAmount > this.state.max_amount ||
                this.state.takeAmount == '' ||
                this.state.takeAmount == null
                  ? 'none'
                  : '',
            }}
          >
            <Paper elevation={4}>
              <Button
                sx={{ height: 38 }}
                variant='contained'
                color='primary'
                onClick={
                  this.props.copiedToken
                    ? this.state.maker_status == 'Inactive'
                      ? this.handleClickOpenInactiveMakerDialog
                      : this.takeOrder
                    : () => this.setState({ openStoreToken: true })
                }
              >
                {t('Take Order')}
              </Button>
            </Paper>
          </div>
        </Grid>
      );
    } else {
      return (
        <>
          {this.InactiveMakerDialog()}
          {this.tokenDialog()}
          <Button
            sx={{ height: 38 }}
            variant='contained'
            color='primary'
            onClick={
              this.props.copiedToken
                ? this.state.maker_status == 'Inactive'
                  ? this.handleClickOpenInactiveMakerDialog
                  : this.takeOrder
                : () => this.setState({ openStoreToken: true })
            }
          >
            {t('Take Order')}
          </Button>
        </>
      );
    }
  };

  countdownTakeOrderRenderer = ({ seconds, completed }) => {
    if (isNaN(seconds)) {
      return this.takeOrderButton();
    }
    if (completed) {
      // Render a completed state
      return this.takeOrderButton();
    } else {
      return (
        <Tooltip enterTouchDelay={0} title={t('Wait until you can take an order')}>
          <div>
            <Button disabled={true} variant='contained' color='primary'>
              {t('Take Order')}
            </Button>
          </div>
        </Tooltip>
      );
    }
  };

  takeOrder = () => {
    this.setState({ loading: true });
    apiClient
      .post('/api/order/?order_id=' + this.state.orderId, {
        action: 'take',
        amount: this.state.takeAmount,
      })
      .then((data) => this.handleWebln(data) & this.completeSetState(data));
  };

  // set delay to the one matching the order status. If null order status, delay goes to 9999999.
  setDelay = (status) => {
    return status >= 0 ? this.statusToDelay[status.toString()] : 99999999;
  };

  getCurrencyCode(val) {
    const code = val ? currencyDict[val.toString()] : '';
    return code;
  }

  handleClickConfirmCancelButton = () => {
    this.setState({ loading: true });
    apiClient
      .post('/api/order/?order_id=' + this.state.orderId, {
        action: 'cancel',
      })
      .then(() => this.getOrderDetails(this.state.orderId) & this.setState({ status: 4 }));
    this.handleClickCloseConfirmCancelDialog();
  };

  handleClickOpenConfirmCancelDialog = () => {
    this.setState({ openCancel: true });
  };

  handleClickCloseConfirmCancelDialog = () => {
    this.setState({ openCancel: false });
  };

  CancelDialog = () => {
    const { t } = this.props;
    return (
      <Dialog
        open={this.state.openCancel}
        onClose={this.handleClickCloseConfirmCancelDialog}
        aria-labelledby='cancel-dialog-title'
        aria-describedby='cancel-dialog-description'
      >
        <DialogTitle id='cancel-dialog-title'>{t('Cancel the order?')}</DialogTitle>
        <DialogContent>
          <DialogContentText id='cancel-dialog-description'>
            {t('If the order is cancelled now you will lose your bond.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseConfirmCancelDialog} autoFocus>
            {t('Go back')}
          </Button>
          <Button onClick={this.handleClickConfirmCancelButton}>{t('Confirm Cancel')}</Button>
        </DialogActions>
      </Dialog>
    );
  };

  handleClickOpenInactiveMakerDialog = () => {
    this.setState({ openInactiveMaker: true });
  };

  handleClickCloseInactiveMakerDialog = () => {
    this.setState({ openInactiveMaker: false });
  };

  InactiveMakerDialog = () => {
    const { t } = this.props;
    return (
      <Dialog
        open={this.state.openInactiveMaker}
        onClose={this.handleClickCloseInactiveMakerDialog}
        aria-labelledby='inactive-maker-dialog-title'
        aria-describedby='inactive-maker-description'
      >
        <DialogTitle id='inactive-maker-dialog-title'>{t('The maker is away')}</DialogTitle>
        <DialogContent>
          <DialogContentText id='cancel-dialog-description'>
            {t(
              'By taking this order you risk wasting your time. If the maker does not proceed in time, you will be compensated in satoshis for 50% of the maker bond.',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseInactiveMakerDialog} autoFocus>
            {t('Go back')}
          </Button>
          <Button onClick={this.takeOrder}>{t('Take Order')}</Button>
        </DialogActions>
      </Dialog>
    );
  };

  tokenDialog = () => {
    return getCookie('robot_token') ? (
      <StoreTokenDialog
        open={this.state.openStoreToken}
        onClose={() => this.setState({ openStoreToken: false })}
        onClickCopy={() =>
          copyToClipboard(getCookie('robot_token')) & this.props.setAppState({ copiedToken: true })
        }
        copyIconColor={this.props.copiedToken ? 'inherit' : 'primary'}
        onClickBack={() => this.setState({ openStoreToken: false })}
        onClickDone={() =>
          this.setState({ openStoreToken: false }) &
          (this.state.maker_status == 'Inactive'
            ? this.handleClickOpenInactiveMakerDialog()
            : this.takeOrder())
        }
      />
    ) : (
      <NoRobotDialog
        open={this.state.openStoreToken}
        onClose={() => this.setState({ openStoreToken: false })}
      />
    );
  };

  handleClickConfirmCollaborativeCancelButton = () => {
    apiClient
      .post('/api/order/?order_id=' + this.state.orderId, {
        action: 'cancel',
      })
      .then(() => this.getOrderDetails(this.state.orderId) & this.setState({ status: 4 }));
    this.handleClickCloseCollaborativeCancelDialog();
  };

  handleClickOpenCollaborativeCancelDialog = () => {
    this.setState({ openCollaborativeCancel: true });
  };

  handleClickCloseCollaborativeCancelDialog = () => {
    this.setState({ openCollaborativeCancel: false });
  };

  CollaborativeCancelDialog = () => {
    const { t } = this.props;
    return (
      <Dialog
        open={this.state.openCollaborativeCancel}
        onClose={this.handleClickCloseCollaborativeCancelDialog}
        aria-labelledby='collaborative-cancel-dialog-title'
        aria-describedby='collaborative-cancel-dialog-description'
      >
        <DialogTitle id='cancel-dialog-title'>{t('Collaborative cancel the order?')}</DialogTitle>
        <DialogContent>
          <DialogContentText id='cancel-dialog-description'>
            {t(
              'The trade escrow has been posted. The order can be cancelled only if both, maker and taker, agree to cancel.',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClickCloseCollaborativeCancelDialog} autoFocus>
            {t('Go back')}
          </Button>
          <Button onClick={this.handleClickConfirmCollaborativeCancelButton}>
            {t('Ask for Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  BackButton = () => {
    const { t } = this.props;
    // If order has expired, show back button.
    if (this.state.status == 5) {
      return (
        <Grid item xs={12} align='center'>
          <Button variant='contained' color='secondary' onClick={this.props.history.goBack}>
            {t('Back')}
          </Button>
        </Grid>
      );
    }
    return null;
  };

  CancelButton = () => {
    const { t } = this.props;
    // If maker and Waiting for Bond. Or if taker and Waiting for bond.
    // Simply allow to cancel without showing the cancel dialog.
    if (
      this.state.is_maker & [0, 1, 2].includes(this.state.status) ||
      this.state.is_taker & (this.state.status == 3)
    ) {
      return (
        <Grid item xs={12} align='center'>
          <Button
            variant='contained'
            color='secondary'
            onClick={this.handleClickConfirmCancelButton}
          >
            {t('Cancel')}
          </Button>
        </Grid>
      );
    }
    // If the order does not yet have an escrow deposited. Show dialog
    // to confirm forfeiting the bond
    if ([3, 6, 7].includes(this.state.status)) {
      return (
        <div id='openDialogCancelButton'>
          <Grid item xs={12} align='center'>
            {this.CancelDialog()}
            <Button
              variant='contained'
              color='secondary'
              onClick={this.handleClickOpenConfirmCancelDialog}
            >
              {t('Cancel')}
            </Button>
          </Grid>
        </div>
      );
    }

    // If the escrow is Locked, show the collaborative cancel button.

    if ([8, 9].includes(this.state.status)) {
      return (
        <Grid item xs={12} align='center'>
          {this.CollaborativeCancelDialog()}
          <Button
            variant='contained'
            color='secondary'
            onClick={this.handleClickOpenCollaborativeCancelDialog}
          >
            {t('Collaborative Cancel')}
          </Button>
        </Grid>
      );
    }

    // If none of the above do not return a cancel button.
    return null;
  };

  // Colors for the status badges
  statusBadgeColor(status) {
    if (status == 'Active') {
      return 'success';
    }
    if (status == 'Seen recently') {
      return 'warning';
    }
    if (status == 'Inactive') {
      return 'error';
    }
  }

  orderBox = () => {
    const { t } = this.props;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align='center'>
          <MediaQuery minWidth={920}>
            <Typography component='h5' variant='h5'>
              {t('Order Box')}
            </Typography>
          </MediaQuery>
          <Paper elevation={12}>
            <List dense={true}>
              <ListItem>
                <ListItemAvatar sx={{ width: 56, height: 56 }}>
                  <Tooltip placement='top' enterTouchDelay={0} title={t(this.state.maker_status)}>
                    <Badge
                      variant='dot'
                      overlap='circular'
                      badgeContent=''
                      color={this.statusBadgeColor(this.state.maker_status)}
                    >
                      <Badge
                        overlap='circular'
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        badgeContent={
                          <div style={{ position: 'relative', left: '5px', top: '2px' }}>
                            {' '}
                            {!this.state.type ? (
                              <SendReceiveIcon
                                sx={{ transform: 'scaleX(-1)', height: '18px', width: '18px' }}
                                color='secondary'
                              />
                            ) : (
                              <SendReceiveIcon
                                sx={{ height: '18px', width: '18px' }}
                                color='primary'
                              />
                            )}
                          </div>
                        }
                      >
                        <Avatar
                          className='flippedSmallAvatar'
                          alt={this.state.maker_nick}
                          src={
                            window.location.origin +
                            '/static/assets/avatars/' +
                            this.state.maker_nick +
                            '.png'
                          }
                        />
                      </Badge>
                    </Badge>
                  </Tooltip>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    this.state.maker_nick +
                    (this.state.type ? ' ' + t('(Seller)') : ' ' + t('(Buyer)'))
                  }
                  secondary={t('Order maker')}
                  align='right'
                />
              </ListItem>

              {this.state.is_participant ? (
                <>
                  {this.state.taker_nick != 'None' ? (
                    <>
                      <Divider />
                      <ListItem align='left'>
                        <ListItemText
                          primary={
                            this.state.taker_nick +
                            (this.state.type ? ' ' + t('(Buyer)') : ' ' + t('(Seller)'))
                          }
                          secondary={t('Order taker')}
                        />
                        <ListItemAvatar>
                          <Tooltip enterTouchDelay={0} title={t(this.state.taker_status)}>
                            <Badge
                              variant='dot'
                              overlap='circular'
                              badgeContent=''
                              color={this.statusBadgeColor(this.state.taker_status)}
                            >
                              <Badge
                                overlap='circular'
                                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                                badgeContent={
                                  <div style={{ position: 'relative', right: '5px', top: '2px' }}>
                                    {' '}
                                    {this.state.type ? (
                                      <SendReceiveIcon
                                        sx={{ height: '18px', width: '18px' }}
                                        color='secondary'
                                      />
                                    ) : (
                                      <SendReceiveIcon
                                        sx={{
                                          transform: 'scaleX(-1)',
                                          height: '18px',
                                          width: '18px',
                                        }}
                                        color='primary'
                                      />
                                    )}
                                  </div>
                                }
                              >
                                <Avatar
                                  className='smallAvatar'
                                  alt={this.state.taker_nick}
                                  src={
                                    window.location.origin +
                                    '/static/assets/avatars/' +
                                    this.state.taker_nick +
                                    '.png'
                                  }
                                />
                              </Badge>
                            </Badge>
                          </Tooltip>
                        </ListItemAvatar>
                      </ListItem>
                    </>
                  ) : (
                    ''
                  )}
                  <Divider>
                    <Chip label={t('Order Details')} />
                  </Divider>
                  <ListItem>
                    <ListItemIcon>
                      <ArticleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={t(this.state.status_message)}
                      secondary={t('Order status')}
                    />
                  </ListItem>
                  <Divider />
                </>
              ) : (
                <Divider>
                  <Chip label={t('Order Details')} />
                </Divider>
              )}

              <ListItem>
                <ListItemIcon>
                  <div
                    style={{
                      zoom: 1.25,
                      opacity: 0.7,
                      msZoom: 1.25,
                      WebkitZoom: 1.25,
                      MozTransform: 'scale(1.25,1.25)',
                      MozTransformOrigin: 'left center',
                    }}
                  >
                    <FlagWithProps code={this.state.currencyCode} />
                  </div>
                </ListItemIcon>
                {this.state.has_range & (this.state.amount == null) ? (
                  <ListItemText
                    primary={
                      pn(parseFloat(Number(this.state.min_amount).toPrecision(4))) +
                      '-' +
                      pn(parseFloat(Number(this.state.max_amount).toPrecision(4))) +
                      ' ' +
                      this.state.currencyCode
                    }
                    secondary={t('Amount range')}
                  />
                ) : (
                  <ListItemText
                    primary={
                      pn(
                        parseFloat(
                          parseFloat(this.state.amount).toFixed(
                            this.state.currency == 1000 ? 8 : 4,
                          ),
                        ),
                      ) +
                      ' ' +
                      this.state.currencyCode
                    }
                    secondary={t('Amount')}
                  />
                )}
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemIcon>
                  <PaymentsIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <PaymentText
                      size={20}
                      othersText={t('Others')}
                      verbose={true}
                      text={this.state.payment_method}
                    />
                  }
                  secondary={
                    this.state.currency == 1000
                      ? t('Swap destination')
                      : t('Accepted payment methods')
                  }
                />
              </ListItem>
              <Divider />

              {/* If there is live Price and Premium data, show it. Otherwise show the order maker settings */}
              <ListItem>
                <ListItemIcon>
                  <PriceChangeIcon />
                </ListItemIcon>
                {this.state.price_now ? (
                  <ListItemText
                    primary={t('{{price}} {{currencyCode}}/BTC - Premium: {{premium}}%', {
                      price: pn(this.state.price_now),
                      currencyCode: this.state.currencyCode,
                      premium: this.state.premium_now,
                    })}
                    secondary={t('Price and Premium')}
                  />
                ) : this.state.is_explicit ? (
                  <ListItemText
                    primary={pn(this.state.satoshis)}
                    secondary={t('Amount of Satoshis')}
                  />
                ) : (
                  <ListItemText
                    primary={parseFloat(parseFloat(this.state.premium).toFixed(2)) + '%'}
                    secondary={t('Premium over market price')}
                  />
                )}
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemIcon>
                  <NumbersIcon />
                </ListItemIcon>
                <Grid container>
                  <Grid item xs={4.5}>
                    <ListItemText primary={this.state.orderId} secondary={t('Order ID')} />
                  </Grid>
                  <Grid item xs={7.5}>
                    <Grid container>
                      <Grid item xs={2}>
                        <ListItemIcon sx={{ position: 'relative', top: '12px', left: '-5px' }}>
                          <HourglassTopIcon />
                        </ListItemIcon>
                      </Grid>
                      <Grid item xs={10}>
                        <ListItemText
                          primary={this.timerRenderer(this.state.escrow_duration)}
                          secondary={t('Deposit timer')}
                        ></ListItemText>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </ListItem>

              {/* if order is in a status that does not expire, do not show countdown */}
              {[4, 12, 13, 14, 15, 16, 17, 18].includes(this.state.status) ? null : (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText secondary={t('Expires in')}>
                      <Countdown
                        date={new Date(this.state.expires_at)}
                        renderer={this.countdownRenderer}
                      />
                    </ListItemText>
                  </ListItem>
                  <LinearDeterminate
                    key={this.state.total_secs_exp}
                    totalSecsExp={this.state.total_secs_exp}
                    expiresAt={this.state.expires_at}
                  />
                </>
              )}
            </List>

            {/* If the user has a penalty/limit */}
            {this.state.penalty ? (
              <>
                <Divider />
                <Grid item xs={12} align='center'>
                  <Alert severity='warning' sx={{ maxWidth: 360 }}>
                    <Countdown
                      date={new Date(this.state.penalty)}
                      renderer={this.countdownPenaltyRenderer}
                    />
                  </Alert>
                </Grid>
              </>
            ) : null}

            {/* If the counterparty asked for collaborative cancel */}
            {this.state.pending_cancel ? (
              <>
                <Divider />
                <Grid item xs={12} align='center'>
                  <Alert severity='warning' sx={{ maxWidth: 360 }}>
                    {t('{{nickname}} is asking for a collaborative cancel', {
                      nickname: this.state.is_maker ? this.state.taker_nick : this.state.maker_nick,
                    })}
                  </Alert>
                </Grid>
              </>
            ) : null}

            {/* If the user has asked for a collaborative cancel */}
            {this.state.asked_for_cancel ? (
              <>
                <Divider />
                <Grid item xs={12} align='center'>
                  <Alert severity='warning' sx={{ maxWidth: 360 }}>
                    {t('You asked for a collaborative cancellation')}
                  </Alert>
                </Grid>
              </>
            ) : null}
          </Paper>
        </Grid>

        <Grid item xs={12} align='center'>
          {/* Participants can see the "Cancel" Button, but cannot see the "Back" or "Take Order" buttons */}
          {this.state.is_participant ? (
            <>
              {this.CancelButton()}
              {this.BackButton()}
            </>
          ) : (
            <Grid container spacing={1}>
              <Grid item xs={12} align='center'>
                <Countdown
                  date={new Date(this.state.penalty)}
                  renderer={this.countdownTakeOrderRenderer}
                />
              </Grid>
              <Grid item xs={12} align='center'>
                <Button variant='contained' color='secondary' onClick={this.props.history.goBack}>
                  {t('Back')}
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    );
  };

  doubleOrderPageDesktop = () => {
    return (
      <Grid container align='center' spacing={2}>
        <Grid item xs={6} align='left' style={{ width: 330 }}>
          {this.orderBox()}
        </Grid>
        <Grid item xs={6} align='left'>
          <TradeBox
            theme={this.props.theme}
            push={this.props.history.push}
            getOrderDetails={this.getOrderDetails}
            pauseLoading={this.state.pauseLoading}
            width={330}
            data={this.state}
            completeSetState={this.completeSetState}
          />
        </Grid>
      </Grid>
    );
  };

  a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  doubleOrderPagePhone = () => {
    const { t } = this.props;

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={this.state.tabValue} variant='fullWidth'>
            <Tab
              label={t('Order')}
              {...this.a11yProps(0)}
              onClick={() => this.setState({ tabValue: 0 })}
            />
            <Tab
              label={t('Contract')}
              {...this.a11yProps(1)}
              onClick={() => this.setState({ tabValue: 1 })}
            />
          </Tabs>
        </Box>
        <Grid container spacing={2}>
          <Grid item>
            <div style={{ width: 330, display: this.state.tabValue == 0 ? '' : 'none' }}>
              {this.orderBox()}
            </div>
            <div style={{ display: this.state.tabValue == 1 ? '' : 'none' }}>
              <TradeBox
                theme={this.props.theme}
                push={this.props.history.push}
                getOrderDetails={this.getOrderDetails}
                pauseLoading={this.state.pauseLoading}
                width={330}
                data={this.state}
                completeSetState={this.completeSetState}
              />
            </div>
          </Grid>
        </Grid>
      </Box>
    );
  };

  orderDetailsPage() {
    const { t } = this.props;
    return this.state.bad_request ? (
      <div align='center'>
        <Typography variant='subtitle2' color='secondary'>
          {/* IMPLEMENT I18N for bad_request */}
          {t(this.state.bad_request)}
          <br />
        </Typography>
        <Button variant='contained' color='secondary' onClick={this.props.history.goBack}>
          {t('Back')}
        </Button>
      </div>
    ) : this.state.is_participant ? (
      <>
        {this.weblnDialog()}
        {/* Desktop View */}
        <MediaQuery minWidth={920}>{this.doubleOrderPageDesktop()}</MediaQuery>

        {/* SmarPhone View */}
        <MediaQuery maxWidth={919}>{this.doubleOrderPagePhone()}</MediaQuery>
      </>
    ) : (
      <Grid item xs={12} align='center' style={{ width: 330 }}>
        {this.orderBox()}
      </Grid>
    );
  }

  handleCloseWeblnDialog = () => {
    this.setState({ openWeblnDialog: false });
  };

  weblnDialog = () => {
    const { t } = this.props;

    return (
      <Dialog
        open={this.state.openWeblnDialog}
        onClose={this.handleCloseWeblnDialog}
        aria-labelledby='webln-dialog-title'
        aria-describedby='webln-dialog-description'
      >
        <DialogTitle id='webln-dialog-title'>{t('WebLN')}</DialogTitle>
        <DialogContent>
          <DialogContentText id='webln-dialog-description'>
            {this.state.waitingWebln ? (
              <>
                <CircularProgress size={16} thickness={5} style={{ marginRight: 10 }} />
                {this.state.is_buyer
                  ? t('Invoice not received, please check your WebLN wallet.')
                  : t('Payment not received, please check your WebLN wallet.')}
              </>
            ) : (
              <>
                <CheckIcon color='success' />
                {t('You can close now your WebLN wallet popup.')}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleCloseWeblnDialog} autoFocus>
            {t('Done')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  render() {
    return (
      // Only so nothing shows while requesting the first batch of data
      this.state.loading ? <CircularProgress /> : this.orderDetailsPage()
    );
  }
}

export default withTranslation()(OrderPage);
