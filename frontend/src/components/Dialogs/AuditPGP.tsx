import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  Tooltip,
  IconButton,
  TextField,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Grid,
  Link,
} from '@mui/material';

import { saveAsJson } from '../../utils';
import { systemClient } from '../../services/System';

// Icons
import KeyIcon from '@mui/icons-material/Key';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ForumIcon from '@mui/icons-material/Forum';
import { ExportIcon, NewTabIcon } from '../Icons';

function CredentialTextfield(props): React.JSX.Element {
  return (
    <Grid item align='center' xs={12}>
      <Tooltip placement='top' enterTouchDelay={200} enterDelay={200} title={props.tooltipTitle}>
        <TextField
          sx={{ width: '100%', maxWidth: '550px' }}
          disabled
          label={<b>{props.label}</b>}
          value={props.value}
          variant='filled'
          size='small'
          InputProps={{
            endAdornment: (
              <Tooltip disableHoverListener enterTouchDelay={0} title={props.copiedTitle}>
                <IconButton
                  onClick={() => {
                    systemClient.copyToClipboard(props.value);
                  }}
                >
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            ),
          }}
        />
      </Tooltip>
    </Grid>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: number;
  messages: array;
  ownPubKey: string;
  ownEncPrivKey: string;
  peerPubKey: string;
  passphrase: string;
  onClickBack: () => void;
}

const AuditPGPDialog = ({
  open,
  onClose,
  orderId,
  messages,
  ownPubKey,
  ownEncPrivKey,
  peerPubKey,
  passphrase,
  onClickBack,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("Don't trust, verify")}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t(
            'Your communication is end-to-end encrypted with OpenPGP. You can verify the privacy of this chat using any tool based on the OpenPGP standard.',
          )}
        </DialogContentText>
        <Grid container spacing={1} align='center'>
          <Grid item align='center' xs={12}>
            <Button
              component={Link}
              target='_blank'
              href='https://learn.robosats.org/docs/pgp-encryption'
            >
              {t('Learn how to verify')} <NewTabIcon sx={{ width: 16, height: 16 }} />
            </Button>
          </Grid>

          <CredentialTextfield
            tooltipTitle={t(
              'Your PGP public key. Your peer uses it to encrypt messages only you can read.',
            )}
            label={t('Your public key')}
            value={ownPubKey}
            copiedTitle={t('Copied!')}
          />

          <CredentialTextfield
            tooltipTitle={t(
              'Your peer PGP public key. You use it to encrypt messages only he can read and to verify your peer signed the incoming messages.',
            )}
            label={t('Peer public key')}
            value={peerPubKey}
            copiedTitle={t('Copied!')}
          />

          <CredentialTextfield
            tooltipTitle={t(
              'Your encrypted private key. You use it to decrypt the messages that your peer encrypted for you. You also use it to sign the messages you send.',
            )}
            label={t('Your encrypted private key')}
            value={ownEncPrivKey}
            copiedTitle={t('Copied!')}
          />

          <CredentialTextfield
            tooltipTitle={t(
              'The passphrase to decrypt your private key. Only you know it! Do not share. It is also your robot token.',
            )}
            label={t('Your private key passphrase (keep secure!)')}
            value={passphrase}
            copiedTitle={t('Copied!')}
          />

          <br />
          <Grid item xs={6}>
            <Tooltip
              placement='top'
              enterTouchDelay={0}
              enterDelay={1000}
              enterNextDelay={2000}
              title={t('Save credentials as a JSON file')}
            >
              <Button
                size='small'
                color='primary'
                variant='contained'
                onClick={() => {
                  saveAsJson(`keys_${orderId}.json`, {
                    own_public_key: ownPubKey,
                    peer_public_key: peerPubKey,
                    encrypted_private_key: ownEncPrivKey,
                    passphrase,
                  });
                }}
              >
                <div style={{ width: 26, height: 18 }}>
                  <ExportIcon sx={{ width: 18, height: 18 }} />
                </div>
                {t('Keys')}
                <div style={{ width: 26, height: 20 }}>
                  <KeyIcon sx={{ width: 20, height: 20 }} />
                </div>
              </Button>
            </Tooltip>
          </Grid>

          <Grid item xs={6}>
            <Tooltip
              placement='top'
              enterTouchDelay={0}
              enterDelay={1000}
              enterNextDelay={2000}
              title={t('Save messages as a JSON file')}
            >
              <Button
                size='small'
                color='primary'
                variant='contained'
                onClick={() => {
                  saveAsJson(`messages_${orderId}.json`, messages);
                }}
              >
                <div style={{ width: 28, height: 20 }}>
                  <ExportIcon sx={{ width: 18, height: 18 }} />
                </div>
                {t('Messages')}
                <div style={{ width: 26, height: 20 }}>
                  <ForumIcon sx={{ width: 20, height: 20 }} />
                </div>
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClickBack} autoFocus>
          {t('Go back')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditPGPDialog;
