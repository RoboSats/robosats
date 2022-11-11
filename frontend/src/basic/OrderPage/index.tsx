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

  const doublePageWidth: number = 50;
  const maxHeight: number = windowSize.height * 0.85 - 3;

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

  return (
    <Box>
      {order == undefined ? <CircularProgress /> : <></>}
      {badRequest != undefined ? (
        <Typography align='center' variant='subtitle2' color='secondary'>
          {t(badRequest)}
        </Typography>
      ) : (
        <></>
      )}
      {order != undefined && badRequest == undefined ? (
        order.is_participant ? (
          <>
            <WeblnDialog />
            {windowSize.width > doublePageWidth ? (
              // DOUBLE PAPER VIEW
              <Grid
                container
                direction='row'
                justifyContent='center'
                alignItems='flex-start'
                spacing={2}
                style={{ width: '43em' }}
              >
                <Grid item xs={6} style={{ width: '21em' }}>
                  <Paper
                    elevation={12}
                    style={{
                      width: '21em',
                      maxHeight: `${maxHeight}em`,
                      overflow: 'auto',
                    }}
                  >
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
                <Grid item xs={6} style={{ width: '21em' }}>
                  <Paper
                    elevation={12}
                    style={{
                      width: '21em',
                      maxHeight: `${maxHeight}em`,
                      overflow: 'auto',
                    }}
                  >
                    <TradeBox order={order} setOrder={setOrder} baseUrl={baseUrl} />
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              // SINGLE PAPER VIEW
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '21em' }}>
                  <Tabs
                    value={tab}
                    onChange={(mouseEvent, value) => setTab(value)}
                    variant='fullWidth'
                  >
                    <Tab label={t('Order')} value='order' />
                    <Tab label={t('Contract')} value='contract' />
                  </Tabs>
                </Box>
                <Paper
                  elevation={12}
                  style={{
                    width: '21em',
                    maxHeight: `${maxHeight}em`,
                    overflow: 'auto',
                  }}
                >
                  <div style={{ display: tab == 'order' ? '' : 'none' }}>
                    <OrderDetails
                      order={order}
                      setOrder={setOrder}
                      baseUrl={baseUrl}
                      setPage={setPage}
                      hasRobot={hasRobot}
                      handleWebln={handleWebln}
                    />
                  </div>
                  <div style={{ display: tab == 'contract' ? '' : 'none' }}>
                    <TradeBox order={order} setOrder={setOrder} baseUrl={baseUrl} />
                  </div>
                </Paper>
              </Box>
            )}
          </>
        ) : (
          <OrderDetails
            order={order}
            setOrder={setOrder}
            baseUrl={baseUrl}
            setPage={setPage}
            hasRobot={hasRobot}
            handleWebln={handleWebln}
          />
        )
      ) : (
        <></>
      )}
    </Box>
  );
};

export default OrderPage;
