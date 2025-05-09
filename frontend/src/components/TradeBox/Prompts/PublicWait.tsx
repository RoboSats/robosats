import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Typography,
  Tooltip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import currencies from '../../../../static/assets/currencies.json';

import { type Order } from '../../../models';
import { PauseCircle, Storefront, Percent } from '@mui/icons-material';

interface PublicWaitPrompProps {
  order: Order;
  pauseLoading: boolean;
  onClickPauseOrder: () => void;
}

export const PublicWaitPrompt = ({
  order,
  pauseLoading,
  onClickPauseOrder,
}: PublicWaitPrompProps): React.JSX.Element => {
  const { t } = useTranslation();
  const currencyCode = currencies[order.currency.toString()];

  const depositHoursMinutes = function (): {
    deposit_timer_hours: number;
    deposit_timer_minutes: number;
  } {
    const hours = Math.floor(order.escrow_duration / 3600);
    const minutes = Math.floor((order.escrow_duration - hours * 3600) / 60);
    const dict = { deposit_timer_hours: hours, deposit_timer_minutes: minutes };
    return dict;
  };

  return (
    <List dense={true}>
      <Divider />

      <ListItem>
        <Typography variant='body2' align='left'>
          {t(
            'Be patient while robots check the book. This box will ring 🔊 once a robot takes your order, then you will have {{deposit_timer_hours}}h {{deposit_timer_minutes}}m to reply. If you do not reply, you risk losing your bond.',
            depositHoursMinutes(),
          )}
        </Typography>
      </ListItem>

      <ListItem>
        <Typography variant='body2' align='left'>
          {t('If the order expires untaken, your bond will return to you (no action needed).')}
        </Typography>
      </ListItem>

      <Divider />

      <Grid container>
        <Grid item xs={10}>
          <ListItem>
            <ListItemIcon>
              <Storefront />
            </ListItemIcon>
            <ListItemText
              primary={order.num_similar_orders}
              secondary={t('Public orders for {{currencyCode}}', {
                currencyCode,
              })}
            />
          </ListItem>
        </Grid>

        <Grid item xs={2}>
          <div style={{ position: 'relative', top: '0.5em', right: '1em' }}>
            <Tooltip
              placement='top'
              enterTouchDelay={500}
              enterDelay={700}
              enterNextDelay={2000}
              title={t('Pause the public order')}
            >
              <div>
                <LoadingButton loading={pauseLoading} color='primary' onClick={onClickPauseOrder}>
                  <PauseCircle sx={{ width: '1.6em', height: '1.6em' }} />
                </LoadingButton>
              </div>
            </Tooltip>
          </div>
        </Grid>
      </Grid>

      <Divider />
      <ListItem>
        <ListItemIcon>
          <Percent />
        </ListItemIcon>
        <ListItemText
          primary={`${t('Premium rank')} ${Math.floor(order.premium_percentile * 100)}%`}
          secondary={t('Among public {{currencyCode}} orders (higher is cheaper)', {
            currencyCode,
          })}
        />
      </ListItem>
    </List>
  );
};

export default PublicWaitPrompt;
