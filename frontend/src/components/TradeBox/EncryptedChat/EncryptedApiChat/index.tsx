import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Grid, Paper, Typography, Tooltip, IconButton } from '@mui/material';
import { decryptMessage } from '../../../../pgp';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { type EncryptedChatMessage, type ServerMessage } from '..';
import { apiClient } from '../../../../services/api';
import {
  type UseFederationStoreType,
  FederationContext,
} from '../../../../contexts/FederationContext';
import { type UseGarageStoreType, GarageContext } from '../../../../contexts/GarageContext';
import { type Order } from '../../../../models';
import getSettings from '../../../../utils/settings';
import { AttachFile, Send } from '@mui/icons-material';
import PrivacyWarningDialog from '../PrivacyWarningDialog';
import { ParsedFileMessage, parseImageMetadataJson } from '../../../../utils/nip17File';

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
  setMessages: (messages: EncryptedChatMessage[]) => void;
  onSendMessage: (content: string) => Promise<object | void>;
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

  useEffect(() => {
    if (messages.length > messageCount) {
      void audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    if (serverMessages.length > 0 && peerPubKey !== undefined) {
      serverMessages.forEach(onMessage);
    }
  }, [serverMessages, peerPubKey]);

  useEffect(() => {
    if (chatOffset === 0 || chatOffset > lastIndex) {
      loadMessages();
    }
  }, [chatOffset]);

  const loadMessages: () => void = () => {
    const shortAlias = garage.getSlot()?.activeOrder?.shortAlias;

    if (!shortAlias) return;

    const url = federation.getCoordinator(shortAlias).url;
    apiClient
      .get(url, `/api/chat/?order_id=${order.id}&offset=${lastIndex}`, {
        tokenSHA256: garage.getSlot()?.getRobot()?.tokenSHA256 ?? '',
      })
      .then((results: object) => {
        if (results != null) {
          setPeerConnected(results.peer_connected);
          setPeerPubKey(results.peer_pubkey.split('\\').join('\n'));
          setServerMessages(results.messages);
        }
      })
      .catch((error) => {
        setError(error.toString());
      });
  };

  const onMessage = (dataFromServer: ServerMessage): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    if (slot && robot && dataFromServer != null) {
      // If we receive an encrypted message
      if (dataFromServer.message.substring(0, 27) === `-----BEGIN PGP MESSAGE-----`) {
        void decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.nick === userNick ? robot.pubKey : peerPubKey,
          robot.encPrivKey,
          slot.token,
        ).then((decryptedData) => {
          setLastIndex((prev) => {
            return prev < dataFromServer.index ? dataFromServer.index : prev;
          });
          setMessages((prev: EncryptedChatMessage[]) => {
            const existingMessage = prev.find((item) => item.index === dataFromServer.index);
            if (existingMessage != null) {
              return prev;
            } else {
              let fileMetadata: ParsedFileMessage | undefined;
              let displayText = decryptedData.decryptedMessage;
              const imgMeta = parseImageMetadataJson(displayText);
              if (imgMeta) {
                fileMetadata = imgMeta;
                displayText = t('[Encrypted Image]');
              }

              const message: EncryptedChatMessage = {
                index: dataFromServer.index,
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: displayText,
                validSignature: decryptedData.validSignature,
                userNick: dataFromServer.nick,
                time: dataFromServer.time,
                fileMetadata,
              };
              return [...prev, message].sort((a, b) => a.index - b.index);
            }
          });
        });
      }
    }
  };

  const onButtonClicked = (e: React.FormEvent<HTMLFormElement>): void => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (!robot) return;

    if (slot?.token && value.includes(slot.token)) {
      alert(
        `Aye! You just sent your own robot robot.token  to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
      );
      setValue('');
    } else {
      setWaitingEcho(true);
      onSendMessage(value)
        .then((response) => {
          if (response) {
            setPeerConnected(response.peer_connected);
            if (response.messages != null) {
              setServerMessages(response.messages);
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

export default EncryptedApiChat;
