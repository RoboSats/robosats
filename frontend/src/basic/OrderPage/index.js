import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
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
  Fade,
  Collapse,
} from '@mui/material';

import currencyDict from '../../../static/assets/currencies.json';
import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import MediaQuery from 'react-responsive';

import { Check } from '@mui/icons-material';
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
          <OrderDetails
            order={this.state}
            setOrder={this.completeSetState}
            baseUrl={this.props.baseUrl}
            setPage={this.props.setPage}
            hasRobot={this.props.hasRobot}
            handleWebln={this.handleWebln}
          />
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
          <OrderDetails
            order={this.state}
            setOrder={this.completeSetState}
            baseUrl={this.props.baseUrl}
            setPage={this.props.setPage}
            hasRobot={this.props.hasRobot}
            handleWebln={this.handleWebln}
          />
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

  handleCloseWeblnDialog = () => {
    this.setState({ openWeblnDialog: false });
  };

  weblnDialog = () => {
    const { t } = this.props;

    return (
      <Dialog open={this.state.openWeblnDialog} onClose={this.handleCloseWeblnDialog}>
        <DialogTitle>{t('WebLN')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {this.state.waitingWebln ? (
              <>
                <CircularProgress size={16} thickness={5} style={{ marginRight: 10 }} />
                {this.state.is_buyer
                  ? t('Invoice not received, please check your WebLN wallet.')
                  : t('Payment not received, please check your WebLN wallet.')}
              </>
            ) : (
              <>
                <Check color='success' />
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
    const { t } = this.props;
    return (
      <Box>
        <Fade in={this.state.loading}>
          <CircularProgress />
        </Fade>
        <Fade in={!this.state.loading && this.state.bad_request != undefined}>
          <Typography align='center' variant='subtitle2' color='secondary'>
            {t(this.state.bad_request)}
          </Typography>
        </Fade>
        {!this.state.loading && this.state.bad_request == undefined ? (
          <>
            <Collapse in={this.state.is_participant}>
              {this.weblnDialog()}
              <MediaQuery minWidth={920}>{this.doubleOrderPageDesktop()}</MediaQuery>
              <MediaQuery maxWidth={919}>{this.doubleOrderPagePhone()}</MediaQuery>
            </Collapse>
            <Collapse in={!this.state.is_participant}>
              <OrderDetails
                order={this.state}
                setOrder={this.completeSetState}
                baseUrl={this.props.baseUrl}
                setPage={this.props.setPage}
                hasRobot={this.props.hasRobot}
                handleWebln={this.handleWebln}
              />
            </Collapse>
          </>
        ) : (
          <></>
        )}
      </Box>
    );
  }
}

export default withTranslation()(OrderPage);
