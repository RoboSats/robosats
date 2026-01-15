import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  Snackbar,
  SnackbarContent,
  useTheme,
} from '@mui/material';
import defaultFederation from '../../../../static/federation.json';
import { AppContext, type UseAppStoreType } from '../../../contexts/AppContext';
import { type Event } from 'nostr-tools';
import { GarageContext, UseGarageStoreType } from '../../../contexts/GarageContext';
import NotificationCard from './NotificationCard';
import { Coordinator } from '../../../models';
import { Close } from '@mui/icons-material';
import { systemClient } from '../../../services/System';
import { useNavigate } from 'react-router-dom';
import getSettings from '../../../utils/settings';
import { UseFederationStoreType, FederationContext } from '../../../contexts/FederationContext';

const path =
  getSettings().client === 'mobile'
    ? 'file:///android_asset/static/assets/sounds'
    : '/static/assets/sounds';

const audio = {
  chat: new Audio(`${path}/chat-open.mp3`),
  takerFound: new Audio(`${path}/taker-found.mp3`),
  ding: new Audio(`${path}/locked-invoice.mp3`),
  successful: new Audio(`${path}/successful.mp3`),
};

interface NotificationsDrawerProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

const NotificationsDrawer = ({ show, setShow }: NotificationsDrawerProps): React.JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { page, navigateToPage, client, settings, slotUpdatedAt, notificationsUpdatedAt } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation, notifications } = useContext<UseFederationStoreType>(FederationContext);

  const [messages, setMessages] = useState<Event[]>([]);
  const [openSnak, setOpenSnak] = React.useState<boolean>(false);
  const [snakEvent, setSnakevent] = React.useState<Event>();
  const [_, setLastNotification] = React.useState<number>(0);

  useEffect(() => {
    systemClient.getItem('last_notification').then((result) => {
      setLastNotification(!result || result === '' ? 0 : parseInt(result, 10));
    });
  }, []);

  useEffect(() => {
    if (settings.connection === 'nostr' && !federation.loading) updateMessages();
  }, [settings.connection, slotUpdatedAt, notificationsUpdatedAt]);

  useEffect(() => {
    setShow(false);
  }, [page]);

  const updateMessages = () => {
    setMessages(() => {
      const msgs = [];
      const federationPubKeys = federation.getCoordinators().map((c) => c.nostrHexPubkey);
      const garageKeys = Object.values(garage.slots).map((s) => s.nostrPubKey);

      for (const [robotKey, eventMap] of Object.entries(notifications)) {
        if (garageKeys.includes(robotKey)) {
          for (const [_eventId, [_wrappedEvent, event]] of eventMap.entries()) {
            if (federationPubKeys.includes(event.pubkey)) {
              msgs.push(event);

              setLastNotification((last) => {
                if (last < event.created_at) {
                  setSnakevent(event);
                  systemClient.setItem('last_notification', event.created_at.toString());
                  const orderStatus = event.tags.find((t) => t[0] === 'status')?.[1];
                  if (orderStatus) playSound(parseInt(orderStatus, 10));
                  if (client !== 'mobile') setOpenSnak(true);

                  return event.created_at;
                } else {
                  return last;
                }
              });
            }
          }
        }
      }

      return msgs.sort((a, b) => a.created_at - b.created_at);
    });
  };

  const playSound = (orderStatus: number) => {
    const soundByStatus: Record<number, 'takerFound' | 'ding' | 'successful'> = {
      6: 'takerFound',
      13: 'successful',
      14: 'successful',
      15: 'successful',
    };

    const soundType = soundByStatus[orderStatus] ?? 'ding';
    const sound = audio[soundType];

    void sound.play();
  };

  const handleCloseSnak = () => {
    setOpenSnak(false);
  };

  const handleOnClickSnak = () => {
    const orderId = snakEvent?.tags.find((t) => t[0] === 'order_id')?.[1];
    if (orderId) {
      const nostrHexPubkey = snakEvent.tags.find((t) => t[0] === 'p')?.[1];
      const slot = garage.getSlotByNostrPubKey(nostrHexPubkey ?? '');
      if (slot?.token) {
        setShow(false);
        garage.setCurrentSlot(slot.token);
        navigateToPage(`order/${orderId}`, navigate);
      }
    }
  };

  return (
    <>
      <Drawer anchor='right' open={show} onClose={() => setShow(false)}>
        <Box sx={{ width: 270, height: '100%' }} role='presentation'>
          <List
            sx={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '16px' }}
          >
            {Array.from(messages.entries())
              .sort((a, b) => {
                return b[1].created_at - a[1].created_at;
              })
              .map(([index, event]) => {
                const coordinator: Coordinator = Object.values(defaultFederation).find(
                  (c) => c.nostrHexPubkey === event.pubkey,
                );
                const nostrHexPubkey = event.tags.find((t) => t[0] === 'p')?.[1];
                const slot = garage.getSlotByNostrPubKey(nostrHexPubkey ?? '');

                if (!coordinator) return;

                return (
                  <ListItem disablePadding style={{ margin: 8 }} key={index}>
                    <NotificationCard
                      event={event}
                      coordinator={coordinator}
                      robotHashId={slot?.hashId ?? ''}
                      setShow={setShow}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Box>
      </Drawer>
      <Snackbar
        style={{ margin: '0 8px' }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={openSnak}
        onClose={handleCloseSnak}
        onClick={handleOnClickSnak}
      >
        <SnackbarContent
          style={{
            background: theme.palette.mode === 'light' ? '#d1e6fa' : '#082745',
            color: theme.palette.text.secondary,
          }}
          message={snakEvent?.content}
          action={
            <IconButton size='small' aria-label='close' color='inherit' onClick={handleCloseSnak}>
              <Close fontSize='small' />
            </IconButton>
          }
        />
      </Snackbar>
    </>
  );
};

export default NotificationsDrawer;
