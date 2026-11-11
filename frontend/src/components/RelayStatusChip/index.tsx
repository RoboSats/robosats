import React, { useContext } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Lan } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { WebsocketState } from '../../services/Websocket';

const RelayStatusChip = (): React.JSX.Element | null => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();

  if (settings.connection !== 'nostr') return null;

  const relayStates = federation.roboPool.getConnectionStates();
  const relayTotal = Object.keys(relayStates).length;
  if (relayTotal === 0) return null;

  const relayConnected = Object.values(relayStates).filter(
    (state) => state === WebsocketState.OPEN,
  ).length;
  const everConnected = federation.roboPool.hasEverConnected();
  const allRelaysDown = relayConnected === 0 && everConnected;
  const relaysConnecting = relayConnected === 0 && !everConnected;

  return (
    <Tooltip
      title={
        allRelaysDown
          ? t('All Nostr relays disconnected')
          : relaysConnecting
            ? t('Connecting to Nostr relays')
            : t('Nostr relays connected')
      }
    >
      <Chip
        icon={<Lan />}
        size='small'
        variant='outlined'
        color={allRelaysDown ? 'error' : relayConnected === relayTotal ? 'success' : 'warning'}
        label={`${relayConnected}/${relayTotal}`}
        sx={{
          flexShrink: 0,
          ...(allRelaysDown && {
            animation: 'robosats-relay-blink 1.2s ease-in-out infinite',
            '@keyframes robosats-relay-blink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.25 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }),
        }}
      />
    </Tooltip>
  );
};

export default RelayStatusChip;
