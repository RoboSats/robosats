import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
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

import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import { Check } from '@mui/icons-material';
import { getWebln } from '../../utils';
import { apiClient } from '../../services/api';

import { Page } from '../NavBar';
import { Order } from '../../models';

// Refresh delays (ms) according to Order status
const statusToDelay = [
  3000, // 'Waiting for maker bond'
  35000, // 'Public'
  180000, // 'Paused'
  3000, // 'Waiting for taker bond'
  999999, // 'Cancelled'
  999999, // 'Expired'
  8000, // 'Waiting for trade collateral and buyer invoice'
  8000, // 'Waiting only for seller trade collateral'
  8000, // 'Waiting only for buyer invoice'
  10000, // 'Sending fiat - In chatroom'
  10000, // 'Fiat sent - In chatroom'
  100000, // 'In dispute'
  999999, // 'Collaboratively cancelled'
  10000, // 'Sending satoshis to buyer'
  999999, // 'Sucessful trade'
  30000, // 'Failed lightning network routing'
  300000, // 'Wait for dispute resolution'
  300000, // 'Maker lost dispute'
  300000, // 'Taker lost dispute'
];

interface OrderPageProps {
  windowSize: { width: number; height: number };
  hasRobot: boolean;
  setPage: (state: Page) => void;
  baseUrl: string;
  currentOrder: number | undefined;
  locationOrder: number;
}

const OrderPage = ({
  windowSize,
  setPage,
  hasRobot = false,
  baseUrl,
  currentOrder,
  locationOrder,
}: OrderPageProps): JSX.Element => {
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [badRequest, setBadRequest] = useState<string | undefined>(undefined);
  const [waitingWebln, setWaitingWebln] = useState<boolean>(false);
  const [openWeblnDialog, setOpenWeblnDialog] = useState<boolean>(false);
  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer>(setInterval(() => null, delay));
  const [tab, setTab] = useState<'order' | 'contract'>('contract');

  useEffect(() => {
    fetchOrder();
    setTimer(setInterval(fetchOrder, delay));
  }, []);

  useEffect(() => {
    clearInterval(timer);
    setTimer(setInterval(fetchOrder, delay));

    return () => clearInterval(timer);
  }, [delay]);

  const orderReceived = function (data: any) {
    if (data.bad_request != undefined) {
      setBadRequest(data.bad_request);
    } else {
      if (data.status !== (order != undefined ? order.status : -1)) {
        handleWebln(data);
      }
      setDelay(data.status >= 0 && data.status <= 18 ? statusToDelay[data.status] : 99999999);
      setOrder(data);
      setBadRequest(undefined);
    }
  };

  const fetchOrder = function () {
    console.log('location', locationOrder);
    console.log('current', currentOrder);
    const id = locationOrder ?? currentOrder;
    apiClient.get(baseUrl, '/api/order/?order_id=' + id).then(orderReceived);
  };

  const sendWeblnInvoice = (invoice: string) => {
    apiClient
      .post(baseUrl, '/api/order/?order_id=' + currentOrder, {
        action: 'update_invoice',
        invoice,
      })
      .then((data) => setOrder(data));
  };

  const handleWebln = async (data: Order) => {
    const webln = await getWebln();
    // If Webln implements locked payments compatibility, this logic might be simplier
    if (data.is_maker && data.status == 0) {
      webln.sendPayment(data.bond_invoice);
      setWaitingWebln(true);
      setOpenWeblnDialog(true);
    } else if (data.is_taker && data.status == 3) {
      webln.sendPayment(data.bond_invoice);
      setWaitingWebln(true);
      setOpenWeblnDialog(true);
    } else if (data.is_seller && (data.status == 6 || data.status == 7)) {
      webln.sendPayment(data.escrow_invoice);
      setWaitingWebln(true);
      setOpenWeblnDialog(true);
    } else if (data.is_buyer && (data.status == 6 || data.status == 8)) {
      setWaitingWebln(true);
      setOpenWeblnDialog(true);
      webln
        .makeInvoice(data.trade_satoshis)
        .then((invoice: any) => {
          if (invoice) {
            sendWeblnInvoice(invoice.paymentRequest);
            setWaitingWebln(false);
            setOpenWeblnDialog(false);
          }
        })
        .catch(() => {
          setWaitingWebln(false);
          setOpenWeblnDialog(false);
        });
    } else {
      setWaitingWebln(false);
    }
  };

  const WeblnDialog = function () {
    const { t } = useTranslation();

    return (
      <Dialog open={openWeblnDialog} onClose={() => setOpenWeblnDialog(false)}>
        <DialogTitle>{t('WebLN')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {waitingWebln ? (
              <>
                <CircularProgress size={16} thickness={5} style={{ marginRight: 10 }} />
                {order.is_buyer
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
          <Button onClick={() => setOpenWeblnDialog(false)} autoFocus>
            {t('Done')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const DoublePage = () => {
    return (
      <Grid
        container
        xs={12}
        direction='row'
        justifyContent='center'
        alignItems='flex-start'
        spacing={2}
      >
        <Grid item>
          <Paper elevation={12} style={{ width: '21em' }}>
            <OrderDetails
              order={order}
              setOrder={setOrder}
              baseUrl={baseUrl}
              setPage={setPage}
              hasRobot={hasRobot}
              handleWebln={handleWebln}
            />
          </Paper>
        </Grid>
        <Grid item>
          <Paper elevation={12} style={{ width: '21em' }}>
            <TradeBox order={order} setOrder={setOrder} baseUrl={baseUrl} />
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const SinglePage = function () {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(mouseEvent, value) => setTab(value)} variant='fullWidth'>
            <Tab label={t('Order')} value='order' />
            <Tab label={t('Contract')} value='contract' />
          </Tabs>
        </Box>

        {/* <div style={{ width: '21em', display: tab == 'order' ? '' : 'none' }}> */}
        <Paper elevation={12} style={{ width: '21em' }}>
          <Collapse in={tab == 'order'}>
            <OrderDetails
              order={order}
              setOrder={setOrder}
              baseUrl={baseUrl}
              setPage={setPage}
              hasRobot={hasRobot}
              handleWebln={handleWebln}
            />
          </Collapse>
          <Collapse in={tab == 'contract'}>
            <TradeBox order={order} setOrder={setOrder} baseUrl={baseUrl} />
          </Collapse>
        </Paper>
        {/* </div> */}
        {/* <div style={{ display: this.state.tabValue == 1 ? '' : 'none' }}> */}
        {/* </div> */}
      </Box>
    );
  };

  return (
    <Box>
      <Fade in={order == undefined}>
        <CircularProgress />
      </Fade>
      <Fade in={badRequest != undefined}>
        <Typography align='center' variant='subtitle2' color='secondary'>
          {t(badRequest)}
        </Typography>
      </Fade>
      {order != undefined && badRequest == undefined ? (
        <>
          <Collapse in={order.is_participant}>
            <WeblnDialog />
            <Collapse in={windowSize.width > 70}>
              <DoublePage />
            </Collapse>
            <Collapse in={windowSize.width <= 70}>
              <SinglePage />
            </Collapse>
          </Collapse>
          <Collapse in={!order.is_participant}>
            <OrderDetails
              order={order}
              setOrder={setOrder}
              baseUrl={baseUrl}
              setPage={setPage}
              hasRobot={hasRobot}
              handleWebln={handleWebln}
            />
          </Collapse>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default OrderPage;
