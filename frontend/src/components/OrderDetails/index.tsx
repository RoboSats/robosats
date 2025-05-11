import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  Alert,
  Chip,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Collapse,
  useTheme,
  Typography,
  IconButton,
  Tooltip,
  ListItemButton,
} from '@mui/material';

import Countdown, { type CountdownRenderProps, zeroPad } from 'react-countdown';
import RobotAvatar from '../../components/RobotAvatar';
import currencies from '../../../static/assets/currencies.json';
import {
  AccessTime,
  Numbers,
  PriceChange,
  Payments,
  Article,
  HourglassTop,
  ExpandLess,
  ExpandMore,
  Map,
} from '@mui/icons-material';
import { PaymentStringAsIcons } from '../../components/PaymentMethods';
import { FlagWithProps, SendReceiveIcon } from '../Icons';
import LinearDeterminate from './LinearDeterminate';

import type Coordinator from '../../models';
import { statusBadgeColor, pn, amountToString, computeSats } from '../../utils';
import TakeButton from './TakeButton';
import { F2fMapDialog } from '../Dialogs';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { type Order } from '../../models';

interface OrderDetailsProps {
  shortAlias: string;
  currentOrder: Order;
  onClickCoordinator?: () => void;
  onClickGenerateRobot?: () => void;
}

