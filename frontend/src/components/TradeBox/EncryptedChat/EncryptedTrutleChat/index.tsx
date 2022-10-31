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
import { ExportIcon } from '../../../Icons';
import { useTheme } from '@mui/system';
import MessageCard from '../MessageCard';
import ChatHeader from '../ChatHeader';
import { EncryptedChatMessage, ServerMessage } from '..';
import { apiClient } from '../../../../services/api';
import ChatBottom from '../ChatBottom';

interface Props {
  orderId: number;
  userNick: string;
  takerNick: string;
  chatOffset: number;
}

const EncryptedTurtleChat: React.FC<Props> = ({
  orderId,
  userNick,
  takerNick,
  chatOffset,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const audio = new Audio(`/static/assets/sounds/chat-open.mp3`);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [ownPubKey] = useState<string>(
    (systemClient.getCookie('pub_key') ?? '').split('\\').join('\n'),
  );
  const [ownEncPrivKey] = useState<string>(
    (systemClient.getCookie('enc_priv_key') ?? '').split('\\').join('\n'),
  );
  const [peerPubKey, setPeerPubKey] = useState<string>(
    '-----BEGIN PGP PUBLIC KEY BLOCK-----mDMEY0sj/RYJKwYBBAHaRw8BAQdALiPlUEfnW9k+pVMHuUstKpdfJRNN07+Huam7jP96vj20TFJvYm9TYXRzIElEIDFlMWUzM2VkMTc0ZTgzNTYzM2JkOTY5N2UyNTBhYTllNzgzYTBjMjUyZDMwYWU3ZDI4ZWFjNzUxMzFkMDI4ZjGIjAQQFgoAPgUCY0sj/QQLCQcICRBvpYjDqTP2jQMVCAoEFgACAQIZAQIbAwIeARYhBLm0oAYSSNiZp+gd32+liMOpM/aNAADR6AD/Yrlucc5F+rQxzKZSDcGvubK4lapfyYbgN+pgvRE9bX8A/jwDgWI07mR5bK1JPKDGzGdX4rnG1RPFkGY0n/XpTigGuDgEY0sj/RIKKwYBBAGXVQEFAQEHQK/+5UIZE6WWvPpPF4BAPnPDyEpAm82bDuaB3iup8+EXAwEIB4h4BBgWCAAqBQJjSyP9CRBvpYjDqTP2jQIbDBYhBLm0oAYSSNiZp+gd32+liMOpM/aNAABzuQD9F6/YNXr4hoDHYnVQR0n0LSKyhTV8FDusOuWrMzw3BcIBAMbTMHP1ykB7xTivGVvypRKsS5oMloqv59bJx01fzLEL=H0Iy-----END PGP PUBLIC KEY BLOCK-----',
  );
  const [token] = useState<string>(systemClient.getCookie('robot_token') || '');
  const [messages, setMessages] = useState<EncryptedChatMessage[]>([]);
  const [value, setValue] = useState<string>('');
  const [audit, setAudit] = useState<boolean>(false);
  const [waitingEcho, setWaitingEcho] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<string>('---BLANK---');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [lastIndex, setLastIndex] = useState<number>(0);

  useEffect(() => {
    if (messages.length > messageCount) {
      audio.play();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  useEffect(() => {
    if (serverMessages.length > 0 && peerPubKey) {
      serverMessages.forEach(onMessage);
    }
  }, [serverMessages, peerPubKey]);

  useEffect(() => {
    if (chatOffset > lastIndex) {
      loadMessages();
    }
  }, [chatOffset]);

  const loadMessages: () => void = () => {
    apiClient.get(`/api/chat?order_id=${orderId}&offset=${lastIndex}`).then((results: any) => {
      if (results) {
        setPeerConnected(results.peer_connected);
        storePeerPubKey(results.messages);
        setServerMessages(results.messages);
      }
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

  const storePeerPubKey: (dataFromServer: ServerMessage[]) => void = (dataFromServer) => {
    dataFromServer.forEach((data) => {
      if (
        data.message.substring(0, 36) == `-----BEGIN PGP PUBLIC KEY BLOCK-----` &&
        data.message != ownPubKey
      ) {
        setPeerPubKey(data.message);
      }
    });
  };

  const onMessage: (dataFromServer: ServerMessage) => void = (dataFromServer) => {
    if (dataFromServer) {
      // If we receive an encrypted message
      if (dataFromServer.message.substring(0, 27) == `-----BEGIN PGP MESSAGE-----`) {
        decryptMessage(
          dataFromServer.message.split('\\').join('\n'),
          dataFromServer.nick == userNick ? ownPubKey : peerPubKey,
          ownEncPrivKey,
          token,
        ).then((decryptedData) => {
          setLastSent(decryptedData.decryptedMessage === lastSent ? '----BLANK----' : lastSent);
          setLastIndex(lastIndex < dataFromServer.index ? dataFromServer.index : lastIndex);
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
                  userNick: dataFromServer.nick,
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
                userNick: dataFromServer.nick,
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
    else if (value.substring(0, 1) == '#') {
      apiClient
        .post(`/api/chat`, {
          PGP_message: value,
        })
        .finally(() => {
          setWaitingEcho(false);
          setValue('');
        });
    }
    // Else if message is not empty send message
    else if (value != '') {
      setWaitingEcho(true);
      setLastSent(value);
      encryptMessage(value, ownPubKey, peerPubKey, ownEncPrivKey, token).then(
        (encryptedMessage) => {
          apiClient
            .post(`/api/chat`, {
              PGP_message: encryptedMessage.toString().split('\n').join('\\'),
            })
            .finally(() => {
              setWaitingEcho(false);
              setValue('');
            });
        },
      );
    }
    e.preventDefault();
  };

  return (
    <Container component='main'>
      <ChatHeader connected={true} peerConnected={peerConnected} />
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
          {messages.map((message, index) => {
            const isTaker = takerNick === message.userNick;
            const userConnected = message.userNick === userNick ? true : peerConnected;

            return (
              <li style={{ listStyleType: 'none' }} key={index}>
                <MessageCard message={message} isTaker={isTaker} userConnected={userConnected} />
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
                disabled={waitingEcho || !peerPubKey}
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
        <ChatBottom orderId={orderId} audit={audit} setAudit={setAudit} />
      </Grid>
    </Container>
  );
};

export default EncryptedTurtleChat;
