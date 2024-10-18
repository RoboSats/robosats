import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Tabs, Paper, CircularProgress, Grid, Typography, Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import TradeBox from '../../components/TradeBox';
import OrderDetails from '../../components/OrderDetails';

import { AppContext, closeAll, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { WarningDialog } from '../../components/Dialogs';

const OrderPage = (): JSX.Element => {
  const {
    windowSize,
    open,
    setOpen,
    acknowledgedWarning,
    setAcknowledgedWarning,
    settings,
    navbarHeight,
    hostUrl,
    origin,
  } = useContext<UseAppStoreType>(AppContext);
  const { federation, currentOrder, currentOrderId, setCurrentOrderId } =
    useContext<UseFederationStoreType>(FederationContext);
  const { badOrder } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();

  const doublePageWidth: number = 50;
  const maxHeight: number = (windowSize?.height - navbarHeight) * 0.85 - 3;

  const [tab, setTab] = useState<'order' | 'contract'>('contract');
  const [baseUrl, setBaseUrl] = useState<string>(hostUrl);

  useEffect(() => {
    const shortAlias = params.shortAlias;
    const coordinator = federation.getCoordinator(shortAlias ?? '');
    if (coordinator) {
      const endpoint = coordinator?.getEndpoint(
        settings.network,
        origin,
        settings.selfhostedClient,
        hostUrl,
      );

      if (endpoint) setBaseUrl(`${endpoint?.url}${endpoint?.basePath}`);

      const orderId = Number(params.orderId);
      if (
        orderId &&
        currentOrderId.id !== orderId &&
        currentOrderId.shortAlias !== shortAlias &&
        shortAlias
      )
        setCurrentOrderId({ id: orderId, shortAlias });
      if (!acknowledgedWarning) setOpen({ ...closeAll, warning: true });
    }
  }, [params, currentOrderId]);

  const onClickCoordinator = function (): void {
    if (currentOrder?.shortAlias != null) {
      setOpen((open) => {
        return { ...open, coordinator: currentOrder?.shortAlias };
      });
    }
  };

  const startAgain = (): void => {
    navigate('/robot');
  };

  const orderDetailsSpace = currentOrder ? (
    <OrderDetails
      shortAlias={String(currentOrder.shortAlias)}
      currentOrder={currentOrder}
      onClickCoordinator={onClickCoordinator}
      onClickGenerateRobot={() => {
        navigate('/robot');
      }}
    />
  ) : (
    <></>
  );

  const tradeBoxSpace = currentOrder ? (
    <TradeBox baseUrl={baseUrl} onStartAgain={startAgain} />
  ) : (
    <></>
  );

  return (
    <Box>
      <WarningDialog
        open={open.warning}
        onClose={() => {
          setOpen(closeAll);
          setAcknowledgedWarning(true);
        }}
        longAlias={federation.getCoordinator(params.shortAlias ?? '')?.longAlias}
      />
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
