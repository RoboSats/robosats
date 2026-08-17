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
  const thirdParty = (thirdParties as Record<string, { shortAlias?: string }>)[coordinatorAlias];
  const baseUrl = (coordinator as unknown as Record<string, unknown>)?.[network ?? 'mainnet'] as
    Record<string, string> | undefined;
  const resolvedBaseUrl = baseUrl?.[origin] ?? '';

  return order ? (
    <Paper elevation={12} style={{ padding: 10, width: 150 }}>
      <Grid container sx={{ justifyContent: 'space-between' }}>
        <Grid size={3}>
          <Grid container sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <RobotAvatar
              orderType={order.type}
              statusColor={
                settings.connection === 'api'
                  ? statusBadgeColor(order.maker_status ?? '')
                  : undefined
              }
              tooltip={t(order.maker_status ?? '')}
              baseUrl={resolvedBaseUrl}
              small={true}
              hashId={order.maker_hash_id ?? undefined}
              coordinatorShortAlias={
                thirdParty?.shortAlias ??
                (coordinator?.federated ? coordinator?.shortAlias : undefined)
              }
            />
          </Grid>
        </Grid>
        <Grid size={8}>
          <Grid
            container
            sx={{ alignItems: 'flex-start', justifyContent: 'center', flexDirection: 'column' }}
          >
            <Box>
              <Grid
                container

                sx={{
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  flexDirection: 'column',
                }}
              >
                <Grid size={12}>
                  {amountToString(
                    String(order.amount ?? 0),
                    order.has_range,
                    Number(order.min_amount ?? 0),
                    Number(order.max_amount ?? 0),
                  )}{' '}
                  {(currencyDict as Record<string, string>)[(order.currency ?? 0).toString()]}
                </Grid>
                <Grid size={12}>
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
