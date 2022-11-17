import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip, TextField, Grid, Container, Paper, Typography } from '@mui/material';
import { encryptMessage, decryptMessage } from '../../../../pgp';
import { saveAsJson } from '../../../../utils';
import { AuditPGPDialog } from '../../../Dialogs';
import { systemClient } from '../../../../services/System';
import { websocketClient, WebsocketConnection } from '../../../../services/Websocket';

// Icons
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { EncryptedChatMessage, ServerMessage } from '..';
import ChatBottom from '../ChatBottom';

interface Props {
  orderId: number;
  userNick: string;
  takerNick: string;
  messages: EncryptedChatMessage[];
  setMessages: (messages: EncryptedChatMessage[]) => void;
  baseUrl: string;
}

const EncryptedSocketChat: React.FC<Props> = ({
  orderId,
  userNick,
  takerNick,
  messages,
  setMessages,
  baseUrl,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const audio = new Audio(`/static/assets/sounds/chat-open.mp3`);
  const [connected, setConnected] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [ownPubKey] = useState<string>(
    (systemClient.getItem('pub_key') ?? '').split('\\').join('\n'),
  );
  const [ownEncPrivKey] = useState<string>(
    (systemClient.getItem('enc_priv_key') ?? '').split('\\').join('\n'),
  );
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [token] = useState<string>(systemClient.getItem('robot_token') || '');
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [value, setValue] = useState<string>('');
  const [connection, setConnection] = useState<WebsocketConnection>();
  const [audit, setAudit] = useState<boolean>(false);
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [receivedIndexes, setReceivedIndexes] = useState<number[]>([]);

  useEffect(() => {
    if (!connected) {
      connectWebsocket();
    }
  }, [connected]);

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
    websocketClient.open(`ws://${window.location.host}/ws/chat/${orderId}/`).then((connection) => {
      setConnection(connection);
      setConnected(true);

      connection.send({
        message: ownPubKey,
        nick: userNick,
      });

      connection.onMessage((message) => setServerMessages((prev) => [...prev, message]));
      connection.onClose(() => setConnected(false));
      connection.onError(() => setConnected(false));
    });
  };

  const createJsonFile: () => object = () => {
    return {
      credentials: {
        own_public_key: ownPubKey,
        peer_public_key: peerPubKey,
        encrypted_private_key: ownEncPrivKey,
        passphrase: token,
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
        dataFromServer.message != ownPubKey
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
          dataFromServer.user_nick == userNick ? ownPubKey : peerPubKey,
          ownEncPrivKey,
          token,
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
    if (token && value.includes(token)) {
      alert(
        `Aye! You just sent your own robot token to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
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
      encryptMessage(value, ownPubKey, peerPubKey, ownEncPrivKey, token).then(
        (encryptedMessage) => {
          if (connection != null) {
            connection.send({
              message: encryptedMessage.toString().split('\n').join('\\'),
              nick: userNick,
            });
          }
        },
      );
    }
    e.preventDefault();
  };

  return (
    <Container component='main'>
      <ChatHeader connected={connected} peerConnected={peerConnected} />
      <div style={{ position: 'relative', left: '-0.14em', margin: '0 auto', width: '17.7em' }}>
        <Paper
          elevation={1}
          style={{
            height: '18.42em',
            maxHeight: '18.42em',
            width: '17.7em',
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
          <Grid alignItems='stretch' style={{ display: 'flex' }}>
            <Grid item alignItems='stretch' style={{ display: 'flex' }}>
              <TextField
                label={t('Type a message')}
                variant='standard'
                size='small'
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
                sx={{ width: '13.7em' }}
              />
            </Grid>
            <Grid item alignItems='stretch' style={{ display: 'flex' }}>
              <Button
                sx={{ width: '4.68em' }}
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
        </form>
      </div>

      <div style={{ height: '0.3em' }} />

      <Grid container spacing={0}>
        <AuditPGPDialog
          open={audit}
          onClose={() => setAudit(false)}
          orderId={Number(orderId)}
          messages={messages}
          own_pub_key={ownPubKey || ''}
          own_enc_priv_key={ownEncPrivKey || ''}
          peer_pub_key={peerPubKey || 'Not received yet'}
          passphrase={token || ''}
          onClickBack={() => setAudit(false)}
        />

        <ChatBottom
          orderId={orderId}
          audit={audit}
          setAudit={setAudit}
          createJsonFile={createJsonFile}
        />
      </Grid>
    </Container>
  );
};

export default EncryptedSocketChat;
