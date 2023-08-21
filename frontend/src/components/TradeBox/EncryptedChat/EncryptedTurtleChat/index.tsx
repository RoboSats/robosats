import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Grid, Paper, Typography } from '@mui/material';
import { encryptMessage, decryptMessage } from '../../../../pgp';
import { AuditPGPDialog } from '../../../Dialogs';
import { type Robot } from '../../../../models';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { type EncryptedChatMessage, type ServerMessage } from '..';
import { apiClient } from '../../../../services/api';
import ChatBottom from '../ChatBottom';

interface Props {
  orderId: number;
  robot: Robot;
  userNick: string;
  takerNick: string;
  chatOffset: number;
  messages: EncryptedChatMessage[];
  setMessages: (messages: EncryptedChatMessage[]) => void;
  baseUrl: string;
  turtleMode: boolean;
  setTurtleMode: (state: boolean) => void;
}

const audioPath =
  window.NativeRobosats === undefined
    ? '/static/assets/sounds'
    : 'file:///android_asset/Web.bundle/assets/sounds';

const EncryptedTurtleChat: React.FC<Props> = ({
  orderId,
  robot,
  userNick,
  takerNick,
  chatOffset,
  messages,
  setMessages,
  baseUrl,
  setTurtleMode,
  turtleMode,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [audio] = useState(() => new Audio(`${audioPath}/chat-open.mp3`));
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [value, setValue] = useState<string>('');
  const [audit, setAudit] = useState<boolean>(false);
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [lastIndex, setLastIndex] = useState<number>(0);
  const [error, setError] = useState<string>('');

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
    apiClient
      .get(baseUrl, `/api/chat/?order_id=${orderId}&offset=${lastIndex}`, {
        tokenSHA256: robot.tokenSHA256,
      })
      .then((results: any) => {
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

  const createJsonFile = (): object => {
    return {
      credentials: {
        own_public_key: robot.pubKey,
        peer_public_key: peerPubKey,
        encrypted_private_key: robot.encPrivKey,
        passphrase: robot.token,
      },
      messages,
    };
  };

  const onMessage = (dataFromServer: ServerMessage): void => {
    if (dataFromServer != null) {
      // If we receive an encrypted message
      if (dataFromServer.message.substring(0, 27) === `-----BEGIN PGP MESSAGE-----`) {
        void decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.nick === userNick ? robot.pubKey : peerPubKey,
          robot.encPrivKey,
          robot.token,
        ).then((decryptedData) => {
          setLastSent(decryptedData.decryptedMessage === lastSent ? '----BLANK----' : lastSent);
          setLastIndex(lastIndex < dataFromServer.index ? dataFromServer.index : lastIndex);
          setMessages((prev: EncryptedChatMessage[]) => {
            const existingMessage = prev.find((item) => item.index === dataFromServer.index);
            if (existingMessage != null) {
              return prev;
            } else {
              const x: EncryptedChatMessage = {
                index: dataFromServer.index,
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: decryptedData.decryptedMessage,
                validSignature: decryptedData.validSignature,
                userNick: dataFromServer.nick,
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
            (item) => item.plainTextMessage === dataFromServer.message,
          );
          if (existingMessage != null) {
            return prev;
          } else {
            const x: EncryptedChatMessage = {
              index: prev.length + 0.001,
              encryptedMessage: dataFromServer.message,
              plainTextMessage: dataFromServer.message,
              validSignature: false,
              userNick: dataFromServer.nick,
              time: new Date().toString(),
            };
            return [...prev, x].sort((a, b) => a.index - b.index);
          }
        });
      }
    }
  };

  const onButtonClicked = (e: React.FormEvent<HTMLFormElement>): void => {
    if (robot.token !== undefined && value.includes(robot.token)) {
      alert(
        `Aye! You just sent your own robot robot.token  to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
      );
      setValue('');
    }
    // If input string contains '#' send unencrypted and unlogged message
    else if (value.substring(0, 1) === '#') {
      apiClient
        .post(
          baseUrl,
          `/api/chat/`,
          {
            PGP_message: value,
            order_id: orderId,
            offset: lastIndex,
          },
          { tokenSHA256: robot.tokenSHA256 },
        )
        .then((response) => {
          if (response != null) {
            if (response.messages != null) {
              setPeerConnected(response.peer_connected);
              setServerMessages(response.messages);
            }
          }
        })
        .finally(() => {
          setWaitingEcho(false);
          setValue('');
        });
    }
    // Else if message is not empty send message
    else if (value !== '') {
      setWaitingEcho(true);
      setLastSent(value);
      encryptMessage(value, robot.pubKey, peerPubKey, robot.encPrivKey, robot.token)
        .then((encryptedMessage) => {
          apiClient
            .post(
              baseUrl,
              `/api/chat/`,
              {
                PGP_message: String(encryptedMessage).split('\n').join('\\'),
                order_id: orderId,
                offset: lastIndex,
              },
              { tokenSHA256: robot.tokenSHA256 },
            )
            .then((response) => {
              if (response != null) {
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
        })
        .catch((error) => {
          setError(error.toString());
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
      <AuditPGPDialog
        open={audit}
        onClose={() => {
          setAudit(false);
        }}
        orderId={Number(orderId)}
        messages={messages}
        ownPubKey={robot.pubKey ?? ''}
        ownEncPrivKey={robot.encPrivKey ?? ''}
        peerPubKey={peerPubKey ?? 'Not received yet'}
        passphrase={robot.token ?? ''}
        onClickBack={() => {
          setAudit(false);
        }}
      />

      <Grid item>
        <ChatHeader
          connected={Boolean(peerPubKey)}
          peerConnected={peerConnected}
          turtleMode={turtleMode}
          setTurtleMode={setTurtleMode}
        />
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
                  baseUrl={baseUrl}
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
        <form noValidate onSubmit={onButtonClicked}>
          <Grid alignItems='stretch' style={{ display: 'flex', width: '100%' }}>
            <Grid item alignItems='stretch' style={{ display: 'flex' }} xs={9}>
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
            </Grid>
            <Grid item alignItems='stretch' style={{ display: 'flex' }} xs={3}>
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
          </Grid>
          <Typography color='error' variant='caption'>
            {error}
          </Typography>
        </form>
      </Grid>

      <Grid item>
        <ChatBottom
          orderId={orderId}
          audit={audit}
          setAudit={setAudit}
          createJsonFile={createJsonFile}
        />
      </Grid>
    </Grid>
  );
};

export default EncryptedTurtleChat;
