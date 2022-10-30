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
import { encryptMessage, decryptMessage } from '../../../utils/pgp';
import { saveAsJson } from '../../../utils/saveFile';
import { AuditPGPDialog } from '../../Dialogs';
import RobotAvatar from '../../RobotAvatar';
import { systemClient } from '../../../services/System';
import { websocketClient, WebsocketConnection } from '../../../services/Websocket';

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CircularProgress from '@mui/material/CircularProgress';
import KeyIcon from '@mui/icons-material/Key';
import { ExportIcon } from '../../Icons';
import { useTheme } from '@mui/system';

interface Props {
  orderId: number;
  userNick: string;
}

interface EncryptedChatMessage {
  userNick: string;
  validSignature: boolean;
  plainTextMessage: string;
  encryptedMessage: string;
  time: string;
  index: number;
}

const EncryptedChat: React.FC<Props> = ({ orderId, userNick }: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const audio = new Audio(`/static/assets/sounds/chat-open.mp3`);
  const [connected, setConnected] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [ownPubKey] = useState<string>(
    (systemClient.getCookie('pub_key') ?? '').split('\\').join('\n'),
  );
  const [ownEncPrivKey] = useState<string>(
    (systemClient.getCookie('enc_priv_key') ?? '').split('\\').join('\n'),
  );
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [token] = useState<string>(systemClient.getCookie('robot_token') || '');
  const [messages, setMessages] = useState<EncryptedChatMessage[]>([]);
  const [serverMessages, setServerMessages] = useState<any[]>([]);
  const [value, setValue] = useState<string>('');
  const [connection, setConnection] = useState<WebsocketConnection>();
  const [audit, setAudit] = useState<boolean>(false);
  const [showPGP, setShowPGP] = useState<boolean[]>([]);
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
      messages: messages,
    };
  };

  const onMessage: (message: any) => void = (message) => {
    const dataFromServer = JSON.parse(message.data);

    if (dataFromServer && !receivedIndexes.includes(dataFromServer.index)) {
      setReceivedIndexes((prev) => [...prev, dataFromServer.index]);
      setPeerConnected(dataFromServer.peer_connected);
      // If we receive a public key other than ours (our peer key!)
      if (
        connection &&
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
        setMessages((prev) => {
          const existingMessage = prev.find(
            (item) => item.plainTextMessage === dataFromServer.message,
          );
          if (existingMessage) {
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
    message: EncryptedChatMessage,
    index: number,
    cardColor: string,
    userConnected: boolean,
  ) => JSX.Element = (message, index, cardColor, userConnected) => {
    return (
      <Card elevation={5}>
        <CardHeader
          sx={{ color: theme.palette.text.secondary }}
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
                  left: '-0.35em',
                  width: '17.14em',
                }}
              >
                <div
                  style={{
                    width: '11.78em',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {message.userNick}
                  {message.validSignature ? (
                    <CheckIcon sx={{ height: '0.8em' }} color='success' />
                  ) : (
                    <CloseIcon sx={{ height: '0.8em' }} color='error' />
                  )}
                </div>
                <div style={{ width: '1.4em' }}>
                  <IconButton
                    sx={{ height: '1.2em', width: '1.2em', position: 'relative', right: '0.15em' }}
                    onClick={() => {
                      const newShowPGP = [...showPGP];
                      newShowPGP[index] = !newShowPGP[index];
                      setShowPGP(newShowPGP);
                    }}
                  >
                    <VisibilityIcon
                      color={showPGP[index] ? 'primary' : 'inherit'}
                      sx={{
                        height: '0.6em',
                        width: '0.6em',
                        color: showPGP[index] ? 'primary' : theme.palette.text.secondary,
                      }}
                    />
                  </IconButton>
                </div>
                <div style={{ width: '1.4em' }}>
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                    <IconButton
                      sx={{ height: '0.8em', width: '0.8em' }}
                      onClick={() =>
                        systemClient.copyToClipboard(
                          showPGP[index] ? message.encryptedMessage : message.plainTextMessage,
                        )
                      }
                    >
                      <ContentCopy
                        sx={{
                          height: '0.7em',
                          width: '0.7em',
                          color: theme.palette.text.secondary,
                        }}
                      />
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
              width: '14.3em',
              position: 'relative',
              right: '1.5em',
              textAlign: 'left',
              fontSize: showPGP[index] ? theme.typography.fontSize * 0.78 : null,
            },
          }}
        />
      </Card>
    );
  };

  const connectedColor = theme.palette.mode === 'light' ? '#b5e3b7' : '#153717';
  const connectedTextColor = theme.palette.getContrastText(connectedColor);
  const ownCardColor = theme.palette.mode === 'light' ? '#d1e6fa' : '#082745';
  const peerCardColor = theme.palette.mode === 'light' ? '#f2d5f6' : '#380d3f';

  return (
    <Container component='main'>
      <Grid container spacing={0.5}>
        <Grid item xs={0.3} />
        <Grid item xs={5.5}>
          <Paper elevation={1} sx={connected ? { backgroundColor: connectedColor } : {}}>
            <Typography variant='caption' sx={{ color: connectedTextColor }}>
              {t('You') + ': '}
              {connected ? t('connected') : t('disconnected')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={0.4} />
        <Grid item xs={5.5}>
          <Paper elevation={1} sx={peerConnected ? { backgroundColor: connectedColor } : {}}>
            <Typography variant='caption' sx={{ color: connectedTextColor }}>
              {t('Peer') + ': '}
              {peerConnected ? t('connected') : t('disconnected')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={0.3} />
      </Grid>
      <div style={{ position: 'relative', left: '-0.14em', margin: '0 auto', width: '17.7em' }}>
        <Paper
          elevation={1}
          style={{
            height: '21.42em',
            maxHeight: '21.42em',
            width: '17.7em',
            overflow: 'auto',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {messages.map((message, index) => (
            <li style={{ listStyleType: 'none' }} key={index}>
              {message.userNick == userNick
                ? messageCard(message, index, ownCardColor, connected)
                : messageCard(message, index, peerCardColor, peerConnected)}
            </li>
          ))}
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
              <div style={{ width: '1.4em', height: '1.4em' }}>
                <ExportIcon sx={{ width: '0.8em', height: '0.8em' }} />
              </div>{' '}
              {t('Export')}{' '}
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EncryptedChat;
