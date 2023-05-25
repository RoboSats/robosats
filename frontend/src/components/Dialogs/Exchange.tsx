import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
  LinearProgress,
} from '@mui/material';

import {
  Inventory,
  Sell,
  SmartToy,
  PriceChange,
  Book,
  Groups3,
  Equalizer,
} from '@mui/icons-material';

import { pn } from '../../utils';
import { BitcoinSignIcon } from '../Icons';
import { AppContext, type AppContextProps } from '../../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExchangeDialog = ({ open = false, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { exchange } = useContext<AppContextProps>(AppContext);

  const loadingProgress = useMemo(() => {
    return (exchange.onlineCoordinators / exchange.totalCoordinators) * 100;
  }, [exchange.onlineCoordinators, exchange.totalCoordinators]);

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={loadingProgress < 100 ? {} : { display: 'none' }}>
        <LinearProgress variant='determinate' value={loadingProgress} />
      </div>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Exchange Summary')}
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <Groups3 />
            </ListItemIcon>

            <ListItemText
              primary={exchange.onlineCoordinators}
              secondary={t('Online RoboSats coordinators')}
            />
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <Groups3 />
            </ListItemIcon>

            <ListItemText
              primary={exchange.totalCoordinators}
              secondary={t('Enabled RoboSats coordinators')}
            />
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <Inventory />
            </ListItemIcon>

            <ListItemText
              primary={exchange.info.num_public_buy_orders}
              secondary={t('Public buy orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Sell />
            </ListItemIcon>

            <ListItemText
              primary={exchange.info.num_public_sell_orders}
              secondary={t('Public sell orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Book />
            </ListItemIcon>

            <ListItemText
              primary={`${pn(exchange.info.book_liquidity)} Sats`}
              secondary={t('Book liquidity')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SmartToy />
            </ListItemIcon>

            <ListItemText
              primary={exchange.info.active_robots_today}
              secondary={t('Today active robots')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PriceChange />
            </ListItemIcon>

            <ListItemText
              primary={`${exchange.info.last_day_nonkyc_btc_premium.toPrecision(3)}%`}
              secondary={t('24h non-KYC bitcoin premium')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Equalizer />
            </ListItemIcon>
            <ListItemText secondary={t('24h contracted volume')}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {pn(exchange.info.last_day_volume)}
                <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
              </div>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Equalizer />
            </ListItemIcon>
            <ListItemText secondary={t('Lifetime contracted volume')}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {pn(exchange.info.lifetime_volume)}
                <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
              </div>
            </ListItemText>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeDialog;
