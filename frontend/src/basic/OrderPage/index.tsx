import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Tabs, Paper, CircularProgress, Grid, Typography, Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import { apiClient } from '../../services/api';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type Order } from '../../models';

const OrderPage = (): JSX.Element => {
  const { windowSize, setOpen, settings, navbarHeight, hostUrl, origin } =
    useContext<UseAppStoreType>(AppContext);
  const { setFocusedCoordinator, federation, focusedCoordinator } =
    useContext<UseFederationStoreType>(FederationContext);
  const { garage, badOrder, setBadOrder } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();

  const doublePageWidth: number = 50;
  const maxHeight: number = (windowSize?.height - navbarHeight) * 0.85 - 3;

  const [tab, setTab] = useState<'order' | 'contract'>('contract');
  const [baseUrl, setBaseUrl] = useState<string>(hostUrl);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    const coordinator = federation.getCoordinator(params.shortAlias ?? '');
    const { url, basePath } = coordinator.getEndpoint(
      settings.network,
      origin,
      settings.selfhostedClient,
      hostUrl,
    );

    setBaseUrl(`${url}${basePath}`);

    if (garage.getSlot().activeOrderId === Number(params.orderId)) {
      if (garage.getSlot().order != null) {
        setCurrentOrder(garage.getSlot().order);
      } else {
        coordinator
          .fetchOrder(Number(params.orderId) ?? null, garage.getRobot())
          .then((order) => {
            if (order?.bad_request !== undefined) {
              setBadOrder(order.bad_request);
            } else {
              setCurrentOrder(order);
              garage.updateOrder(order as Order);
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    } else {
      coordinator
        .fetchOrder(Number(params.orderId) ?? null, garage.getRobot())
        .then((order) => {
          if (order?.bad_request !== undefined) {
            setBadOrder(order.bad_request);
          } else {
            setCurrentOrder(order);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [params]);

  const onClickCoordinator = function (): void {
    if (currentOrder?.shortAlias != null) {
      setFocusedCoordinator(currentOrder.shortAlias);
    }
    setOpen((open) => {
      return { ...open, coordinator: true };
    });
  };

  const renewOrder = function (): void {
    const order = currentOrder;
    if (order !== null && focusedCoordinator != null) {
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
        latitude: order.latitude,
        longitude: order.longitude,
      };
      const { url, basePath } = federation
        .getCoordinator(order.shortAlias)
        .getEndpoint(settings.network, origin, settings.selfhostedClient, hostUrl);
      apiClient
        .post(url + basePath, '/api/make/', body, { tokenSHA256: garage.getRobot().tokenSHA256 })
        .then((data: any) => {
          if (data.bad_request !== undefined) {
            setBadOrder(data.bad_request);
          } else if (data.id !== undefined) {
            navigate(`/order/${String(currentOrder?.shortAlias)}/${String(data.id)}`);
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
      {currentOrder === null && badOrder === undefined && <CircularProgress />}
      {badOrder !== undefined ? (
        <Typography align='center' variant='subtitle2' color='secondary'>
          {t(badOrder)}
        </Typography>
      ) : null}
      {currentOrder !== null && badOrder === undefined ? (
        currentOrder.is_participant ? (
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
                    shortAlias={String(currentOrder.shortAlias)}
                    currentOrder={currentOrder}
                    onClickCoordinator={onClickCoordinator}
                    baseUrl={baseUrl}
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
                    robot={garage.getRobot()}
                    currentOrder={currentOrder}
                    settings={settings}
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
                    shortAlias={String(currentOrder.shortAlias)}
                    currentOrder={currentOrder}
                    onClickCoordinator={onClickCoordinator}
                    baseUrl={baseUrl}
                    onClickGenerateRobot={() => {
                      navigate('/robot');
                    }}
                  />
                </div>
                <div style={{ display: tab === 'contract' ? '' : 'none' }}>
                  <TradeBox
                    robot={garage.getRobot()}
                    currentOrder={currentOrder}
                    settings={settings}
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
              shortAlias={String(currentOrder.shortAlias)}
              currentOrder={currentOrder}
              onClickCoordinator={onClickCoordinator}
              baseUrl={hostUrl}
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
