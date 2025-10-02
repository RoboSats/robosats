import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  IconButton,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { pn, saveAsJson } from '../../utils';
import RobotAvatar from '../RobotAvatar';

// Icons
import {
  PriceChange,
  LockOpen,
  AccountBalance,
  Route,
  AccountBox,
  Link,
} from '@mui/icons-material';
import {
  RoboSatsNoTextIcon,
  SendReceiveIcon,
  BitcoinIcon,
  ExportIcon,
  FlagWithProps,
} from '../Icons';
import { type TradeCoordinatorSummary, type TradeRobotSummary } from '../../models/Order.model';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';

interface Props {
  robotNick: string;
  isMaker: boolean;
  makerHashId: string;
  takerHashId: string;
  currencyCode: string;
  coordinatorLongAlias: string;
  makerSummary: TradeRobotSummary;
  takerSummary: TradeRobotSummary;
  platformSummary: TradeCoordinatorSummary;
  orderId: number;
}

const TradeSummary = ({
  robotNick,
  isMaker,
  makerHashId,
  takerHashId,
  currencyCode,
  coordinatorLongAlias,
  makerSummary,
  takerSummary,
  platformSummary,
  orderId,
}: Props): React.JSX.Element => {
  const { client } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const theme = useTheme();

  const [buttonValue, setButtonValue] = useState<number>(isMaker ? 0 : 2);
  const userSummary = buttonValue === 0 ? makerSummary : takerSummary;

  const onClickExport = function (): void {
    const summary = {
      coordinator: coordinatorLongAlias,
      order_id: orderId,
      currency: currencyCode,
      robot: robotNick,
      role: isMaker ? 'maker' : 'taker',
      maker: makerSummary,
      taker: takerSummary,
      platform: platformSummary,
    };
    saveAsJson(`order${orderId}-summary.json`, summary, client);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '0.3em',
        padding: '0.5em',
        width: '19em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography align='center' color='text.secondary'>
          {t('Trade Summary')}
        </Typography>
        <Tooltip enterTouchDelay={250} title={t('Export trade summary')}>
          <IconButton color='primary' onClick={onClickExport}>
            <ExportIcon sx={{ width: '0.8em', height: '0.8em' }} />
          </IconButton>
        </Tooltip>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ToggleButtonGroup size='small' value={buttonValue} exclusive>
          <ToggleButton
            value={0}
            disableRipple={true}
            onClick={() => {
              setButtonValue(0);
            }}
          >
            <RobotAvatar
              style={{ height: '1.5em', width: '1.5em' }}
              hashId={makerHashId}
              small={true}
            />
            &nbsp;
            {t('Maker')}
          </ToggleButton>
          <ToggleButton
            value={1}
            disableRipple={true}
            onClick={() => {
              setButtonValue(1);
            }}
          >
            <RoboSatsNoTextIcon />
          </ToggleButton>
          <ToggleButton
            value={2}
            disableRipple={true}
            onClick={() => {
              setButtonValue(2);
            }}
          >
            {t('Taker')}
            &nbsp;
            <RobotAvatar
              avatarClass='smallAvatar'
              style={{ height: '1.5em', width: '1.5em' }}
              hashId={takerHashId}
              small={true}
            />
          </ToggleButton>
        </ToggleButtonGroup>
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
                  <div style={{ position: 'relative', left: '0.1em', top: '0.1em' }}>
                    {userSummary.is_buyer ? (
                      <SendReceiveIcon
                        sx={{ transform: 'scaleX(-1)', height: '0.7em', width: '0.7em' }}
                        color='secondary'
                      />
                    ) : (
                      <SendReceiveIcon sx={{ height: '0.7em', width: '0.7em' }} color='primary' />
                    )}
                  </div>
                }
              >
                <AccountBox
                  sx={{ position: 'relative', left: '-0.1em', width: '1.5em', height: '1.5em' }}
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
                (userSummary.is_buyer ? pn(userSummary.sent_fiat) : pn(userSummary.received_fiat)) +
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
                tradeFeePercent: parseFloat((userSummary.trade_fee_percent * 100).toPrecision(3)),
              })}
              secondary={'Trade fee'}
            />
          </ListItem>

          {userSummary.is_swap ? (
            <ListItem>
              <ListItemIcon>
                <Link />
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
              <LockOpen color='success' />
            </ListItemIcon>
            <ListItemText
              primary={t('{{bondSats}} Sats ({{bondPercent}}%)', {
                bondSats: pn(userSummary.bond_size_sats),
                bondPercent: userSummary.bond_size_percent,
              })}
              secondary={buttonValue === 0 ? t('Maker bond') : t('Taker bond')}
            />
            <ListItemText
              sx={{ color: theme.palette.success.main }}
              primary={<b>{t('Unlocked')}</b>}
            />
          </ListItem>
        </List>
      </div>
      {/* Platform Summary */}
      <div style={{ display: buttonValue === 1 ? '' : 'none' }}>
        <List dense={true}>
          <ListItem>
            <ListItemIcon>
              <AccountBalance />
            </ListItemIcon>
            <ListItemText
              primary={t('{{revenueSats}} Sats', {
                revenueSats: pn(platformSummary.trade_revenue_sats),
              })}
              secondary={t('Coordinator trade revenue')}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Route />
            </ListItemIcon>
            <ListItemText
              primary={t('{{routingFeeSats}} Sats', {
                routingFeeSats: pn(platformSummary.routing_budget_sats),
              })}
              secondary={t('Routing budget')}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <PriceChange />
            </ListItemIcon>
            <ListItemText
              primary={`${pn(
                platformSummary.contract_exchange_rate.toPrecision(7),
              )} ${currencyCode}/BTC`}
              secondary={t('Contract exchange rate')}
            />
          </ListItem>
        </List>
      </div>
    </Box>
  );
};

export default TradeSummary;
