import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { pn } from '../utils/prettyNumbers';
import { saveAsJson } from '../utils/saveFile';

// Icons
import FlagWithProps from './FlagWithProps';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RouteIcon from '@mui/icons-material/Route';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LinkIcon from '@mui/icons-material/Link';
import { RoboSatsNoTextIcon, SendReceiveIcon, BitcoinIcon } from './Icons';

interface Item {
  id: string;
  name: string;
}

interface Props {
  isMaker: boolean;
  makerNick: string;
  takerNick: string;
  currencyCode: string;
  makerSummary: Record<string, Item>;
  takerSummary: Record<string, Item>;
  platformSummary: Record<string, Item>;
  orderId: number;
}

const TradeSummary = ({
  isMaker,
  makerNick,
  takerNick,
  currencyCode,
  makerSummary,
  takerSummary,
  platformSummary,
  orderId,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [buttonValue, setButtonValue] = useState<number>(isMaker ? 0 : 2);
  const userSummary = buttonValue == 0 ? makerSummary : takerSummary;
  const contractTimestamp = new Date(platformSummary.contract_timestamp);
  const total_time = platformSummary.contract_total_time;
  const hours = parseInt(total_time / 3600);
  const mins = parseInt((total_time - hours * 3600) / 60);
  const secs = parseInt(total_time - hours * 3600 - mins * 60);

  return (
    <Grid item xs={12} align='center'>
      <Accordion
        defaultExpanded={true}
        elevation={0}
        sx={{ width: 322, position: 'relative', right: 8 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ width: 28 }} color='primary' />}>
          <Typography sx={{ flexGrow: 1 }} color='text.secondary'>
            {t('Trade Summary')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div
            style={{
              position: 'relative',
              left: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <ToggleButtonGroup size='small' value={buttonValue} exclusive>
              <ToggleButton value={0} disableRipple={true} onClick={() => setButtonValue(0)}>
                <Avatar
                  className='flippedSmallAvatar'
                  sx={{ height: 24, width: 24 }}
                  alt={makerNick}
                  src={window.location.origin + '/static/assets/avatars/' + makerNick + '.png'}
                />
                &nbsp;
                {t('Maker')}
              </ToggleButton>
              <ToggleButton value={1} disableRipple={true} onClick={() => setButtonValue(1)}>
                <RoboSatsNoTextIcon />
              </ToggleButton>
              <ToggleButton value={2} disableRipple={true} onClick={() => setButtonValue(2)}>
                {t('Taker')}
                &nbsp;
                <Avatar
                  className='smallAvatar'
                  sx={{ height: 28, width: 28 }}
                  alt={takerNick}
                  src={window.location.origin + '/static/assets/avatars/' + takerNick + '.png'}
                />
              </ToggleButton>
            </ToggleButtonGroup>
            <Tooltip enterTouchDelay={250} title={t('Save trade summary as file')}>
              <span>
                <IconButton
                  color='primary'
                  onClick={() =>
                    saveAsJson(`order${orderId}-summary.json`, {
                      order_id: orderId,
                      currency: currencyCode,
                      maker: makerSummary,
                      taker: takerSummary,
                      platform: platformSummary,
                    })
                  }
                >
                  <DownloadIcon sx={{ width: 26, height: 26 }} />
                </IconButton>
              </span>
            </Tooltip>
          </div>
          {/* Maker/Taker Summary */}
          <div style={{ display: [0, 2].includes(buttonValue) ? '' : 'none' }}>
            <List dense={true}>
              <ListItem>
                <ListItemIcon>
                  <Badge
                    overlap='circular'
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    badgeContent={
                      <div style={{ position: 'relative', left: '3px', top: '2px' }}>
                        {userSummary.is_buyer ? (
                          <SendReceiveIcon
                            sx={{ transform: 'scaleX(-1)', height: '18px', width: '18px' }}
                            color='secondary'
                          />
                        ) : (
                          <SendReceiveIcon sx={{ height: '18px', width: '18px' }} color='primary' />
                        )}
                      </div>
                    }
                  >
                    <AccountBoxIcon
                      sx={{ position: 'relative', left: -2, width: 28, height: 28 }}
                    />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={userSummary.is_buyer ? t('Buyer') : t('Seller')}
                  secondary={t('User role')}
                />

                <ListItemIcon>
                  <div
                    style={{
                      position: 'relative',
                      left: 15,
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
                <ListItemText
                  primary={
                    (userSummary.is_buyer
                      ? pn(userSummary.sent_fiat)
                      : pn(userSummary.received_fiat)) +
                    ' ' +
                    currencyCode
                  }
                  secondary={userSummary.is_buyer ? t('Sent') : t('Received')}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <BitcoinIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    pn(userSummary.is_buyer ? userSummary.received_sats : userSummary.sent_sats) +
                    ' Sats'
                  }
                  secondary={userSummary.is_buyer ? 'BTC received' : 'BTC sent'}
                />

                <ListItemText
                  primary={t('{{tradeFeeSats}} Sats ({{tradeFeePercent}}%)', {
                    tradeFeeSats: pn(userSummary.trade_fee_sats),
                    tradeFeePercent: parseFloat(
                      (userSummary.trade_fee_percent * 100).toPrecision(3),
                    ),
                  })}
                  secondary={'Trade fee'}
                />
              </ListItem>

              {userSummary.is_swap ? (
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('{{swapFeeSats}} Sats ({{swapFeePercent}}%)', {
                      swapFeeSats: pn(userSummary.swap_fee_sats),
                      swapFeePercent: userSummary.swap_fee_percent,
                    })}
                    secondary={t('Onchain swap fee')}
                  />
                  <ListItemText
                    primary={t('{{miningFeeSats}} Sats', {
                      miningFeeSats: pn(userSummary.mining_fee_sats),
                    })}
                    secondary={t('Mining fee')}
                  />
                </ListItem>
              ) : null}

              <ListItem>
                <ListItemIcon>
                  <LockOpenIcon color='success' />
                </ListItemIcon>
                <ListItemText
                  primary={t('{{bondSats}} Sats ({{bondPercent}}%)', {
                    bondSats: pn(userSummary.bond_size_sats),
                    bondPercent: userSummary.bond_size_percent,
                  })}
                  secondary={buttonValue === 0 ? t('Maker bond') : t('Taker bond')}
                />
                <ListItemText sx={{ color: '#2e7d32' }} primary={<b>{t('Unlocked')}</b>} />
              </ListItem>
            </List>
          </div>
          {/* Platform Summary */}
          <div style={{ display: buttonValue == 1 ? '' : 'none' }}>
            <List dense={true}>
              <ListItem>
                <ListItemIcon>
                  <AccountBalanceIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('{{revenueSats}} Sats', {
                    revenueSats: pn(platformSummary.trade_revenue_sats),
                  })}
                  secondary={t('Platform trade revenue')}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <RouteIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('{{routingFeeSats}} MiliSats', {
                    routingFeeSats: pn(platformSummary.routing_fee_sats),
                  })}
                  secondary={t('Platform covered routing fee')}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <PriceChangeIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${pn(
                    platformSummary.contract_exchange_rate.toPrecision(7),
                  )} ${currencyCode}/BTC`}
                  secondary={t('Contract exchange rate')}
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary={format(contractTimestamp, 'do LLL HH:mm:ss')}
                  secondary={t('Timestamp')}
                />
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${String(hours).padStart(2, '0')}:${String(mins).padStart(
                    2,
                    '0',
                  )}:${String(secs).padStart(2, '0')}`}
                  secondary={t('Completed in')}
                />
              </ListItem>
            </List>
          </div>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
};

export default TradeSummary;
