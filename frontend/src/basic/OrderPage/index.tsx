import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Tabs, Paper, CircularProgress, Grid, Typography, Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import { apiClient } from '../../services/api';
import { AppContext, hostUrl, origin, type UseAppStoreType } from '../../contexts/AppContext';
import { getEndpoint } from '../../models/Coordinator.model';

const OrderPage = (): JSX.Element => {
  const {
    windowSize,
    setFocusedCoordinator,
    setOpen,
    federation,
    order,
    robot,
    settings,
    setOrder,
    clearOrder,
    currentOrder,
    setCurrentOrder,
    badOrder,
    setBadOrder,
    navbarHeight,
  } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();

  const doublePageWidth: number = 50;
  const maxHeight: number = (windowSize.height - navbarHeight) * 0.85 - 3;

  const [tab, setTab] = useState<'order' | 'contract'>('contract');
  const [baseUrl, setBaseUrl] = useState<string>(hostUrl);

  useEffect(() => {
    const newOrder = { shortAlias: params.shortAlias, id: Number(params.orderId) };
    const { url, basePath } = getEndpoint({
      network: settings.network,
      coordinator: federation[newOrder.shortAlias],
      origin,
      selfHosted: settings.selfhostedClient,
      hostUrl,
    });
    setBaseUrl(`${url}${basePath}`);
    if (currentOrder !== newOrder) {
      clearOrder();
      setCurrentOrder(newOrder);
    }
  }, [params.orderId]);

  const onClickCoordinator = function (): void {
    setFocusedCoordinator(currentOrder.shortAlias);
    setOpen((open) => {
      return { ...open, coordinator: true };
    });
  };

  const renewOrder = function (): void {
    if (order !== undefined) {
      const body = {
        type: order.type,
        currency: order.currency,
        amount: order.has_range ? null : order.amount,
        has_range: order.has_range,
        min_amount: order.min_amount,
        max_amount: order.max_amount,
        payment_method: order.payment_method,
        is_explicit: order.is_explicit,
        premium: order.is_explicit ? null : order.premium,
        satoshis: order.is_explicit ? order.satoshis : null,
        public_duration: order.public_duration,
        escrow_duration: order.escrow_duration,
        bond_size: order.bond_size,
      };
      apiClient
        .post(baseUrl, '/api/make/', body, { tokenSHA256: robot.tokenSHA256 })
        .then((data: any) => {
          if (data.bad_request !== undefined) {
            setBadOrder(data.bad_request);
          } else if (data.id !== undefined) {
            navigate(`/order/${String(currentOrder.shortAlias)}/${String(data.id)}`);
          }
        })
        .catch(() => {
          setBadOrder('Request error');
        });
    }
  };

  const startAgain = (): void => {
    navigate('/robot');
  };

  return (
    <Box>
      {order === undefined && badOrder === undefined && <CircularProgress />}
      {badOrder !== undefined ? (
        <Typography align='center' variant='subtitle2' color='secondary'>
          {t(badOrder)}
        </Typography>
      ) : null}
      {order !== undefined && badOrder === undefined ? (
        order.is_participant ? (
          windowSize.width > doublePageWidth ? (
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
                    coordinator={federation[String(currentOrder.shortAlias)]}
                    onClickCoordinator={onClickCoordinator}
                    setOrder={setOrder}
                    baseUrl={baseUrl}
                    hasRobot={robot.avatarLoaded}
                    onClickGenerateRobot={() => {
                      navigate('/robot');
                    }}
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
                  <TradeBox
                    order={order}
                    robot={robot}
                    settings={settings}
                    setOrder={setOrder}
                    setBadOrder={setBadOrder}
                    baseUrl={baseUrl}
                    onRenewOrder={renewOrder}
                    onStartAgain={startAgain}
                  />
                </Paper>
              </Grid>
            </Grid>
          ) : (
            // SINGLE PAPER VIEW
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '21em' }}>
                <Tabs
                  value={tab}
                  onChange={(mouseEvent, value) => {
                    setTab(value);
                  }}
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
                <div style={{ display: tab === 'order' ? '' : 'none' }}>
                  <OrderDetails
                    order={order}
                    coordinator={federation[String(currentOrder.shortAlias)]}
                    onClickCoordinator={onClickCoordinator}
                    setOrder={setOrder}
                    baseUrl={baseUrl}
                    hasRobot={robot.avatarLoaded}
                    onClickGenerateRobot={() => {
                      navigate('/robot');
                    }}
                  />
                </div>
                <div style={{ display: tab === 'contract' ? '' : 'none' }}>
                  <TradeBox
                    order={order}
                    robot={robot}
                    settings={settings}
                    setOrder={setOrder}
                    setBadOrder={setBadOrder}
                    baseUrl={baseUrl}
                    onRenewOrder={renewOrder}
                    onStartAgain={startAgain}
                  />
                </div>
              </Paper>
            </Box>
          )
        ) : (
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
              coordinator={federation[String(currentOrder.shortAlias)]}
              onClickCoordinator={onClickCoordinator}
              setOrder={setOrder}
              baseUrl={hostUrl}
              hasRobot={robot.avatarLoaded}
              onClickGenerateRobot={() => {
                navigate('/robot');
              }}
            />
          </Paper>
        )
      ) : (
        <></>
      )}
    </Box>
  );
};

export default OrderPage;
