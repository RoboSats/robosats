import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  TextField,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { zeroPad } from 'react-countdown';

import { StoreTokenDialog, NoRobotDialog } from '../../components/Dialogs';

import currencyDict from '../../../static/assets/currencies.json';
import TradeBox from '../../components/TradeBox';

import MediaQuery from 'react-responsive';
import { t } from 'i18next';

import { getWebln } from '../../utils';
import { systemClient } from '../../services/System';
import { apiClient } from '../../services/api';

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
      currency: 0,
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
    apiClient.get(this.props.baseUrl, '/api/order/?order_id=' + id).then(this.orderDetailsReceived);
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
      .post(this.props.baseUrl, '/api/order/?order_id=' + this.state.orderId, {
        action: 'update_invoice',
        invoice,
      })
      .then((data) => this.completeSetState(data));
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
      .post(this.props.baseUrl, '/api/order/?order_id=' + this.state.orderId, {
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
    return systemClient.getItem('robot_token') ? (
      <StoreTokenDialog
        open={this.state.openStoreToken}
        onClose={() => this.setState({ openStoreToken: false })}
        onClickCopy={() => systemClient.copyToClipboard(systemClient.getItem('robot_token'))}
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
        setPage={this.props.setPage}
      />
    );
  };

  handleClickConfirmCollaborativeCancelButton = () => {
    apiClient
      .post(this.props.baseUrl, '/api/order/?order_id=' + this.state.orderId, {
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

  doubleOrderPageDesktop = () => {
    return (
      <Grid
        container
        xs={12}
        direction='row'
        justifyContent='center'
        alignItems='flex-start'
        spacing={2}
      >
        <Grid item xs={6}>
          {this.orderBox()}
        </Grid>
        <Grid item xs={6}>
          <Paper elevation={12} style={{ width: '21em' }}>
            <TradeBox
              order={this.state}
              setOrder={this.completeSetState}
              baseUrl={this.props.baseUrl}
            />
          </Paper>
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

        <div style={{ width: '21em', display: this.state.tabValue == 0 ? '' : 'none' }}>
          {this.orderBox()}
        </div>
        <div style={{ display: this.state.tabValue == 1 ? '' : 'none' }}>
          <Paper elevation={12} style={{ width: '21em' }}>
            <TradeBox
              order={this.state}
              setOrder={this.completeSetState}
              baseUrl={this.props.baseUrl}
            />
          </Paper>
        </div>
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
      <Grid item xs={12} style={{ width: 330 }}>
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
