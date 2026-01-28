import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Card, CardHeader, useTheme } from '@mui/material';
import RobotAvatar from '../../../RobotAvatar';
import { systemClient } from '../../../../services/System';
import { useTranslation } from 'react-i18next';
import { isImageMimeType } from '../../../../utils/nip17File';
import { downloadFromBlossom, verifyBlobHash } from '../../../../utils/blossom';
import { decryptFile } from '../../../../utils/crypto/xchacha20';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { type EncryptedChatMessage } from '..';
import ImageLightbox from '../ImageLightbox';

interface Props {
  message: EncryptedChatMessage;
  takerNick: string;
  takerHashId: string;
  makerHashId: string;
  isTaker: boolean;
  userConnected?: boolean;
}

const MessageCard: React.FC<Props> = ({
  message,
  isTaker,
  userConnected,
  takerNick,
  takerHashId,
  makerHashId,
}) => {
  const [showPGP, setShowPGP] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [openLightbox, setOpenLightbox] = useState<boolean>(false);
  const { t } = useTranslation();
  const theme = useTheme();

  const takerCardColor = theme.palette.mode === 'light' ? '#d1e6fa' : '#082745';
  const makerCardColor = theme.palette.mode === 'light' ? '#f2d5f6' : '#380d3f';
  const cardColor = isTaker ? takerCardColor : makerCardColor;

  useEffect(() => {
    // Cleanup blob URL on unmount
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleImageLoad = async () => {
    if (!message.fileMetadata || imageUrl || imageError) return;

    try {
      const fileData = message.fileMetadata;

      if (!isImageMimeType(fileData.mimeType)) {
        return;
      }

      const ciphertext = await downloadFromBlossom(fileData.url);
      const isValid = await verifyBlobHash(ciphertext, fileData.sha256);

      if (!isValid) {
        setImageError(t('Image hash verification failed'));
        return;
      }

      const plaintext = await decryptFile(ciphertext, fileData.key, fileData.nonce);
      const blob = new Blob([plaintext], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to load image:', error);
      setImageError(t('Failed to decrypt image'));
    }
  };

  useEffect(() => {
    if (message.fileMetadata && isImageMimeType(message.fileMetadata.mimeType)) {
      void handleImageLoad();
    }
  }, [message.fileMetadata]);

  const renderMessageContent = () => {
    if (showPGP) {
      return (
        <a>
          {' '}
          {message.time} <br /> {`Valid signature:  ${String(message.validSignature)}`} <br />{' '}
          {message.encryptedMessage}{' '}
        </a>
      );
    }

    if (imageUrl) {
      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={imageUrl}
            alt={t('Encrypted image')}
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => setOpenLightbox(true)}
            onError={() => setImageError(t('Failed to display image'))}
          />
          <ImageLightbox
            open={openLightbox}
            onClose={() => setOpenLightbox(false)}
            imageUrl={imageUrl}
          />
        </div>
      );
    }

    if (imageError) {
      return <span style={{ color: 'red' }}>{imageError}</span>;
    }

    return (
      <>
        {message.plainTextMessage.split('\n').map((messageLine, idx) => (
          <span key={idx}>
            {messageLine}
            <br />
          </span>
        ))}
      </>
    );
  };

  return (
    <Card elevation={5}>
      <CardHeader
        sx={{ color: theme.palette.text.secondary }}
        avatar={
          <RobotAvatar
            statusColor={
              userConnected === undefined ? undefined : userConnected ? 'success' : 'error'
            }
            hashId={message.userNick === takerNick ? takerHashId : makerHashId}
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
        subheader={renderMessageContent()}
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
