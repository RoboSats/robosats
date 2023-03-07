import React from 'react';
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

import { Inventory, Sell, SmartToy, PriceChange, Book } from '@mui/icons-material';

import { pn } from '../../utils';
import { Coordinator, Info } from '../../models';
import { BitcoinSignIcon } from '../Icons';
import { Equalizer } from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  info: Info;
  federation: Coordinator[];
}

const ExchangeDialog = ({ open = false, onClose, federation }: Props): JSX.Element => {
  const { t } = useTranslation();

  // Implement aggregation of federation functions
  // Add counter for coordinators online, coordinators loading, coordinators offline

  return (
    <Dialog open={open} onClose={onClose}>
      {/* <div style={info.loading ? {} : { display: 'none' }}>
        <LinearProgress />
      </div>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Exchange Summary')}
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <Inventory />
            </ListItemIcon>

            <ListItemText primary={info.num_public_buy_orders} secondary={t('Public buy orders')} />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Sell />
            </ListItemIcon>

            <ListItemText
              primary={info.num_public_sell_orders}
              secondary={t('Public sell orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Book />
            </ListItemIcon>

            <ListItemText
              primary={`${pn(info.book_liquidity)} Sats`}
              secondary={t('Book liquidity')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SmartToy />
            </ListItemIcon>

            <ListItemText primary={info.active_robots_today} secondary={t('Today active robots')} />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PriceChange />
            </ListItemIcon>

            <ListItemText
              primary={`${info.last_day_nonkyc_btc_premium}%`}
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
                {pn(info.last_day_volume)}
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
                {pn(info.lifetime_volume)}
                <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
              </div>
            </ListItemText>
          </ListItem>

        </List> */}
      {/* </DialogContent> */}
    </Dialog>
  );
};

export default ExchangeDialog;
