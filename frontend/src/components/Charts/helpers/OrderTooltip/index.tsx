import React, { useContext } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import { type PublicOrder } from '../../../../models';
import RobotAvatar from '../../../RobotAvatar';
import { amountToString, statusBadgeColor } from '../../../../utils';
import currencyDict from '../../../../../static/assets/currencies.json';
import { PaymentStringAsIcons } from '../../../PaymentMethods';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../../../../contexts/AppContext';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../../contexts/FederationContext';
import thirdParties from '../../../../../static/thirdparties.json';

interface OrderTooltipProps {
  order: PublicOrder;
}

const OrderTooltip: React.FC<OrderTooltipProps> = ({ order }) => {
  const { settings, origin } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();

  const coordinatorAlias = order?.coordinatorShortAlias ?? '';
  const network = settings.network;
  const coordinator = federation.getCoordinator(coordinatorAlias);
  const thirdParty = thirdParties[coordinatorAlias];
  const baseUrl = coordinator?.[network]?.[origin] ?? '';

  return order ? (
    <Paper elevation={12} style={{ padding: 10, width: 150 }}>
      <Grid container justifyContent='space-between'>
        <Grid item xs={3}>
          <Grid container justifyContent='center' alignItems='center'>
            <RobotAvatar
              orderType={order.type}
              statusColor={
                settings.connection === 'api' ? statusBadgeColor(order.maker_status) : undefined
              }
              tooltip={t(order.maker_status)}
              baseUrl={baseUrl}
              small={true}
              hashId={order.maker_hash_id}
              coordinatorShortAlias={
                thirdParty?.shortAlias ??
                (coordinator?.federated ? coordinator?.shortAlias : undefined)
              }
            />
          </Grid>
        </Grid>
        <Grid item xs={8}>
          <Grid container direction='column' justifyContent='center' alignItems='flex-start'>
            <Box>
              <Grid
                container
                direction='column'
                justifyContent='flex-start'
                alignItems='flex-start'
              >
                <Grid item xs={12}>
                  {amountToString(
                    order.amount,
                    order.has_range,
                    order.min_amount,
                    order.max_amount,
                  )}{' '}
                  {currencyDict[order.currency]}
                </Grid>
                <Grid item xs={12}>
                  <PaymentStringAsIcons
                    othersText={t('Others')}
                    verbose={true}
                    size={20}
                    text={order.payment_method}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  ) : (
    <></>
  );
};

export default OrderTooltip;
