import React, { useContext, useEffect, useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';

import { saveAsJson } from '../../utils';
import { systemClient } from '../../services/System';

// Icons
import KeyIcon from '@mui/icons-material/Key';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ForumIcon from '@mui/icons-material/Forum';
import { ExportIcon, NewTabIcon } from '../Icons';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { GarageContext, UseGarageStoreType } from '../../contexts/GarageContext';
import { Order, Slot } from '../../models';
import { nip19 } from 'nostr-tools';
import { EncryptedChatMessage } from '../TradeBox/EncryptedChat';

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
  order?: Order;
  messages?: EncryptedChatMessage[];
  peerPubKey?: string;
  onClickBack: () => void;
}

const AuditPGPDialog = ({
  open,
  onClose,
  order,
  messages,
  peerPubKey,
  onClickBack,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { client, settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const [tab, setTab] = useState<'nostr' | 'api'>(settings.connection);
  const [slot, setSlot] = useState<Slot | null>();
  // PGP
  const [ownPubKey, setOwnPubKey] = useState<string>();
  const [ownEncPrivKey, setOwnEncPrivKey] = useState<string>();
  const [passphrase, setPassphrase] = useState<string>();

  useEffect(() => {
    const slot = garage.getSlot();
    setSlot(slot);
    setOwnPubKey(slot?.getRobot()?.pubKey ?? '');
    setOwnEncPrivKey(slot?.getRobot()?.encPrivKey ?? '');
    setPassphrase(slot?.token ?? '');
  }, [garage.currentSlot, order?.id]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("Don't trust, verify")}</DialogTitle>
      <DialogContent>
        <Tabs value={settings.connection} onChange={(_event, newValue) => setTab(newValue)}>
          {settings.connection === 'nostr' ? (
            <Tab label={t('nostr')} value='nostr' style={{ width: '100%' }} />
          ) : (
            <Tab label={t('PGP')} value='api' style={{ width: '100%' }} />
          )}
        </Tabs>
        <div style={{ display: tab === 'api' ? '' : 'none', marginTop: 16 }}>
          <DialogContentText>
            {t(
              'Your communication is end-to-end encrypted with OpenPGP. You can verify the privacy of this chat using any tool based on the OpenPGP standard.',
            )}
          </DialogContentText>
          <Grid container spacing={1} align='center' direction='column'>
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

            {peerPubKey && (
              <CredentialTextfield
                tooltipTitle={t(
                  'Your peer PGP public key. You use it to encrypt messages only he can read and to verify your peer signed the incoming messages.',
                )}
                label={t('Peer public key')}
                value={peerPubKey}
                copiedTitle={t('Copied!')}
              />
            )}

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
            <Grid item xs={12} style={{ display: 'flex', flexDirection: 'row' }}>
              <Grid item style={{ width: '50%' }}>
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
                      const object = {
                        own_public_key: ownPubKey,
                        peer_public_key: peerPubKey,
                        encrypted_private_key: ownEncPrivKey,
                        passphrase,
                      };

                      return client === 'mobile'
                        ? systemClient.copyToClipboard(JSON.stringify(object))
                        : saveAsJson(`pgp_keys_${order?.id ?? ''}.json`, object, client);
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

              {messages && (
                <Grid item style={{ width: '50%' }}>
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
                        return client === 'mobile'
                          ? systemClient.copyToClipboard(JSON.stringify(messages))
                          : saveAsJson(`pgp_messages_${order?.id ?? ''}.json`, messages, client);
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
              )}
            </Grid>
          </Grid>
        </div>
        <div style={{ display: tab === 'nostr' ? '' : 'none', marginTop: 16 }}>
          <DialogContentText>
            {t(
              'Your communication is end-to-end encrypted with secp256k1 schnorr signatures. You can verify the privacy of this chat using any nostr messages validation tool.',
            )}
          </DialogContentText>
          <Grid container spacing={1} align='center' direction='column' style={{ marginTop: 16 }}>
            <CredentialTextfield
              tooltipTitle={t(
                'Your nostr public key. Your peer uses it to encrypt messages only you can read.',
              )}
              label={t('Your public key')}
              value={nip19.npubEncode(slot?.nostrPubKey ?? '')}
              copiedTitle={t('Copied!')}
            />

            {order && (
              <CredentialTextfield
                tooltipTitle={t(
                  'Your peer nostr public key. You use it to encrypt messages only he can read and to verify your peer signed the incoming messages.',
                )}
                label={t('Peer public key')}
                value={nip19.npubEncode(
                  order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey,
                )}
                copiedTitle={t('Copied!')}
              />
            )}

            <CredentialTextfield
              tooltipTitle={t(
                'Your nostr private key. You use it to decrypt the messages that your peer encrypted for you. You also use it to sign the messages you send.',
              )}
              label={t('Your private key')}
              value={slot?.nostrSecKey ? nip19.nsecEncode(slot?.nostrSecKey) : ''}
              copiedTitle={t('Copied!')}
            />

            <br />
            <Grid item xs={12} style={{ display: 'flex', flexDirection: 'row' }}>
              <Grid item style={{ width: '50%' }}>
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
                      const object = {
                        own_public_key: nip19.npubEncode(slot?.nostrPubKey ?? ''),
                        private_key: slot?.nostrSecKey ? nip19.nsecEncode(slot?.nostrSecKey) : '',
                      };

                      if (order) {
                        object.peer_public_key = nip19.npubEncode(
                          order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey,
                        );
                      }

                      return client === 'mobile'
                        ? systemClient.copyToClipboard(JSON.stringify(object))
                        : saveAsJson(`nostr_keys_${order?.id ?? ''}.json`, object, client);
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

              {messages && (
                <Grid item style={{ width: '50%' }}>
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
                        return client === 'mobile'
                          ? systemClient.copyToClipboard(JSON.stringify(messages))
                          : saveAsJson(`nostr_messages_${order?.id ?? ''}.json`, messages, client);
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
              )}
            </Grid>
          </Grid>
        </div>
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
