import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip, TextField, Grid, Paper, Typography } from '@mui/material';
import { encryptMessage, decryptMessage } from '../../../../pgp';
import { AuditPGPDialog } from '../../../Dialogs';
import { websocketClient, type WebsocketConnection } from '../../../../services/Websocket';
import { type Robot } from '../../../../models';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { type EncryptedChatMessage, type ServerMessage } from '..';
import ChatBottom from '../ChatBottom';
import { sha256 } from 'js-sha256';

const audioPath =
  window.NativeRobosats === undefined
    ? '/static/assets/sounds'
    : 'file:///android_asset/Web.bundle/assets/sounds';

interface Props {
  orderId: number;
  status: number;
  robot: Robot;
  userNick: string;
  takerNick: string;
  messages: EncryptedChatMessage[];
  setMessages: (messages: EncryptedChatMessage[]) => void;
  baseUrl: string;
  turtleMode: boolean;
  setTurtleMode: (state: boolean) => void;
}

const EncryptedSocketChat: React.FC<Props> = ({
  orderId,
  status,
  robot,
  userNick,
  takerNick,
  messages,
  setMessages,
  baseUrl,
  turtleMode,
  setTurtleMode,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [audio] = useState(() => new Audio(`${audioPath}/chat-open.mp3`));
  const [connected, setConnected] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [value, setValue] = useState<string>('');
  const [connection, setConnection] = useState<WebsocketConnection>();
  const [audit, setAudit] = useState<boolean>(false);
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [receivedIndexes, setReceivedIndexes] = useState<number[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!connected && robot.avatarLoaded) {
      connectWebsocket();
    }
  }, [connected, robot]);

  // Make sure to not keep reconnecting once status is not Chat
  useEffect(() => {
    if (![9, 10].includes(status)) {
      connection?.close();
      setConnection(undefined);
    }
  }, [status]);

  useLayoutEffect(() => {
    // On component unmount close reconnecting-websockets
    return () => {
      connection?.close();
      setConnection(undefined);
    };
  }, []);

  useEffect(() => {
    if (messages.length > messageCount) {
      audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    if (serverMessages) {
      serverMessages.forEach(onMessage);
    }
  }, [serverMessages]);

  const connectWebsocket = () => {
    websocketClient
      .open(
        `ws://${window.location.host}/ws/chat/${orderId}/?token_sha256_hex=${sha256(robot.token)}`,
      )
      .then((connection) => {
        setConnection(connection);
        setConnected(true);

        connection.send({
          message: robot.pubKey,
          nick: userNick,
        });

        connection.onMessage((message) => {
          setServerMessages((prev) => [...prev, message]);
        });
        connection.onClose(() => {
          setConnected(false);
        });
        connection.onError(() => {
          setConnected(false);
        });
      });
  };

  const createJsonFile: () => object = () => {
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

  const onMessage: (message: any) => void = (message) => {
    const dataFromServer = JSON.parse(message.data);

    if (dataFromServer && !receivedIndexes.includes(dataFromServer.index)) {
      setReceivedIndexes((prev) => [...prev, dataFromServer.index]);
      setPeerConnected(dataFromServer.peer_connected);
      // If we receive a public key other than ours (our peer key!)
      if (
        connection != null &&
        dataFromServer.message.substring(0, 36) == `-----BEGIN PGP PUBLIC KEY BLOCK-----` &&
        dataFromServer.message != robot.pubKey
      ) {
        setPeerPubKey(dataFromServer.message);
        connection.send({
          message: `-----SERVE HISTORY-----`,
          nick: userNick,
        });
      }
      // If we receive an encrypted message
      else if (dataFromServer.message.substring(0, 27) == `-----BEGIN PGP MESSAGE-----`) {
        decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.user_nick == userNick ? robot.pubKey : peerPubKey,
          robot.encPrivKey,
          robot.token,
        ).then((decryptedData) => {
          setWaitingEcho(waitingEcho ? decryptedData.decryptedMessage !== lastSent : false);
          setLastSent(decryptedData.decryptedMessage === lastSent ? '----BLANK----' : lastSent);
          setMessages((prev) => {
            const existingMessage = prev.find((item) => item.index === dataFromServer.index);
            if (existingMessage) {
              return prev;
            } else {
              return [
                ...prev,
                {
                  index: dataFromServer.index,
                  encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                  plainTextMessage: decryptedData.decryptedMessage,
                  validSignature: decryptedData.validSignature,
                  userNick: dataFromServer.user_nick,
                  time: dataFromServer.time,
                } as EncryptedChatMessage,
              ].sort((a, b) => a.index - b.index);
            }
          });
        });
      }
      // We allow plaintext communication. The user must write # to start
      // If we receive an plaintext message
      else if (dataFromServer.message.substring(0, 1) == '#') {
        setMessages((prev: EncryptedChatMessage[]) => {
          const existingMessage = prev.find(
            (item) => item.plainTextMessage === dataFromServer.message,
          );
          if (existingMessage != null) {
            return prev;
          } else {
            return [
              ...prev,
              {
                index: prev.length + 0.001,
                encryptedMessage: dataFromServer.message,
                plainTextMessage: dataFromServer.message,
                validSignature: false,
                userNick: dataFromServer.user_nick,
                time: new Date().toString(),
              } as EncryptedChatMessage,
            ].sort((a, b) => a.index - b.index);
          }
        });
      }
    }
  };

  const onButtonClicked = (e: any) => {
    if (robot.token && value.includes(robot.token)) {
      alert(
        `Aye! You just sent your own robot robot.token to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
      );
      setValue('');
    }
    // If input string contains '#' send unencrypted and unlogged message
    else if (connection != null && value.substring(0, 1) == '#') {
      connection.send({
        message: value,
        nick: userNick,
      });
      setValue('');
    }

    // Else if message is not empty send message
    else if (value != '') {
      setValue('');
      setWaitingEcho(true);
      setLastSent(value);
      encryptMessage(value, robot.pubKey, peerPubKey, robot.encPrivKey, robot.token)
        .then((encryptedMessage) => {
          if (connection != null) {
            connection.send({
              message: encryptedMessage.toString().split('\n').join('\\'),
              nick: userNick,
            });
          }
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
        own_pub_key={robot.pubKey || ''}
        own_enc_priv_key={robot.encPrivKey || ''}
        peer_pub_key={peerPubKey || 'Not received yet'}
        passphrase={robot.token || ''}
        onClickBack={() => {
          setAudit(false);
        }}
      />
      <Grid item>
        <ChatHeader
          connected={connected && (peerPubKey ? true : false)}
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
            const userConnected = message.userNick === userNick ? connected : peerConnected;

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
                helperText={
                  connected
                    ? peerPubKey
                      ? null
                      : t('Waiting for peer public key...')
                    : t('Connecting...')
                }
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                }}
                fullWidth={true}
              />
            </Grid>
            <Grid item alignItems='stretch' style={{ display: 'flex' }} xs={3}>
              <Button
                fullWidth={true}
                disabled={!connected || waitingEcho || !peerPubKey}
                type='submit'
                variant='contained'
                color='primary'
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

export default EncryptedSocketChat;