const OrderDetails = ({
  shortAlias,
  currentOrder,
  onClickCoordinator = () => null,
  onClickGenerateRobot = () => null,
}: OrderDetailsProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(
    federation.getCoordinator(shortAlias),
  );
  const [currencyCode, setCurrencyCode] = useState<string | null>();
  const [showSatsDetails, setShowSatsDetails] = useState<boolean>(false);
  const [openWorldmap, setOpenWorldmap] = useState<boolean>(false);

  useEffect(() => {
    setCoordinator(federation.getCoordinator(shortAlias));
    setCurrencyCode(currencies[(currentOrder?.currency ?? 1).toString()]);
  }, [currentOrder]);

  useEffect(() => {
    if (!coordinator?.info) coordinator?.loadInfo();
  }, [coordinator.shortAlias, coordinator.info]);

  const amountString = useMemo(() => {
    if (currentOrder === null) return;

    if (currentOrder.currency === 1000) {
      return (
        amountToString(
          (currentOrder.amount * 100000000).toString(),
          currentOrder.amount > 0 ? false : currentOrder.has_range,
          currentOrder.min_amount * 100000000,
          currentOrder.max_amount * 100000000,
        ) + ' Sats'
      );
    } else {
      return (
        amountToString(
          currentOrder.amount?.toString(),
          currentOrder.amount > 0 ? false : currentOrder.has_range,
          currentOrder.min_amount,
          currentOrder.max_amount,
        ) + ` ${String(currencyCode)}`
      );
    }
  }, [currentOrder, currencyCode]);

  // Countdown Renderer callback with condition
  const countdownRenderer = function ({
    total,
    hours,
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps): React.JSX.Element {
    if (completed) {
      // Render a completed state
      return <span> {t('The order has expired')}</span>;
    } else {
      let color = 'inherit';
      const fraction_left = total / 1000 / (currentOrder?.total_secs_exp ?? 1);
      // Make orange at 25% of time left
      if (fraction_left < 0.25) {
        color = theme.palette.warning.main;
      }
      // Make red at 10% of time left
      if (fraction_left < 0.1) {
        color = theme.palette.error.main;
      }
      // Render a countdown, bold when less than 25%
      return fraction_left < 0.25 ? (
        <a style={{ color }}>
          <b>{`${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s `}</b>
        </a>
      ) : (
        <a style={{ color }}>{`${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s `}</a>
      );
    }
  };

  const timerRenderer = function (seconds: number): React.JSX.Element {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    return (
      <span>
        {hours > 0 ? `${hours}h` : ''} {minutes > 0 ? `${zeroPad(minutes)}m` : ''}{' '}
      </span>
    );
  };

  // Countdown Renderer callback with condition
  const countdownPenaltyRenderer = ({
    minutes,
    seconds,
    completed,
  }: {
    minutes: number;
    seconds: number;
    completed: boolean;
  }): React.JSX.Element => {
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

  const satsSummary = useMemo(() => {
    let send: string = '';
    let receive: string = '';
    let sats: string = '';
    const order = currentOrder;

    if (order === null) return {};

    const isBuyer = (order.type === 0 && order.is_maker) || (order.type === 1 && !order.is_maker);
    const tradeFee = order.is_maker
      ? (coordinator.info?.maker_fee ?? 0)
      : (coordinator.info?.taker_fee ?? 0);
    const defaultRoutingBudget = 0.001;
    const btc_now = order.satoshis_now / 100000000;
    const rate = Number(order.max_amount ?? order.amount) / btc_now;

    if (isBuyer) {
      if (order.amount && order.amount > 0) {
        sats = computeSats({
          amount: order.amount,
          fee: -tradeFee,
          routingBudget: defaultRoutingBudget,
          rate,
        });
      } else {
        const min = computeSats({
          amount: Number(order.min_amount),
          fee: -tradeFee,
          routingBudget: defaultRoutingBudget,
          rate,
        });
        const max = computeSats({
          amount: Number(order.max_amount),
          fee: -tradeFee,
          routingBudget: defaultRoutingBudget,
          rate,
        });
        sats = `${String(min)}-${String(max)}`;
      }
      send = t('You send via {{method}} {{amount}}', {
        amount: amountString,
        method: order.payment_method,
      });
      receive = t('You receive {{amount}} Sats (Approx)', {
        amount: sats,
      });
    } else {
      if (order.amount && order.amount > 0) {
        sats = computeSats({
          amount: order.amount,
          fee: tradeFee,
          rate,
        });
      } else {
        const min = computeSats({
          amount: order.min_amount,
          fee: tradeFee,
          rate,
        });
        const max = computeSats({
          amount: order.max_amount,
          fee: tradeFee,
          rate,
        });
        sats = `${String(min)}-${String(max)}`;
      }
      send = t('You send via Lightning {{amount}} Sats (Approx)', { amount: sats });
      receive = t('You receive via {{method}} {{amount}}', {
        amount: amountString,
        method: order.payment_method,
      });
    }

    return { send, receive };
  }, [currentOrder, amountString]);

  return (
    <Grid container spacing={0}>
      <F2fMapDialog
        latitude={currentOrder?.latitude}
        longitude={currentOrder?.longitude}
        open={openWorldmap}
        orderType={currentOrder?.type ?? 0}
        zoom={6}
        message={t(
          'The pinned location is approximate. The exact location for the meeting place must be exchanged in the encrypted chat.',
        )}
        onClose={() => {
          setOpenWorldmap(false);
        }}
      />
      <List dense={true} style={{ width: '100%' }}>
        <ListItemButton
          onClick={() => {
            onClickCoordinator();
          }}
        >
          <Grid container direction='row' justifyContent='center' alignItems='center'>
            <Grid item sx={{ width: '64px' }}>
              <RobotAvatar
                shortAlias={coordinator.federated ? coordinator.shortAlias : undefined}
                hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
                small={true}
                smooth={true}
                style={{
                  height: '45px',
                  width: '45px',
                }}
              />
            </Grid>
            <Grid item>
              <ListItemText primary={coordinator.longAlias} secondary={t('Order host')} />
            </Grid>
          </Grid>
        </ListItemButton>
        {coordinator?.info && !coordinator?.info?.swap_enabled && (
          <ListItem>
            <Grid sx={{ marginBottom: 1 }}>
              <Alert severity='warning'>
                {t('This coordinator does not support on-chain swaps.')}
              </Alert>
            </Grid>
          </ListItem>
        )}

        <Divider />

        <ListItem>
          <ListItemAvatar sx={{ width: '4em', height: '4em' }}>
            <RobotAvatar
              statusColor={statusBadgeColor(currentOrder?.maker_status ?? '')}
              hashId={currentOrder?.maker_hash_id}
              tooltip={t(currentOrder?.maker_status ?? '')}
              orderType={currentOrder?.type}
              small={true}
            />
          </ListItemAvatar>
          <ListItemText
            primary={`${String(currentOrder?.maker_nick)} (${
              currentOrder?.type === 1
                ? t(currentOrder?.currency === 1000 ? 'Swapping Out' : 'Seller')
                : t(currentOrder?.currency === 1000 ? 'Swapping In' : 'Buyer')
            })`}
            secondary={t('Order maker')}
          />
        </ListItem>

        <Collapse in={currentOrder?.is_participant && currentOrder?.taker_nick !== 'None'}>
          <Divider />
          <ListItem>
            <ListItemText
              primary={`${String(currentOrder?.taker_nick)} (${
                currentOrder?.type === 1
                  ? t(currentOrder?.currency === 1000 ? 'Swapping In' : 'Buyer')
                  : t(currentOrder?.currency === 1000 ? 'Swapping Out' : 'Seller')
              })`}
              secondary={t('Order taker')}
            />
            <ListItemAvatar>
              <RobotAvatar
                avatarClass='smallAvatar'
                statusColor={statusBadgeColor(currentOrder?.taker_status ?? '')}
                hashId={
                  currentOrder?.taker_hash_id === 'None' ? undefined : currentOrder?.taker_hash_id
                }
                tooltip={t(currentOrder?.taker_status ?? '')}
                orderType={currentOrder?.type === 0 ? 1 : 0}
                small={true}
              />
            </ListItemAvatar>
          </ListItem>
        </Collapse>
        <Divider>
          <Chip label={t('Order Details')} />
        </Divider>

        <Collapse in={currentOrder?.is_participant}>
          <ListItem>
            <ListItemIcon>
              <Article />
            </ListItemIcon>
            <ListItemText
              primary={t(currentOrder?.status_message ?? '')}
              secondary={t('Order status')}
            />
          </ListItem>
          <Divider />
        </Collapse>

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
              <FlagWithProps code={currencyCode} width='1.2em' height='1.2em' />
            </div>
          </ListItemIcon>
          <ListItemText
            primary={amountString}
            secondary={(currentOrder?.amount ?? 0) > 0 ? 'Amount' : 'Amount Range'}
          />
          <ListItemIcon>
            <IconButton
              onClick={() => {
                setShowSatsDetails(!showSatsDetails);
              }}
            >
              {showSatsDetails ? <ExpandLess /> : <ExpandMore color='primary' />}
            </IconButton>
          </ListItemIcon>
        </ListItem>

        <Collapse in={showSatsDetails}>
          <List dense={true} sx={{ position: 'relative', bottom: '0.5em' }}>
            <ListItem>
              <ListItemIcon sx={{ position: 'relative', left: '0.3em' }}>
                <SendReceiveIcon
                  sx={{ transform: 'scaleX(-1)', width: '0.9em', opacity: 0.9 }}
                  color='secondary'
                />
              </ListItemIcon>
              <Typography variant='body2'>{satsSummary.send}</Typography>
            </ListItem>

            <ListItem>
              <ListItemIcon sx={{ position: 'relative', left: '0.3em' }}>
                <SendReceiveIcon
                  sx={{ left: '0.1em', width: '0.9em', opacity: 0.9 }}
                  color='primary'
                />
              </ListItemIcon>
              <Typography variant='body2'>{satsSummary.receive}</Typography>
            </ListItem>
          </List>
        </Collapse>

        <Divider />

        <ListItem>
          <ListItemIcon>
            <Payments />
          </ListItemIcon>
          <ListItemText
            primary={
              <PaymentStringAsIcons
                size={1.42 * theme.typography.fontSize}
                othersText={t('Others')}
                verbose={true}
                text={currentOrder?.payment_method}
              />
            }
            secondary={
              currentOrder?.currency === 1000
                ? t('Swap destination')
                : t('Accepted payment methods')
            }
          />
          {currentOrder?.payment_method.includes('Cash F2F') && (
            <ListItemIcon>
              <Tooltip enterTouchDelay={0} title={t('F2F location')}>
                <div>
                  <IconButton
                    onClick={() => {
                      setOpenWorldmap(true);
                    }}
                  >
                    <Map />
                  </IconButton>
                </div>
              </Tooltip>
            </ListItemIcon>
          )}
        </ListItem>
        <Divider />

        {/* If there is live Price and Premium data, show it. Otherwise show the order maker settings */}
        <ListItem>
          <ListItemIcon>
            <PriceChange />
          </ListItemIcon>

          {currentOrder?.price_now !== undefined ? (
            <ListItemText
              primary={t('{{price}} {{currencyCode}}/BTC - Premium: {{premium}}%', {
                price: pn(currentOrder?.price_now),
                currencyCode,
                premium: currentOrder?.premium_now,
              })}
              secondary={t('Price and Premium')}
            />
          ) : null}

          {currentOrder?.price_now === undefined && currentOrder?.is_explicit ? (
            <ListItemText
              primary={pn(currentOrder?.satoshis)}
              secondary={t('Amount of Satoshis')}
            />
          ) : null}

          {currentOrder?.price_now === undefined && !currentOrder?.is_explicit ? (
            <ListItemText
              primary={`${parseFloat(Number(currentOrder?.premium).toFixed(2))}%`}
              secondary={t('Premium over market price')}
            />
          ) : null}
        </ListItem>

        <Divider />

        <Grid container direction='row' justifyContent='center' alignItems='center'>
          <ListItem style={{ width: '50%' }}>
            <ListItemIcon>
              <Numbers />
            </ListItemIcon>
            <ListItemText primary={currentOrder?.id} secondary={t('Order ID')} />
          </ListItem>

          <ListItem style={{ width: '50%' }}>
            <ListItemIcon>
              <HourglassTop />
            </ListItemIcon>
            <ListItemText
              primary={timerRenderer(currentOrder?.escrow_duration)}
              secondary={t('Deposit')}
            />
          </ListItem>
        </Grid>

        {/* if order is in a status that does not expire, do not show countdown */}
        <Collapse in={![4, 5, 12, 13, 14, 15, 16, 17, 18].includes(currentOrder?.status ?? 0)}>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <AccessTime />
            </ListItemIcon>
            <ListItemText secondary={t('Expires in')}>
              <Countdown
                date={new Date(currentOrder?.expires_at ?? '')}
                renderer={countdownRenderer}
              />
            </ListItemText>
          </ListItem>
          <LinearDeterminate
            totalSecsExp={currentOrder?.total_secs_exp ?? 0}
            expiresAt={currentOrder?.expires_at ?? ''}
          />
        </Collapse>
      </List>

      {/* If the user has a penalty/limit */}
      {currentOrder?.penalty !== undefined ? (
        <Grid item style={{ width: '100%' }}>
          <Alert severity='warning' sx={{ borderRadius: '0' }}>
            <Countdown
              date={new Date(currentOrder?.penalty ?? '')}
              renderer={countdownPenaltyRenderer}
            />
          </Alert>
        </Grid>
      ) : (
        <></>
      )}

      {!currentOrder?.is_participant ? (
        <Grid item style={{ width: '100%', padding: '8px' }}>
          <TakeButton
            currentOrder={currentOrder}
            info={coordinator.info}
            onClickGenerateRobot={onClickGenerateRobot}
          />
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export default OrderDetails;
