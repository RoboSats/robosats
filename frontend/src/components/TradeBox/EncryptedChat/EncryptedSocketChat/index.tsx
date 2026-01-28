import React, { useEffect, useLayoutEffect, useState, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { encryptMessage, decryptMessage } from '../../../../pgp';
import { websocketClient, type WebsocketConnection } from '../../../../services/Websocket';
import { apiClient } from '../../../../services/api';
import { GarageContext, type UseGarageStoreType } from '../../../../contexts/GarageContext';

// Icons
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { type EncryptedChatMessage, type ServerMessage, type ChatApiResponse } from '..';
import PrivacyWarningDialog from '../PrivacyWarningDialog';
import { type ParsedFileMessage, parseImageMetadataJson } from '../../../../utils/nip17File';
import { sha256 } from 'js-sha256';
import { type Order } from '../../../../models';
import {
  type UseFederationStoreType,
  FederationContext,
} from '../../../../contexts/FederationContext';
import getSettings from '../../../../utils/settings';
import { Send, AttachFile } from '@mui/icons-material';
import { UseAppStoreType, AppContext } from '../../../../contexts/AppContext';

const audioPath =
  getSettings().client == 'mobile'
    ? 'file:///android_asset/static/assets/sounds'
    : '/static/assets/sounds';

interface Props {
  order: Order;
  status: number;
  userNick: string;
  takerNick: string;
  takerHashId: string;
  makerHashId: string;
  messages: EncryptedChatMessage[];
  setMessages: (
    state: EncryptedChatMessage[] | ((prev: EncryptedChatMessage[]) => EncryptedChatMessage[]),
  ) => void;
  onSendMessage: (
    content: string,
    options?: { skipCoordinator?: boolean },
  ) => Promise<object | void>;
  onSendFile: (file: File) => Promise<void>;
  peerPubKey?: string;
  setPeerPubKey: (peerPubKey: string) => void;
}

const EncryptedSocketChat: React.FC<Props> = ({
  order,
  status,
  userNick,
  takerNick,
  makerHashId,
  takerHashId,
  messages,
  setMessages,
  onSendMessage,
  onSendFile,
  peerPubKey,
  setPeerPubKey,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { slotUpdatedAt, settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [audio] = useState(() => new Audio(`${audioPath}/chat-open.mp3`));
  const [connected, setConnected] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [value, setValue] = useState<string>('');
  const [connection, setConnection] = useState<WebsocketConnection>();
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [receivedIndexes, setReceivedIndexes] = useState<number[]>([]);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [privacyWarningOpen, setPrivacyWarningOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedMsgIndices = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!connected && Boolean(garage.getSlot()?.hashId)) {
      connectWebsocket();
    }
  }, [connected, slotUpdatedAt]);

  // Make sure to not keep reconnecting once status is not Chat
  useEffect(() => {
    if (![9, 10].includes(status)) {
      connection?.close();
      setConnection(undefined);
    }
  }, [status]);

  useEffect(() => {
    loadHistoryFromApi();
  }, []);

  useLayoutEffect(() => {
    // On component unmount close reconnecting-websockets
    return () => {
      connection?.close();
      setConnection(undefined);
    };
  }, []);

  useEffect(() => {
    if (messages.length > messageCount) {
      void audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    if (serverMessages.length === 0) return;

    const newMessages = serverMessages.filter((msg) => !processedMsgIndices.current.has(msg.index));

    if (newMessages.length === 0) {
      setServerMessages([]);
      return;
    }

    newMessages.forEach((msg) => processedMsgIndices.current.add(msg.index));

    newMessages.forEach((msg) => {
      onMessage({ data: JSON.stringify(msg) });
    });

    setServerMessages([]);
  }, [serverMessages]);

  const connectWebsocket = (): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (!slot?.token) return;

    const url = federation.getCoordinator(order.shortAlias).url;
    const protocol = url.includes('https') ? 'wss://' : 'ws://';

    websocketClient
      .open(
        `${url.replace(/^https?:\/\//, protocol)}/ws/chat/${
          order.id
        }/?token_sha256_hex=${sha256(slot?.token)}`,
      )
      .then((connection) => {
        setConnection(connection);
        setConnected(true);

        connection.send(
          JSON.stringify({
            type: 'message',
            message: robot?.pubKey,
            nick: userNick,
          }),
        );

        connection.onMessage((message) => {
          setServerMessages((prev) => [...prev, message as ServerMessage]);
        });
        connection.onClose(() => {
          setConnected(false);
        });
        connection.onError(() => {
          setConnected(false);
        });
      })
      .catch(() => {
        setConnected(false);
      });
  };

  const loadHistoryFromApi = (): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    const coordinator = federation.getCoordinator(order.shortAlias);

    if (!slot?.token || !robot || !coordinator) return;

    apiClient
      .get(coordinator.url, `/api/chat/?order_id=${order.id}&offset=0`, {
        tokenSHA256: robot?.tokenSHA256 ?? '',
      })
      .then((data: unknown) => {
        const results = data as ChatApiResponse;
        if (results != null) {
          if (results.peer_pubkey) {
            setPeerPubKey(results.peer_pubkey.split('\\').join('\n'));
          }
          if (results.peer_connected !== undefined) {
            setPeerConnected(results.peer_connected);
          }

          if (results.messages && Array.isArray(results.messages)) {
            results.messages.forEach((msg: ServerMessage) => {
              if (receivedIndexes.includes(msg.index)) return;
              if (typeof msg.message !== 'string') return;

              if (msg.message.substring(0, 27) === `-----BEGIN PGP MESSAGE-----`) {
                setReceivedIndexes((prev) => [...prev, msg.index]);

                const effectivePeerPubKey =
                  peerPubKey ||
                  (results.peer_pubkey ? results.peer_pubkey.split('\\').join('\n') : undefined);
                if (!effectivePeerPubKey) {
                  console.warn('Cannot decrypt message: peerPubKey not available');
                  return;
                }

                void decryptMessage(
                  msg.message.split('\\').join('\n'),
                  msg.nick === userNick ? robot.pubKey : effectivePeerPubKey,
                  robot.encPrivKey,
                  slot.token,
                ).then((decryptedData) => {
                  let fileMetadata: ParsedFileMessage | undefined;
                  let displayText = String(decryptedData.decryptedMessage);

                  const imgMeta = parseImageMetadataJson(displayText);
                  if (imgMeta) {
                    fileMetadata = imgMeta;
                    displayText = t('[Encrypted Image]');
                  }

                  setMessages((prev: EncryptedChatMessage[]) => {
                    const existingMessage = prev.find(
                      (item: EncryptedChatMessage) => item.index === msg.index,
                    );
                    if (existingMessage != null) return prev;

                    const x: EncryptedChatMessage = {
                      index: msg.index,
                      encryptedMessage: msg.message.split('\\').join('\n'),
                      plainTextMessage: displayText,
                      fileMetadata,
                      validSignature: decryptedData.validSignature,
                      userNick: msg.nick,
                      time: msg.time,
                    };
                    return [...prev, x].sort((a, b) => a.index - b.index);
                  });
                });
              }
            });
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load history from API:', err);
      });
  };

  const onMessage = (message: { data: string }): void => {
    const dataFromServer = JSON.parse(message.data);
    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    if (!robot) return;
    if (dataFromServer != null && !receivedIndexes.includes(dataFromServer.index)) {
      setReceivedIndexes((prev) => [...prev, dataFromServer.index]);
      setPeerConnected(dataFromServer.peer_connected);

      if (typeof dataFromServer.message !== 'string') return;

      // If we receive a public key other than ours (our peer key!)
      if (
        connection != null &&
        dataFromServer.message.substring(0, 36) === `-----BEGIN PGP PUBLIC KEY BLOCK-----` &&
        dataFromServer.message !== robot.pubKey
      ) {
        setPeerPubKey(dataFromServer.message);
        connection.send(
          JSON.stringify({
            type: 'message',
            message: `-----SERVE HISTORY-----`,
            nick: userNick,
          }),
        );
      }
      // If we receive an encrypted message
      else if (dataFromServer.message.substring(0, 27) === `-----BEGIN PGP MESSAGE-----`) {
        if (settings.connection === 'nostr') {
          return;
        }
        if (!slot || !peerPubKey) return;
        void decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.user_nick === userNick ? robot.pubKey : peerPubKey,
          robot.encPrivKey,
          slot.token,
        ).then((decryptedData) => {
          setWaitingEcho(waitingEcho ? decryptedData.decryptedMessage !== lastSent : false);
          setLastSent(decryptedData.decryptedMessage === lastSent ? '----BLANK----' : lastSent);

          let fileMetadata: ParsedFileMessage | undefined;
          let displayText = String(decryptedData.decryptedMessage);

          const imgMeta = parseImageMetadataJson(displayText);
          if (imgMeta) {
            fileMetadata = imgMeta;
            displayText = t('[Encrypted Image]');
          }

          setMessages((prev) => {
            const existingMessage = prev.find((item) => item.index === dataFromServer.index);
            if (existingMessage != null) {
              return prev;
            } else {
              const x: EncryptedChatMessage = {
                index: dataFromServer.index,
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: displayText,
                fileMetadata,
                validSignature: decryptedData.validSignature,
                userNick: dataFromServer.user_nick,
                time: dataFromServer.time,
              };
              return [...prev, x].sort((a, b) => a.index - b.index);
            }
          });
        });
      }
      // We allow plaintext communication. The user must write # to start
      // If we receive an plaintext message
      else if (dataFromServer.message.substring(0, 1) === '#') {
        setMessages((prev: EncryptedChatMessage[]) => {
          const existingMessage = prev.find(
            (item: EncryptedChatMessage) => item.plainTextMessage === dataFromServer.message,
          );
          if (existingMessage != null) {
            return prev;
          } else {
            const x: EncryptedChatMessage = {
              index: prev.length + 0.001,
              encryptedMessage: dataFromServer.message,
              plainTextMessage: dataFromServer.message,
              validSignature: false,
              userNick: dataFromServer.user_nick,
              time: new Date().toString(),
            };
            return [...prev, x].sort((a, b) => a.index - b.index);
          }
        });
      }
    }
  };

  const clearFileInput = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachClick = (): void => {
    setPrivacyWarningOpen(true);
  };

  const handlePrivacyDialogClose = (confirmed: boolean): void => {
    setPrivacyWarningOpen(false);
    if (confirmed) {
      fileInputRef.current?.click();
    }
  };

  const onButtonClicked = (e: React.FormEvent<HTMLFormElement>): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    if (slot?.token !== undefined && value.includes(slot.token)) {
      alert(
        t(
          "Aye! You just sent your own robot robot.token to your peer in chat, that's a catastrophic idea! So bad your message was blocked.",
        ),
      );
      setValue('');
    }
    // If input string contains '#' send unencrypted and unlogged message
    else if (connection != null && value.substring(0, 1) === '#') {
      onSendMessage(value);
      connection.send(
        JSON.stringify({
          type: 'message',
          message: value,
          nick: userNick,
        }),
      );
      setValue('');
    }

    // Else if message is not empty send message
    else if (value !== '') {
      setValue('');

      if (settings.connection === 'nostr') {
        setWaitingEcho(true);
        onSendMessage(value)
          .then(() => {
            setTimeout(() => setWaitingEcho(false), 300);
          })
          .catch((error) => {
            setWaitingEcho(false);
            setError(error?.toString() || 'Failed to send message');
          });
      } else {
        if (!robot || !peerPubKey || !slot?.token) {
          setError('Missing required data for encryption');
          return;
        }
        setWaitingEcho(true);
        setLastSent(value);
        onSendMessage(value, { skipCoordinator: true });
        encryptMessage(value, robot.pubKey, peerPubKey, robot.encPrivKey, slot.token)
          .then((encryptedMessage) => {
            if (connection != null) {
              connection.send(
                JSON.stringify({
                  type: 'message',
                  message: String(encryptedMessage).split('\n').join('\\'),
                  nick: userNick,
                }),
              );
            }
          })
          .catch((error) => {
            setWaitingEcho(false);
            setError(error.toString());
          });
      }
    }
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
        <ChatHeader connected={connected && Boolean(peerPubKey)} peerConnected={peerConnected} />
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
            const userConnected = message.userNick === userNick ? connected : peerConnected;

            return (
              <li style={{ listStyleType: 'none' }} key={index}>
                <MessageCard
                  message={message}
                  isTaker={isTaker}
                  userConnected={userConnected}
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
              fullWidth
            />
            <input
              type='file'
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const maxSize = 10 * 1024 * 1024; // 10MB
                  if (file.size > maxSize) {
                    setError(t('File too large. Maximum size is 10MB.'));
                    clearFileInput();
                    return;
                  }
                  if (!file.type.startsWith('image/')) {
                    setError(t('Only image files are allowed.'));
                    clearFileInput();
                    return;
                  }
                  setUploading(true);
                  onSendFile(file)
                    .catch((err) => setError(String(err)))
                    .finally(() => {
                      setUploading(false);
                      clearFileInput();
                    });
                }
              }}
            />
            <Tooltip title={peerPubKey === undefined ? t('Waiting for peer...') : ''}>
              <span>
                <IconButton
                  disabled={!connected || uploading || peerPubKey === undefined}
                  onClick={handleAttachClick}
                  color='primary'
                >
                  {uploading ? <CircularProgress size={24} /> : <AttachFile />}
                </IconButton>
              </span>
            </Tooltip>
            <Button
              disabled={!connected || waitingEcho || peerPubKey === undefined}
              type='submit'
              variant='contained'
              color='primary'
              loading={waitingEcho}
            >
              <Send />
            </Button>
          </Grid>
          <Typography color='error' variant='caption'>
            {error}
          </Typography>
        </form>
      </Grid>
      <PrivacyWarningDialog open={privacyWarningOpen} onClose={handlePrivacyDialogClose} />
    </Grid>
  );
};

export default EncryptedSocketChat;
