import React, { useContext, useEffect, useMemo, useState } from 'react';
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
import { FederationContext } from '../../contexts/FederationContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExchangeDialog = ({ open = false, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { federation, coordinatorUpdatedAt, federationUpdatedAt } = useContext(FederationContext);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    const loadedCoordinators =
      federation.exchange.enabledCoordinators - federation.exchange.loadingCoordinators;
    setLoadingProgress((loadedCoordinators / federation.exchange.enabledCoordinators) * 100);
  }, [open, coordinatorUpdatedAt, federationUpdatedAt]);

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
              primary={federation.exchange.onlineCoordinators}
              secondary={t('Online RoboSats coordinators')}
            />
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <Groups3 />
            </ListItemIcon>

            <ListItemText
              primary={federation.exchange.enabledCoordinators}
              secondary={t('Enabled RoboSats coordinators')}
            />
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <Inventory />
            </ListItemIcon>

            <ListItemText
              primary={federation.exchange.info.num_public_buy_orders}
              secondary={t('Public buy orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Sell />
            </ListItemIcon>

            <ListItemText
              primary={federation.exchange.info.num_public_sell_orders}
              secondary={t('Public sell orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Book />
            </ListItemIcon>

            <ListItemText
              primary={`${pn(federation.exchange.info.book_liquidity)} Sats`}
              secondary={t('Book liquidity')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SmartToy />
            </ListItemIcon>

            <ListItemText
              primary={federation.exchange.info.active_robots_today}
              secondary={t('Today active robots')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PriceChange />
            </ListItemIcon>

            <ListItemText
              primary={`${String(
                federation.exchange.info.last_day_nonkyc_btc_premium.toPrecision(3),
              )}%`}
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
                {pn(federation.exchange.info.last_day_volume.toFixed(8))}
                <BitcoinSignIcon sx={{ width: '0.6em', height: '0.6em' }} color='text.secondary' />
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
                {pn(federation.exchange.info.lifetime_volume.toFixed(8))}
                <BitcoinSignIcon sx={{ width: '0.6em', height: '0.6em' }} color='text.secondary' />
              </div>
            </ListItemText>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeDialog;
