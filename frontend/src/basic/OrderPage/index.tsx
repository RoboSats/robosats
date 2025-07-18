import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tab,
  Tabs,
  Paper,
  CircularProgress,
  Grid,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { NoRobotDialog, WarningDialog } from '../../components/Dialogs';
import { Order, type Slot } from '../../models';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { genBase62Token } from '../../utils';

const OrderPage = (): React.JSX.Element => {
  const {
    windowSize,
    setOpen,
    acknowledgedWarning,
    setAcknowledgedWarning,
    navbarHeight,
    navigateToPage,
  } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const paramsRef = useRef(params);

  const doublePageWidth: number = 50;
  const maxHeight: number = (windowSize?.height - navbarHeight) * 0.85 - 3;

  const [tab, setTab] = useState<'order' | 'contract'>('contract');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);
  const [orderStep, setOrderStep] = useState<number>(0);

  useEffect(() => {
    paramsRef.current = params;
    const shortAlias = params.shortAlias;
    const orderId = Number(params.orderId);
    const slot = garage.getSlot();
    if (slot?.token) {
      let order = new Order({ id: orderId, shortAlias });
      if (slot.activeOrder?.id === orderId && slot.activeOrder?.shortAlias === shortAlias) {
        order = slot.activeOrder;
      } else if (slot.lastOrder?.id === orderId && slot.lastOrder?.shortAlias === shortAlias) {
        order = slot.lastOrder;
      }
      void order.fecth(federation, slot).then((updatedOrder) => {
        updateSlotFromOrder(updatedOrder, slot);
      });
    } else {
      setOpenNoRobot(true);
    }

    return () => {
      setCurrentOrder(null);
    };
  }, [params.orderId, openNoRobot, garage.currentSlot]);

  useEffect(() => {
    if (!currentOrder) return;

    setOrderStep(0);
    if ([1].includes(currentOrder.status)) {
      setOrderStep(1);
    } else if ([6, 7, 8].includes(currentOrder.status)) {
      setOrderStep(currentOrder.is_taker ? 1 : 2);
    } else if ([9, 10, 11, 12].includes(currentOrder.status)) {
      setOrderStep(currentOrder.is_taker ? 2 : 3);
    } else if ([13, 14, 15, 16, 17, 18].includes(currentOrder.status)) {
      setOrderStep(5);
    }
  }, [currentOrder?.status]);

  const updateSlotFromOrder = (updatedOrder: Order, slot: Slot): void => {
    if (
      Number(paramsRef.current.orderId) === updatedOrder.id &&
      paramsRef.current.shortAlias === updatedOrder.shortAlias
    ) {
      setCurrentOrder(updatedOrder);
      slot.updateSlotFromOrder(updatedOrder);
    }
  };

  const onClickCoordinator = function (): void {
    if (currentOrder?.shortAlias != null) {
      setOpen((open) => {
        return { ...open, coordinator: currentOrder?.shortAlias };
      });
    }
  };

  const startAgain = (): void => {
    navigateToPage('order', navigate);
  };

  const orderDetailsSpace = currentOrder ? (
    <OrderDetails
      shortAlias={String(currentOrder.shortAlias)}
      currentOrder={currentOrder}
      setCurrentOrder={setCurrentOrder}
      onClickCoordinator={onClickCoordinator}
    />
  ) : (
    <></>
  );

  const tradeBoxSpace = currentOrder ? (
    <TradeBox onStartAgain={startAgain} currentOrder={currentOrder} />
  ) : (
    <></>
  );

  const steps = currentOrder?.is_taker
    ? [t('Take'), t('Setup'), t('Trade'), t('Finish')]
    : [t('Publish'), t('Wait'), t('Setup'), t('Trade'), t('Finish')];

  return (
    <Box>
      <WarningDialog
        open={!acknowledgedWarning && currentOrder?.status === 0}
        onClose={() => {
          setAcknowledgedWarning(true);
        }}
        longAlias={federation.getCoordinator(params.shortAlias ?? '')?.longAlias}
      />
      <NoRobotDialog
        open={openNoRobot}
        onClose={() => {
          setOpenNoRobot(false);
        }}
        onClickGenerateRobot={() => {
          const token = genBase62Token(36);
          garage
            .createRobot(federation, token)
            .then(() => {
              setOpenNoRobot(false);
            })
            .catch((e) => {
              console.log(e);
            });
        }}
      />
      {!currentOrder?.maker && !currentOrder?.bad_request && <CircularProgress />}

      {currentOrder?.bad_request && currentOrder.status !== 5 ? (
        <>
          <Typography align='center' variant='subtitle2' color='secondary'>
            {t(currentOrder.bad_request)}
          </Typography>
          {currentOrder?.bad_request?.includes('password') && (
            <Grid item xs={6} style={{ width: '21em' }}>
              <Paper
                elevation={12}
                style={{
                  width: '21em',
                  maxHeight: `${maxHeight}em`,
                  overflow: 'auto',
                }}
              >
                {orderDetailsSpace}
              </Paper>
            </Grid>
          )}
        </>
      ) : null}
      {currentOrder?.maker && (!currentOrder.bad_request || currentOrder.status === 5) ? (
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
              <Grid item xs={12} style={{ width: '42em' }}>
                <Stepper activeStep={orderStep}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{t(label)}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
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
                  {orderDetailsSpace}
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
                  {tradeBoxSpace}
                </Paper>
              </Grid>
            </Grid>
          ) : (
            // SINGLE PAPER VIEW
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '21em' }}>
                <Tabs
                  value={tab}
                  onChange={(_mouseEvent, value) => {
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
                <div style={{ display: tab === 'order' ? '' : 'none' }}>{orderDetailsSpace}</div>
                <div style={{ display: tab === 'contract' ? '' : 'none' }}>{tradeBoxSpace}</div>
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
            {orderDetailsSpace}
          </Paper>
        )
      ) : (
        <></>
      )}
    </Box>
  );
};

export default OrderPage;
