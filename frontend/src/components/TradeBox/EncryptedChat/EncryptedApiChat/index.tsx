import React, { Dispatch, SetStateAction, useContext, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Grid, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { decryptMessage } from '../../../../pgp';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { AttachFile } from '@mui/icons-material';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { type EncryptedChatMessage, type ServerMessage, type ChatApiResponse } from '..';
import PrivacyWarningDialog from '../PrivacyWarningDialog';
import { type ParsedFileMessage, parseImageMetadataJson } from '../../../../utils/nip17File';
import { apiClient } from '../../../../services/api';
import {
  type UseFederationStoreType,
  FederationContext,
} from '../../../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../../../contexts/GarageContext';
import { type Order } from '../../../../models';
import getSettings from '../../../../utils/settings';

interface Props {
  order: Order;
  userNick: string;
  takerNick: string;
  takerHashId: string;
  makerHashId: string;
  chatOffset: number;
  error: string;
  lastIndex: number;
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
  setError: Dispatch<SetStateAction<string>>;
  setLastIndex: Dispatch<SetStateAction<number>>;
}

const audioPath =
  getSettings().client == 'mobile'
    ? 'file:///android_asset/static/assets/sounds'
    : '/static/assets/sounds';

const EncryptedApiChat: React.FC<Props> = ({
  order,
  userNick,
  takerNick,
  takerHashId,
  makerHashId,
  chatOffset,
  messages,
  peerPubKey,
  error,
  lastIndex,
  setPeerPubKey,
  setMessages,
  onSendMessage,
  onSendFile,
  setError,
  setLastIndex,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const [audio] = useState(() => new Audio(`${audioPath}/chat-open.mp3`));
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [privacyWarningOpen, setPrivacyWarningOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedIndices = useRef<Set<number>>(new Set());

  useEffect(() => {
    messages.forEach((m) => processedIndices.current.add(m.index));
  }, [messages]);

  useEffect(() => {
    if (messages.length > messageCount) {
      void audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    if (chatOffset === 0 || chatOffset > lastIndex) {
      loadMessages();
    }
  }, [chatOffset]);

  const loadMessages = (): void => {
    const shortAlias = garage.getSlot()?.activeOrder?.shortAlias;

    if (!shortAlias) return;

    const url = federation.getCoordinator(shortAlias).url;
    apiClient
      .get(url, `/api/chat/?order_id=${order.id}&offset=${lastIndex}`, {
        tokenSHA256: garage.getSlot()?.getRobot()?.tokenSHA256 ?? '',
      })
      .then((data: unknown) => {
        const results = data as ChatApiResponse;
        if (results != null) {
          if (results.peer_connected !== undefined) {
            setPeerConnected(results.peer_connected);
          }
          if (results.peer_pubkey) {
            setPeerPubKey(results.peer_pubkey.split('\\').join('\n'));
          }
          setServerMessages(results.messages ?? []);
        }
      })
      .catch((error) => {
        setError(error.toString());
      });
  };

  useEffect(() => {
    if (serverMessages.length === 0 || !peerPubKey) return;

    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    if (!slot || !robot) return;

    const processBatch = async () => {
      const newMessages: EncryptedChatMessage[] = [];
      let maxIndex = lastIndex;
      const tasks: Promise<void>[] = [];

      for (const msg of serverMessages) {
        if (processedIndices.current.has(msg.index)) continue;

        processedIndices.current.add(msg.index);

        if (typeof msg.message !== 'string') continue;
        if (msg.message.substring(0, 27) !== `-----BEGIN PGP MESSAGE-----`) continue;

        const task = decryptMessage(
          msg.message.split('\\').join('\n'),
          msg.nick === userNick ? robot.pubKey : peerPubKey,
          robot.encPrivKey,
          slot.token,
        )
          .then((decryptedData) => {
            maxIndex = Math.max(maxIndex, msg.index);

            const plainText = decryptedData.decryptedMessage;
            let fileMetadata: ParsedFileMessage | undefined;
            let displayText = plainText;

            const imgMeta = parseImageMetadataJson(plainText);
            if (imgMeta) {
              fileMetadata = imgMeta;
              displayText = t('[Encrypted Image]');
            }

            newMessages.push({
              index: msg.index,
              encryptedMessage: msg.message.split('\\').join('\n'),
              plainTextMessage: displayText,
              fileMetadata,
              validSignature: decryptedData.validSignature,
              userNick: msg.nick,
              time: msg.time,
            });
          })
          .catch((err) => {
            console.error('Failed to decrypt message', msg.index, err);
          });

        tasks.push(task);
      }

      if (tasks.length === 0) return;

      await Promise.all(tasks);

      if (newMessages.length > 0) {
        setMessages((prev: EncryptedChatMessage[]) => {
          const uniqueNew = newMessages.filter((nm) => !prev.some((pm) => pm.index === nm.index));
          if (uniqueNew.length === 0) return prev;
          return [...prev, ...uniqueNew].sort((a, b) => a.index - b.index);
        });
        setLastIndex((prev) => Math.max(prev, maxIndex));
      }
    };

    void processBatch();
  }, [serverMessages, peerPubKey]);

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

    if (!robot) return;

    if (slot?.token && value.includes(slot.token)) {
      alert(
        t(
          "Aye! You just sent your own robot robot.token  to your peer in chat, that's a catastrophic idea! So bad your message was blocked.",
        ),
      );
      setValue('');
    } else {
      setWaitingEcho(true);
      onSendMessage(value)
        .then((response) => {
          if (response) {
            const res = response as ChatApiResponse;
            if (res.peer_connected !== undefined) {
              setPeerConnected(res.peer_connected);
            }
            if (res.messages != null) {
              setServerMessages(res.messages);
            }
          }
        })
        .finally(() => {
          setWaitingEcho(false);
          setValue('');
        });
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
        <ChatHeader connected={Boolean(peerPubKey)} peerConnected={peerConnected} />
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
            const userConnected = message.userNick === userNick ? true : peerConnected;

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
              fullWidth={true}
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
                  disabled={uploading || peerPubKey === undefined}
                  onClick={handleAttachClick}
                  color='primary'
                >
                  {uploading ? <CircularProgress size={24} /> : <AttachFile />}
                </IconButton>
              </span>
            </Tooltip>
            <Button
              disabled={waitingEcho || peerPubKey === undefined}
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
      <PrivacyWarningDialog open={privacyWarningOpen} onClose={handlePrivacyDialogClose} />
    </Grid>
  );
};

export default EncryptedApiChat;
