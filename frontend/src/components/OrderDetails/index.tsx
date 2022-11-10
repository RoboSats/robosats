import React from 'react';
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
} from '@mui/material';

import Countdown, { zeroPad } from 'react-countdown';
import RobotAvatar from '../../components/RobotAvatar';

import currencies from '../../../static/assets/currencies.json';
import {
  AccessTime,
  Numbers,
  PriceChange,
  Payments,
  Article,
  HourglassTop,
} from '@mui/icons-material';
import { PaymentStringAsIcons } from '../../components/PaymentMethods';
import { FlagWithProps } from '../Icons';
import LinearDeterminate from './LinearDeterminate';

import { Order } from '../../models';
import { statusBadgeColor, pn } from '../../utils';
import { Page } from '../../basic/NavBar';
import TakeButton from './TakeButton';

interface OrderDetailsProps {
  order: Order;
  setOrder: (state: Order) => void;
  baseUrl: string;
  hasRobot: boolean;
  setPage: (state: Page) => void;
  handleWebln: (order: Order) => void;
}

const OrderDetails = ({
  order,
  setOrder,
  baseUrl,
  setPage,
  hasRobot,
  handleWebln,
}: OrderDetailsProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const currencyCode: string = currencies[`${order.currency}`];

  const AmountString = function () {
    // precision to 8 decimal if currency is BTC otherwise 4 decimals
    const precision = order.currency == 1000 ? 8 : 4;

    let primary = '';
    let secondary = '';
    if (order.has_range && order.amount == null) {
      const minAmount = pn(parseFloat(Number(order.min_amount).toPrecision(precision)));
      const maxAmount = pn(parseFloat(Number(order.max_amount).toPrecision(precision)));
      primary = `${minAmount}-${maxAmount} ${currencyCode}`;
      secondary = t('Amount range');
    } else {
      const amount = pn(parseFloat(Number(order.amount).toPrecision(precision)));
      primary = `${amount} ${currencyCode}`;
      secondary = t('Amount');
    }
    return { primary, secondary };
  };

  // Countdown Renderer callback with condition
  const countdownRenderer = function ({ total, hours, minutes, seconds, completed }) {
    if (completed) {
      // Render a completed state
      return <span> {t('The order has expired')}</span>;
    } else {
      let col = 'inherit';
      const fraction_left = total / 1000 / order.total_secs_exp;
      // Make orange at 25% of time left
      if (fraction_left < 0.25) {
        col = 'orange';
      }
      // Make red at 10% of time left
      if (fraction_left < 0.1) {
        col = 'red';
      }
      // Render a countdown, bold when less than 25%
      return fraction_left < 0.25 ? (
        <b>
          <span style={{ color: col }}>
            {`${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s `}
          </span>
        </b>
      ) : (
        <span style={{ color: col }}>{`${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s `}</span>
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

  return (
    <Grid container spacing={1}>
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
              primary={order.maker_nick + (order.type ? ' ' + t('(Seller)') : ' ' + t('(Buyer)'))}
              secondary={t('Order maker')}
            />
          </ListItem>

          <Collapse in={order.is_participant && order.taker_nick !== 'None'}>
            <Divider />
            <ListItem>
              <ListItemText
                primary={`${order.taker_nick} ${order.type ? t('(Buyer)') : t('(Seller)')}`}
                secondary={t('Order taker')}
              />
              <ListItemAvatar>
                <RobotAvatar
                  avatarClass='smallAvatar'
                  statusColor={statusBadgeColor(order.taker_status)}
                  nickname={order.taker_nick}
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
                <FlagWithProps code={currencyCode} />
              </div>
            </ListItemIcon>
            <ListItemText primary={AmountString().primary} secondary={AmountString().secondary} />
          </ListItem>
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

            <Collapse in={order.price_now !== undefined ? true : false}>
              <ListItemText
                primary={t('{{price}} {{currencyCode}}/BTC - Premium: {{premium}}%', {
                  price: pn(order.price_now),
                  currencyCode: currencyCode,
                  premium: order.premium_now,
                })}
                secondary={t('Price and Premium')}
              />
            </Collapse>

            <Collapse in={!order.price_now && order.is_explicit}>
              <ListItemText primary={pn(order.satoshis)} secondary={t('Amount of Satoshis')} />
            </Collapse>

            <Collapse in={!order.price_now && !order.is_explicit}>
              <ListItemText
                primary={parseFloat(Number(order.premium).toFixed(2)) + '%'}
                secondary={t('Premium over market price')}
              />
            </Collapse>
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
          <Collapse in={![4, 12, 13, 14, 15, 16, 17, 18].includes(order.status)}>
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
        <Collapse in={order.penalty !== undefined ? true : false}>
          <Divider />
          <Grid item xs={12}>
            <Alert severity='warning' sx={{ maxWidth: 360 }}>
              <Countdown date={new Date(order.penalty)} renderer={countdownPenaltyRenderer} />
            </Alert>
          </Grid>
        </Collapse>
      </Grid>

      <Grid item xs={12}>
        <Collapse in={!order.is_participant}>
          <TakeButton
            order={order}
            setOrder={setOrder}
            baseUrl={baseUrl}
            setPage={setPage}
            hasRobot={hasRobot}
            handleWebln={handleWebln}
          />
        </Collapse>
      </Grid>
    </Grid>
  );
};

export default OrderDetails;
