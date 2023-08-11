import React, { useState } from 'react';
import { IconButton, Tooltip, Card, CardHeader, useTheme } from '@mui/material';
import RobotAvatar from '../../../RobotAvatar';
import { systemClient } from '../../../../services/System';
import { useTranslation } from 'react-i18next';

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { type EncryptedChatMessage } from '..';

interface Props {
  message: EncryptedChatMessage;
  isTaker: boolean;
  userConnected: boolean;
  baseUrl: string;
}

const MessageCard: React.FC<Props> = ({ message, isTaker, userConnected, baseUrl }) => {
  const [showPGP, setShowPGP] = useState<boolean>(false);
  const { t } = useTranslation();
  const theme = useTheme();

  const takerCardColor = theme.palette.mode === 'light' ? '#d1e6fa' : '#082745';
  const makerCardColor = theme.palette.mode === 'light' ? '#f2d5f6' : '#380d3f';
  const cardColor = isTaker ? takerCardColor : makerCardColor;

  return (
    <Card elevation={5}>
      <CardHeader
        sx={{ color: theme.palette.text.secondary }}
        avatar={
          <RobotAvatar
            statusColor={userConnected ? 'success' : 'error'}
            nickname={message.userNick}
            baseUrl={baseUrl}
            small={true}
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
                width: '100%',
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
                    setShowPGP(!showPGP);
                  }}
                >
                  <VisibilityIcon
                    color={showPGP ? 'primary' : 'inherit'}
                    sx={{
                      height: '0.6em',
                      width: '0.6em',
                      color: showPGP ? 'primary' : theme.palette.text.secondary,
                    }}
                  />
                </IconButton>
              </div>
              <div style={{ width: '1.4em' }}>
                <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
                  <IconButton
                    sx={{ height: '0.8em', width: '0.8em' }}
                    onClick={() => {
                      systemClient.copyToClipboard(
                        showPGP ? message.encryptedMessage : message.plainTextMessage,
                      );
                    }}
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
          showPGP ? (
            <a>
              {' '}
              {message.time} <br /> {`Valid signature:  ${String(message.validSignature)}`} <br />{' '}
              {message.encryptedMessage}{' '}
            </a>
          ) : (
            <>
              {message.plainTextMessage.split('\n').map((messageLine, idx) => (
                <span key={idx}>
                  {messageLine}
                  <br />
                </span>
              ))}
            </>
          )
        }
        subheaderTypographyProps={{
          sx: {
            wordWrap: 'break-word',
            width: '13em',
            textAlign: 'left',
            fontSize: showPGP ? theme.typography.fontSize * 0.78 : null,
          },
        }}
      />
    </Card>
  );
};

export default MessageCard;
