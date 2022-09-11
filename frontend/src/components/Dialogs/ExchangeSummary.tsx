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
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BookIcon from '@mui/icons-material/Book';
import LinkIcon from '@mui/icons-material/Link';

import { pn } from '../../utils/prettyNumbers';

interface Props {
  isOpen: boolean;
  handleClickCloseExchangeSummary: () => void;
  numPublicBuyOrders: number;
  numPublicSellOrders: number;
  bookLiquidity: number;
  activeRobotsToday: number;
  lastDayNonkycBtcPremium: number;
  makerFee: number;
  takerFee: number;
  swapFeeRate: number;
}

const ExchangeSummaryDialog = ({
  isOpen,
  handleClickCloseExchangeSummary,
  numPublicBuyOrders,
  numPublicSellOrders,
  bookLiquidity,
  activeRobotsToday,
  lastDayNonkycBtcPremium,
  makerFee,
  takerFee,
  swapFeeRate,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  if (swapFeeRate === null || swapFeeRate === undefined) {
    swapFeeRate = 0;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClickCloseExchangeSummary}
      aria-labelledby='exchange-summary-title'
      aria-describedby='exchange-summary-description'
    >
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Exchange Summary')}
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={numPublicBuyOrders}
              secondary={t('Public buy orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SellIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={numPublicSellOrders}
              secondary={t('Public sell orders')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={`${pn(bookLiquidity)} Sats`}
              secondary={t('Book liquidity')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SmartToyIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={activeRobotsToday}
              secondary={t('Today active robots')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PriceChangeIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={`${lastDayNonkycBtcPremium}%`}
              secondary={t('24h non-KYC bitcoin premium')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PercentIcon />
            </ListItemIcon>

            <Grid container>
              <Grid item xs={6}>
                <ListItemText
                  primaryTypographyProps={{ fontSize: '14px' }}
                  secondaryTypographyProps={{ fontSize: '12px' }}
                  secondary={t('Maker fee')}
                >
                  {(makerFee * 100).toFixed(3)}%
                </ListItemText>
              </Grid>

              <Grid item xs={6}>
                <ListItemText
                  primaryTypographyProps={{ fontSize: '14px' }}
                  secondaryTypographyProps={{ fontSize: '12px' }}
                  secondary={t('Taker fee')}
                >
                  {(takerFee * 100).toFixed(3)}%
                </ListItemText>
              </Grid>
            </Grid>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={`${swapFeeRate.toPrecision(3)}%`}
              secondary={t('Current onchain payout fee')}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeSummaryDialog;
