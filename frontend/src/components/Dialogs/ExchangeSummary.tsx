import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  Grid,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
  LinearProgress,
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BookIcon from '@mui/icons-material/Book';
import LinkIcon from '@mui/icons-material/Link';

import { pn } from '../../utils';
import { Info } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
  info: Info;
}

const ExchangeSummaryDialog = ({ open = false, onClose, info }: Props): JSX.Element => {
  const { t } = useTranslation();
  if (info.current_swap_fee_rate === null || info.current_swap_fee_rate === undefined) {
    info.current_swap_fee_rate = 0;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={info.loading ? {} : { display: 'none' }}>
        <LinearProgress />
      </div>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Exchange Summary')}
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>

            <ListItemText primary={info.num_public_buy_orders} secondary={t('Public buy orders')} />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SellIcon />
            </ListItemIcon>

            <ListItemText
              primary={info.num_public_sell_orders}
              secondary={t('Public sell orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>

            <ListItemText
              primary={`${pn(info.book_liquidity)} Sats`}
              secondary={t('Book liquidity')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SmartToyIcon />
            </ListItemIcon>

            <ListItemText primary={info.active_robots_today} secondary={t('Today active robots')} />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PriceChangeIcon />
            </ListItemIcon>

            <ListItemText
              primary={`${info.last_day_nonkyc_btc_premium}%`}
              secondary={t('24h non-KYC bitcoin premium')}
            />
          </ListItem>

          <Divider />
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeSummaryDialog;
