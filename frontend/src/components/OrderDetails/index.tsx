import React, { useState, useMemo } from 'react';
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
} from '@mui/material';

import Countdown, { CountdownRenderProps, zeroPad } from 'react-countdown';
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
} from '@mui/icons-material';
import { PaymentStringAsIcons } from '../../components/PaymentMethods';
import { FlagWithProps, SendReceiveIcon } from '../Icons';
import LinearDeterminate from './LinearDeterminate';

import { Order, Info } from '../../models';
import { statusBadgeColor, pn, amountToString, computeSats } from '../../utils';
import TakeButton from './TakeButton';

interface OrderDetailsProps {
  order: Order;
  setOrder: (state: Order) => void;
  info: Info;
  baseUrl: string;
  hasRobot: boolean;
}

const OrderDetails = ({
  order,
  info,
  setOrder,
  baseUrl,
  hasRobot,
}: OrderDetailsProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const currencyCode: string = currencies[`${order.currency}`];
  const [showSwapDetails, setShowSwapDetails] = useState<boolean>(false);

  const amountString = useMemo(() => {
    // precision to 8 decimal if currency is BTC otherwise 4 decimals
    if (order.currency == 1000) {
      return (
        amountToString(
          order.amount * 100000000,
          order.amount ? false : order.has_range,
          order.min_amount * 100000000,
          order.max_amount * 100000000,
        ) + ' Sats'
      );
    } else {
      return amountToString(
        order.amount,
        order.amount ? false : order.has_range,
        order.min_amount,
        order.max_amount,
      );
    }
  }, [order.currency, order.amount, order.min_amount, order.max_amount, order.has_range]);

  // Countdown Renderer callback with condition
  const countdownRenderer = function ({
    total,
    hours,
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps) {
    if (completed) {
      // Render a completed state
      return <span> {t('The order has expired')}</span>;
    } else {
      let color = 'inherit';
      const fraction_left = total / 1000 / order.total_secs_exp;
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

  const timerRenderer = function (seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    return (
      <span>
        {hours > 0 ? hours + 'h' : ''} {minutes > 0 ? zeroPad(minutes) + 'm' : ''}{' '}
      </span>
    );
  };

  // Countdown Renderer callback with condition
  const countdownPenaltyRenderer = function ({ minutes, seconds, completed }) {
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

  const swap = useMemo(() => {
    let send: string = '';
    let receive: string = '';
    let swapSats: string = '';

    const isSwapIn = (order.type == 0 && order.is_maker) || (order.type == 1 && !order.is_maker);
    const tradeFee = order.is_maker ? info.maker_fee : info.taker_fee;
    const defaultRoutingBudget = 0.001;
    if (order.currency === 1000) {
      if (isSwapIn) {
        if (order.amount) {
          swapSats = computeSats({
            amount: order.amount,
            premium: order.premium,
            fee: -tradeFee,
            routingBudget: defaultRoutingBudget,
          });
        } else {
          const swapMin = computeSats({
            amount: Number(order.min_amount),
            premium: order.premium,
            fee: -tradeFee,
            routingBudget: defaultRoutingBudget,
          });
          const swapMax = computeSats({
            amount: Number(order.max_amount),
            premium: order.premium,
            fee: -tradeFee,
            routingBudget: defaultRoutingBudget,
          });
          swapSats = `${swapMin}-${swapMax}`;
        }
        send = t('You send via {{method}} {{amount}}', {
          amount: amountString,
          method: order.payment_method,
        });
        receive = t('You receive via Lightning {{amount}} Sats (routing budget may vary)', {
          amount: swapSats,
        });
      } else {
        if (order.amount) {
          swapSats = computeSats({ amount: order.amount, premium: order.premium, fee: tradeFee });
        } else {
          const swapMin = computeSats({
            amount: order.min_amount,
            premium: order.premium,
            fee: tradeFee,
          });
          const swapMax = computeSats({
            amount: order.max_amount,
            premium: order.premium,
            fee: tradeFee,
          });
          swapSats = `${swapMin}-${swapMax}`;
        }
        send = t('You send via Lightning {{amount}} Sats', { amount: swapSats });
        receive = t('You receive via {{method}} {{amount}}', {
          amount: amountString,
          method: order.payment_method,
        });
      }
    }
    return { send, receive, isSwapIn };
  }, [order.currency, order.amount, order.has_range]);

  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <List dense={true}>
          <ListItem>
            <ListItemAvatar sx={{ width: '4em', height: '4em' }}>
              <RobotAvatar
                statusColor={statusBadgeColor(order.maker_status)}
                nickname={order.maker_nick}
                tooltip={t(order.maker_status)}
                orderType={order.type}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>
            <ListItemText
              primary={`${order.maker_nick} (${
                order.type
                  ? t(order.currency == 1000 ? 'Swapping Out' : 'Seller')
                  : t(order.currency == 1000 ? 'Swapping In' : 'Buyer')
              })`}
              secondary={t('Order maker')}
            />
          </ListItem>

          <Collapse in={order.is_participant && order.taker_nick !== 'None'}>
            <Divider />
            <ListItem>
              <ListItemText
                primary={`${order.taker_nick} (${
                  order.type
                    ? t(order.currency == 1000 ? 'Swapping In' : 'Buyer')
                    : t(order.currency == 1000 ? 'Swapping Out' : 'Seller')
                })`}
                secondary={t('Order taker')}
              />
              <ListItemAvatar>
                <RobotAvatar
                  avatarClass='smallAvatar'
                  statusColor={statusBadgeColor(order.taker_status)}
                  nickname={order.taker_nick == 'None' ? undefined : order.taker_nick}
                  tooltip={t(order.taker_status)}
                  orderType={order.type === 0 ? 1 : 0}
                  baseUrl={baseUrl}
                />
              </ListItemAvatar>
            </ListItem>
          </Collapse>
          <Divider>
            <Chip label={t('Order Details')} />
          </Divider>

          <Collapse in={order.is_participant}>
            <ListItem>
              <ListItemIcon>
                <Article />
              </ListItemIcon>
              <ListItemText primary={t(order.status_message)} secondary={t('Order status')} />
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
              secondary={order.amount ? 'Amount' : 'Amount Range'}
            />
            {order.currency === 1000 ? (
              <ListItemIcon>
                <IconButton onClick={() => setShowSwapDetails(!showSwapDetails)}>
                  {showSwapDetails ? <ExpandLess /> : <ExpandMore color='primary' />}
                </IconButton>
              </ListItemIcon>
            ) : null}
          </ListItem>

          {order.currency === 1000 ? (
            <Collapse in={showSwapDetails}>
              <List dense={true} sx={{ position: 'relative', bottom: '0.5em' }}>
                <ListItem>
                  <ListItemIcon sx={{ position: 'relative', left: '0.3em' }}>
                    <SendReceiveIcon
                      sx={{ transform: 'scaleX(-1)', width: '0.9em', opacity: 0.7 }}
                      color='secondary'
                    />
                  </ListItemIcon>
                  <Typography variant='body2'>{swap.send}</Typography>
                </ListItem>

                <ListItem>
                  <ListItemIcon sx={{ position: 'relative', left: '0.3em' }}>
                    <SendReceiveIcon
                      sx={{ left: '0.1em', width: '0.9em', opacity: 0.7 }}
                      color='primary'
                    />
                  </ListItemIcon>
                  <Typography variant='body2'>{swap.receive}</Typography>
                </ListItem>
              </List>
            </Collapse>
          ) : null}

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
                  text={order.payment_method}
                />
              }
              secondary={
                order.currency == 1000 ? t('Swap destination') : t('Accepted payment methods')
              }
            />
          </ListItem>
          <Divider />

          {/* If there is live Price and Premium data, show it. Otherwise show the order maker settings */}
          <ListItem>
            <ListItemIcon>
              <PriceChange />
            </ListItemIcon>

            {order.price_now !== undefined ? (
              <ListItemText
                primary={t('{{price}} {{currencyCode}}/BTC - Premium: {{premium}}%', {
                  price: pn(order.price_now),
                  currencyCode,
                  premium: order.premium_now,
                })}
                secondary={t('Price and Premium')}
              />
            ) : null}

            {!order.price_now && order.is_explicit ? (
              <ListItemText primary={pn(order.satoshis)} secondary={t('Amount of Satoshis')} />
            ) : null}

            {!order.price_now && !order.is_explicit ? (
              <ListItemText
                primary={parseFloat(Number(order.premium).toFixed(2)) + '%'}
                secondary={t('Premium over market price')}
              />
            ) : null}
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Numbers />
            </ListItemIcon>
            <Grid container>
              <Grid item xs={4.5}>
                <ListItemText primary={order.id} secondary={t('Order ID')} />
              </Grid>
              <Grid item xs={7.5}>
                <Grid container>
                  <Grid item xs={2}>
                    <ListItemIcon sx={{ position: 'relative', top: '12px', left: '-5px' }}>
                      <HourglassTop />
                    </ListItemIcon>
                  </Grid>
                  <Grid item xs={10}>
                    <ListItemText
                      primary={timerRenderer(order.escrow_duration)}
                      secondary={t('Deposit timer')}
                    ></ListItemText>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </ListItem>

          {/* if order is in a status that does not expire, do not show countdown */}
          <Collapse in={![4, 5, 12, 13, 14, 15, 16, 17, 18].includes(order.status)}>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <AccessTime />
              </ListItemIcon>
              <ListItemText secondary={t('Expires in')}>
                <Countdown date={new Date(order.expires_at)} renderer={countdownRenderer} />
              </ListItemText>
            </ListItem>
            <LinearDeterminate totalSecsExp={order.total_secs_exp} expiresAt={order.expires_at} />
          </Collapse>
        </List>

        {/* If the user has a penalty/limit */}
        {order.penalty !== undefined ? (
          <Grid item xs={12}>
            <Alert severity='warning' sx={{ borderRadius: '0' }}>
              <Countdown date={new Date(order.penalty)} renderer={countdownPenaltyRenderer} />
            </Alert>
          </Grid>
        ) : (
          <></>
        )}

        {!order.is_participant ? (
          <Grid item xs={12}>
            <TakeButton order={order} setOrder={setOrder} baseUrl={baseUrl} hasRobot={hasRobot} />
          </Grid>
        ) : (
          <></>
        )}
      </Grid>
    </Grid>
  );
};

export default OrderDetails;
