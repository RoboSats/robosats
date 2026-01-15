import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Grid, Paper, Typography } from '@mui/material';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import { type EncryptedChatMessage } from '..';
import {
  type UseFederationStoreType,
  FederationContext,
} from '../../../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../../../contexts/GarageContext';
import { type Order } from '../../../../models';
import getSettings from '../../../../utils/settings';
import { apiClient } from '../../../../services/api';
import { UseAppStoreType, AppContext } from '../../../../contexts/AppContext';

interface Props {
  order: Order;
  takerNick: string;
  takerHashId: string;
  makerHashId: string;
  error: string;
  lastIndex: number;
  messages: EncryptedChatMessage[];
  setMessages: Dispatch<SetStateAction<EncryptedChatMessage[]>>;
  onSendMessage: (content: string) => Promise<object | void>;
  peerPubKey?: string;
  setPeerPubKey: (peerPubKey: string) => void;
  setError: Dispatch<SetStateAction<string>>;
  setLastIndex: Dispatch<SetStateAction<number>>;
}

const audioPath =
  getSettings().client == 'mobile'
    ? 'file:///android_asset/static/assets/sounds'
    : '/static/assets/sounds';

const EncryptedNostrChat: React.FC<Props> = ({
  order,
  takerNick,
  takerHashId,
  makerHashId,
  messages,
  peerPubKey,
  error,
  lastIndex,
  setPeerPubKey,
  setMessages,
  onSendMessage,
  setError,
  setLastIndex,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { notificationsUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { federation, notifications } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const [audio] = useState(() => new Audio(`${audioPath}/chat-open.mp3`));
  const [value, setValue] = useState<string>('');
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [messageCount, setMessageCount] = useState<number>(0);

  useEffect(() => {
    loadPeerPubKey();
  }, []);

  useEffect(() => {
    if (messages.length > messageCount) {
      void audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    const slot = garage.getSlot();
    const nostrSecKey = slot?.nostrSecKey;
    const nostrPubKey = slot?.getRobot()?.nostrPubKey;

    if (nostrPubKey && nostrSecKey) {
      setMessages(() => {
        const robotNotifications = notifications[nostrPubKey] ?? [];
        const chatMessages = robotNotifications
          .values()
          .filter(([_wrapedEvent, event]) => {
            const pubKeysRefs = event.tags.filter((t) => t[0] === 'p');
            const isChatMessage =
              [order.maker_nostr_pubkey, order.taker_nostr_pubkey].includes(event.pubkey) &&
              pubKeysRefs.every((tag) =>
                [order.maker_nostr_pubkey, order.taker_nostr_pubkey].includes(tag[1]),
              );

            return isChatMessage;
          })
          .map(([wrapedEvent, event]) => {
            const userNick =
              event.pubkey === order.maker_nostr_pubkey ? order.maker_nick : order.taker_nick;
            return {
              index: event.created_at,
              encryptedMessage: JSON.stringify(wrapedEvent),
              plainTextMessage: event.content,
              validSignature: true,
              userNick: userNick,
              time: new Date(event.created_at * 1000).toISOString(),
            };
          })
          .toArray();

        const sortedMessages = chatMessages.sort((a, b) => b.index - a.index);

        setLastIndex(sortedMessages[0]?.index ?? 0);

        return sortedMessages;
      });
    }
  }, [notificationsUpdatedAt]);

  const loadPeerPubKey: () => void = () => {
    const shortAlias = garage.getSlot()?.activeOrder?.shortAlias;
    if (!shortAlias) return;

    const url = federation.getCoordinator(shortAlias).url;
    apiClient
      .get(url, `/api/chat/?order_id=${order.id}&offset=${lastIndex}`, {
        tokenSHA256: garage.getSlot()?.getRobot()?.tokenSHA256 ?? '',
      })
      .then((results: object) => {
        if (results != null) {
          setPeerPubKey(results.peer_pubkey.split('\\').join('\n'));
        }
      })
      .catch((error) => {
        setError(error.toString());
      });
  };

  const onButtonClicked = (e: React.FormEvent<HTMLFormElement>): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (!robot) return;

    if (slot?.token && value.includes(slot.token)) {
      alert(
        `Aye! You just sent your own robot robot.token  to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
      );
    } else {
      setWaitingEcho(true);
      onSendMessage(value).finally(() => setWaitingEcho(false));
    }
    setValue('');

    e.preventDefault();
  };

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
    >
      <Grid item>
        <Paper
          elevation={1}
          style={{
            height: '18.42em',
            maxHeight: '18.42em',
            width: '100%',
            overflow: 'auto',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {messages.map((message, index) => {
            const isTaker = takerNick === message.userNick;

            return (
              <li style={{ listStyleType: 'none' }} key={index}>
                <MessageCard
                  message={message}
                  isTaker={isTaker}
                  takerNick={takerNick}
                  takerHashId={takerHashId}
                  makerHashId={makerHashId}
                />
              </li>
            );
          })}
          <div
            style={{ float: 'left', clear: 'both' }}
            ref={(el) => {
              if (messages.length > messageCount) el?.scrollIntoView();
            }}
          />
        </Paper>
        <form noValidate onSubmit={onButtonClicked} style={{ width: '100%' }}>
          <Grid alignItems='stretch' style={{ display: 'flex', width: '100%', marginTop: '8px' }}>
            <TextField
              label={t('Type a message')}
              variant='standard'
              size='small'
              multiline
              maxRows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  onButtonClicked(e);
                }
              }}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              fullWidth={true}
            />
            <Button
              disabled={waitingEcho || !peerPubKey}
              type='submit'
              variant='contained'
              color='primary'
              fullWidth={true}
            >
              {waitingEcho ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    minWidth: '4.68em',
                    width: '4.68em',
                    position: 'relative',
                    left: '1em',
                  }}
                >
                  <div style={{ width: '1.2em' }}>
                    <KeyIcon sx={{ width: '1em' }} />
                  </div>
                  <div style={{ width: '1em', position: 'relative', left: '0.5em' }}>
                    <CircularProgress size={1.1 * theme.typography.fontSize} thickness={5} />
                  </div>
                </div>
              ) : (
                t('Send')
              )}
            </Button>
          </Grid>
          <Typography color='error' variant='caption'>
            {error}
          </Typography>
        </form>
      </Grid>
    </Grid>
  );
};

export default EncryptedNostrChat;
