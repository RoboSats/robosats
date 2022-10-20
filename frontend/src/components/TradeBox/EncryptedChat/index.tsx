import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  Container,
  Card,
  CardHeader,
  Paper,
  Typography,
} from '@mui/material';
import { encryptMessage, decryptMessage } from '../../utils/pgp';
import { saveAsJson } from '../../utils/saveFile';
import { AuditPGPDialog } from '../Dialogs';
import RobotAvatar from '../Robots/RobotAvatar';
import { systemClient } from '../../services/System';
import { websocketClient, WebsocketConnection } from '../../services/Websocket';

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { ExportIcon } from '../Icons';

interface Props {
  orderId: number;
  userNick: string;
}

interface EncrypteChatMessage {
  userNick: string;
  validSignature: boolean;
  plainTextMessage: string;
  encryptedMessage: string;
  time: string;
  index: number;
}

const EncrypteChat: React.FC<Props> = ({ orderId, userNick }: Props): JSX.Element => {
  const { t } = useTranslation();
  const messageEndRef = useRef<HTMLInputElement>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [ownPubKey, setOwnPubKey] = useState<string>();
  const [ownEncPrivKey, setOwnEncPrivKey] = useState<string>();
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [token, setToken] = useState<string>();
  const [messages, setMessages] = useState<EncrypteChatMessage[]>([]);
  const [value, setValue] = useState<string>('');
  const [connection, setConnection] = useState<WebsocketConnection>();
  const [audit, setAudit] = useState<boolean>(false);
  const [showPGP, setShowPGP] = useState<boolean[]>([]);
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [latestIndex, setLatestIndex] = useState<number>(0);
  const [scrollNow, setScrollNow] = useState<boolean>(false);

  useEffect(() => {
    const pubKeyCookie = systemClient.getCookie('pub_key');
    const encPrivKeyCookie = systemClient.getCookie('enc_priv_key');
    const tokenCookie = systemClient.getCookie('robot_token');
    if (pubKeyCookie && encPrivKeyCookie && tokenCookie) {
      setOwnPubKey(pubKeyCookie.split('\\').join('\n'));
      setOwnEncPrivKey(encPrivKeyCookie.split('\\').join('\n'));
      setToken(tokenCookie);
    }
    connectWebsocket();
  }, []);

  useEffect(() => {
    if (scrollNow) {
      const audio = new Audio(`/static/assets/sounds/chat-open.mp3`);
      audio.play();
      scrollToBottom();
      setScrollNow(false);
    }
  }, [scrollNow]);

  const connectWebsocket = () => {
    websocketClient.open(`ws://${window.location.host}/ws/chat/${orderId}/`).then((connection) => {
      console.log('Connected!');

      connection.send({
        message: ownPubKey,
        nick: userNick,
      });

      connection.onMessage(onMessage);
      connection.onClose(() => {
        console.log('Socket is closed. Reconnect will be attempted');
        setConnected(false);
        connectWebsocket();
      });
      connection.onError(() => {
        console.error('Socket encountered error: Closing socket');
        setConnected(false);
      });

      setConnected(true);
      setConnection(connection);
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
      messages: messages,
    };
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const onMessage: (message: any) => void = (message) => {
    const dataFromServer = JSON.parse(message.data);
    console.log('Got reply!', dataFromServer.type);
    console.log('PGP message index', dataFromServer.index, ' latestIndex ', latestIndex);
    if (dataFromServer) {
      console.log(dataFromServer);
      setPeerConnected(dataFromServer.peer_connected);

      // If we receive our own key on a message
      if (dataFromServer.message == ownPubKey) {
        console.log('OWN PUB KEY RECEIVED!!');
      }

      // If we receive a public key other than ours (our peer key!)
      if (
        connection &&
        dataFromServer.message.substring(0, 36) == `-----BEGIN PGP PUBLIC KEY BLOCK-----` &&
        dataFromServer.message != ownPubKey
      ) {
        if (dataFromServer.message == peerPubKey) {
          console.log('PEER HAS RECONNECTED USING HIS PREVIOUSLY KNOWN PUBKEY');
        } else if (dataFromServer.message != peerPubKey && peerPubKey != null) {
          console.log('PEER PUBKEY HAS CHANGED');
        }
        console.log('PEER PUBKEY RECEIVED!!');
        setPeerPubKey(dataFromServer.message);

        connection.send({
          message: `-----SERVE HISTORY-----`,
          nick: userNick,
        });
      }

      // If we receive an encrypted message
      else if (
        dataFromServer.message.substring(0, 27) == `-----BEGIN PGP MESSAGE-----` &&
        dataFromServer.index > latestIndex
      ) {
        decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.user_nick == userNick ? ownPubKey : peerPubKey,
          ownEncPrivKey,
          token,
        ).then((decryptedData) => {
          setScrollNow(true);
          setLatestIndex(dataFromServer.index > latestIndex ? dataFromServer.index : latestIndex);
          setWaitingEcho(waitingEcho ? decryptedData.decryptedMessage !== lastSent : false);
          setLastSent(decryptedData.decryptedMessage === lastSent ? '----BLANK----' : lastSent);
          setMessages(
            [
              ...messages,
              {
                index: dataFromServer.index,
                encryptedMessage: dataFromServer.message.split('\\').join('\n'),
                plainTextMessage: decryptedData.decryptedMessage,
                validSignature: decryptedData.validSignature,
                userNick: dataFromServer.user_nick,
                time: dataFromServer.time,
              } as EncrypteChatMessage,
            ].sort((a, b) => {
              // order the message array by their index (increasing)
              return a.index - b.index;
            }),
          );
        });
      }

      // We allow plaintext communication. The user must write # to start
      // If we receive an plaintext message
      else if (dataFromServer.message.substring(0, 1) == '#') {
        console.log('Got plaintext message', dataFromServer.message);
        setScrollNow(true);
        setMessages(
          [
            ...messages,
            {
              index: latestIndex + 0.001,
              encryptedMessage: dataFromServer.message,
              plainTextMessage: dataFromServer.message,
              validSignature: false,
              userNick: dataFromServer.user_nick,
              time: new Date().toString(),
            } as EncrypteChatMessage,
          ].sort((a, b) => {
            // order the message array by their index (increasing)
            return a.index - b.index;
          }),
        );
      }
    }
  };

  const onButtonClicked = (e: any) => {
    if (token && value.indexOf(token) !== -1) {
      alert(
        `Aye! You just sent your own robot token to your peer in chat, that's a catastrophic idea! So bad your message was blocked.`,
      );
      setValue('');
    }
    // If input string contains '#' send unencrypted and unlogged message
    else if (connection && value.substring(0, 1) == '#') {
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
          if (connection) {
            console.log('Sending Encrypted MESSAGE', encryptedMessage);
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

  const messageCard: (
    message: EncrypteChatMessage,
    index: number,
    cardColor: string,
    userConnected: boolean,
  ) => JSX.Element = (message, index, cardColor, userConnected) => {
    if (!index) return <></>;
    console.log('userConnected', userConnected);
    return (
      <Card elevation={5}>
        <CardHeader
          sx={{ color: '#333333' }}
          avatar={
            <RobotAvatar
              statusColor={userConnected ? 'success' : 'error'}
              nickname={message.userNick}
            />
          }
          style={{ backgroundColor: cardColor }}
          title={
            <Tooltip
              placement='top'
              enterTouchDelay={0}
              enterDelay={500}
              enterNextDelay={2000}
              title={t(
                message.validSignature
                  ? 'Verified signature by {{nickname}}'
                  : 'Cannot verify signature of {{nickname}}',
                { nickname: message.userNick },
              )}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  position: 'relative',
                  left: -5,
                  width: 240,
                }}
              >
                <div
                  style={{ width: 168, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  {message.userNick}
                  {message.validSignature ? (
                    <CheckIcon sx={{ height: 16 }} color='success' />
                  ) : (
                    <CloseIcon sx={{ height: 16 }} color='error' />
                  )}
                </div>
                <div style={{ width: 20 }}>
                  <IconButton
                    sx={{ height: 18, width: 18 }}
                    onClick={() => {
                      const newShowPGP = [...showPGP];
                      newShowPGP[index] = !newShowPGP[index];
                      setShowPGP(newShowPGP);
                    }}
                  >
                    <VisibilityIcon
                      color={showPGP[index] ? 'primary' : 'inherit'}
                      sx={{
                        height: 16,
                        width: 16,
                        color: showPGP[index] ? 'primary' : '#333333',
                      }}
                    />
                  </IconButton>
                </div>
                <div style={{ width: 20 }}>
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                    <IconButton
                      sx={{ height: 18, width: 18 }}
                      onClick={() =>
                        systemClient.copyToClipboard(
                          showPGP[index] ? message.encryptedMessage : message.plainTextMessage,
                        )
                      }
                    >
                      <ContentCopy sx={{ height: 16, width: 16, color: '#333333' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </Tooltip>
          }
          subheader={
            showPGP[index] ? (
              <a>
                {' '}
                {message.time} <br /> {'Valid signature: ' + message.validSignature} <br />{' '}
                {message.encryptedMessage}{' '}
              </a>
            ) : (
              message.plainTextMessage
            )
          }
          subheaderTypographyProps={{
            sx: {
              wordWrap: 'break-word',
              width: '200px',
              color: '#444444',
              fontSize: showPGP[index] ? 11 : null,
            },
          }}
        />
      </Card>
    );
  };

  return (
    <Container component='main'>
      <Grid container spacing={0.5}>
        <Grid item xs={0.3} />
        <Grid item xs={5.5}>
          <Paper
            elevation={1}
            style={connected ? { backgroundColor: '#e8ffe6' } : { backgroundColor: '#FFF1C5' }}
          >
            <Typography variant='caption' sx={{ color: '#333333' }}>
              {t('You') + ': '}
              {connected ? t('connected') : t('disconnected')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={0.4} />
        <Grid item xs={5.5}>
          <Paper
            elevation={1}
            style={peerConnected ? { backgroundColor: '#e8ffe6' } : { backgroundColor: '#FFF1C5' }}
          >
            <Typography variant='caption' sx={{ color: '#333333' }}>
              {t('Peer') + ': '}
              {peerConnected ? t('connected') : t('disconnected')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={0.3} />
      </Grid>
      <div style={{ position: 'relative', left: '-2px', margin: '0 auto', width: '285px' }}>
        <Paper
          elevation={1}
          style={{
            height: '300px',
            maxHeight: '300px',
            width: '285px',
            overflow: 'auto',
            backgroundColor: '#F7F7F7',
          }}
        >
          {messages.map((message, index) => (
            <li style={{ listStyleType: 'none' }} key={index}>
              {message.userNick == userNick
                ? messageCard(message, index, '#eeeeee', connected)
                : messageCard(message, index, '#fafafa', peerConnected)}
            </li>
          ))}
          <div style={{ float: 'left', clear: 'both' }} ref={messageEndRef} />
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
                sx={{ width: 219 }}
              />
            </Grid>
            <Grid item alignItems='stretch' style={{ display: 'flex' }}>
              <Button
                sx={{ width: 68 }}
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
                      minWidth: 68,
                      width: 68,
                      position: 'relative',
                      left: 15,
                    }}
                  >
                    <div style={{ width: 20 }}>
                      <KeyIcon sx={{ width: 18 }} />
                    </div>
                    <div style={{ width: 18 }}>
                      <CircularProgress size={16} thickness={5} />
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

      <div style={{ height: 4 }} />

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

        <Grid item xs={6}>
          <Tooltip
            placement='bottom'
            enterTouchDelay={0}
            enterDelay={500}
            enterNextDelay={2000}
            title={t('Verify your privacy')}
          >
            <Button
              size='small'
              color='primary'
              variant='outlined'
              onClick={() => setAudit(!audit)}
            >
              <KeyIcon />
              {t('Audit PGP')}{' '}
            </Button>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <Tooltip
            placement='bottom'
            enterTouchDelay={0}
            enterDelay={500}
            enterNextDelay={2000}
            title={t('Save full log as a JSON file (messages and credentials)')}
          >
            <Button
              size='small'
              color='primary'
              variant='outlined'
              onClick={() => saveAsJson('complete_log_chat_' + orderId + '.json', createJsonFile())}
            >
              <div style={{ width: 28, height: 20 }}>
                <ExportIcon sx={{ width: 20, height: 20 }} />
              </div>{' '}
              {t('Export')}{' '}
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EncrypteChat;
