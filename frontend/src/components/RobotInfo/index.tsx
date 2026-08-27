import React, { useContext, useEffect, useState } from 'react';

import {
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  useTheme,
  Divider,
  Typography,
  Badge,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Numbers, Send, EmojiEvents, Webhook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { isHex32 } from 'nostr-tools/utils';
import { Robot, type Coordinator } from '../../models';
import { useTranslation } from 'react-i18next';
import { EnableTelegramDialog } from '../Dialogs';
import { NostrIcon, UserNinjaIcon } from '../Icons';

import { signCleartextMessage } from '../../pgp';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import RobotAvatar from '../RobotAvatar';

interface Props {
  coordinator: Coordinator;
  onClose: () => void;
}

const RobotInfo: React.FC<Props> = ({ coordinator, onClose }: Props) => {
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { setOpen, navigateToPage, slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const theme = useTheme();

  const [rewardInvoice, setRewardInvoice] = useState<string>('');
  const [showRewardsSpinner, setShowRewardsSpinner] = useState<boolean>(false);
  const [withdrawn, setWithdrawn] = useState<boolean>(false);
  const [badInvoice, setBadInvoice] = useState<string>('');
  const [openClaimRewards, setOpenClaimRewards] = useState<boolean>(false);
  const [openEnableTelegram, setOpenEnableTelegram] = useState<boolean>(false);
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [disabled, setDisable] = useState<boolean>(false);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [openWebhookSettings, setOpenWebhookSettings] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookApiKey, setWebhookApiKey] = useState<string>('');
  const [webhookEnabled, setWebhookEnabled] = useState<boolean>(false);
  const [webhookSaving, setWebhookSaving] = useState<boolean>(false);
  const [webhookUrlError, setWebhookUrlError] = useState<string>('');
  const [openNostrForwardSettings, setOpenNostrForwardSettings] = useState<boolean>(false);
  const [nostrForwardPubkey, setNostrForwardPubkey] = useState<string>('');
  const [nostrForwardRelay, setNostrForwardRelay] = useState<string>('');
  const [nostrForwardEnabled, setNostrForwardEnabled] = useState<boolean>(false);
  const [nostrForwardSaving, setNostrForwardSaving] = useState<boolean>(false);
  const [nostrForwardPubkeyError, setNostrForwardPubkeyError] = useState<string>('');
  const [nostrForwardRelayError, setNostrForwardRelayError] = useState<string>('');
  const [nostrForwardSaveError, setNostrForwardSaveError] = useState<string>('');

  const isValidOnionUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith('.onion');
    } catch {
      return false;
    }
  };

  const isValidNostrPubkey = (pubkey: string): boolean => {
    if (isHex32(pubkey.toLowerCase())) return true;

    try {
      const decoded = nip19.decode(pubkey);
      return decoded.type === 'npub' && isHex32(decoded.data);
    } catch {
      return false;
    }
  };

  const isValidOnionRelayUrl = (relay: string): boolean => {
    try {
      const parsed = new URL(relay);
      const hostname = parsed.hostname;
      return (
        ['ws:', 'wss:'].includes(parsed.protocol) &&
        hostname.endsWith('.onion') &&
        !hostname.includes('..') &&
        hostname.length > '.onion'.length
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const robot = garage.getSlot()?.getRobot(coordinator.shortAlias) ?? null;
    setRobot(robot);
    if (robot) {
      setWebhookUrl(robot.webhookUrl ?? '');
      setWebhookApiKey(robot.webhookApiKey ?? '');
      setWebhookEnabled(robot.webhookEnabled ?? false);
    }
  }, [slotUpdatedAt]);

  useEffect(() => {
    setDisable(Boolean(robot?.loading));
  }, [robot?.loading]);

  const handleSubmitInvoiceClicked = (e: React.MouseEvent | Event, rewardInvoice: string): void => {
    setBadInvoice('');
    setShowRewardsSpinner(true);

    if (robot?.token && robot.encPrivKey != null) {
      void signCleartextMessage(rewardInvoice, robot.encPrivKey, robot?.token).then(
        (signedInvoice) => {
          void robot.fetchReward(federation, signedInvoice).then((data) => {
            setShowRewardsSpinner(false);
            if (data != null) {
              setBadInvoice(data.bad_invoice ?? '');
              setWithdrawn(Boolean(data.successful_withdrawal));
              setOpenClaimRewards(!data.successful_withdrawal);
            }
          });
        },
      );
    }
    e.preventDefault();
  };

  const setStealthInvoice = (): void => {
    if (robot) void robot.fetchStealth(federation, !robot?.stealthInvoices);
  };

  const handleSaveWebhookSettings = async (): Promise<void> => {
    if (!robot) return;

    if (webhookUrl && !isValidOnionUrl(webhookUrl)) {
      setWebhookUrlError(t('URL must be a valid .onion address'));
      return;
    }
    setWebhookUrlError('');

    setWebhookSaving(true);
    await robot.fetchWebhook(federation, {
      webhook_url: webhookUrl || undefined,
      webhook_enabled: webhookEnabled,
      webhook_api_key: webhookApiKey || undefined,
    });
    setWebhookSaving(false);
    setOpenWebhookSettings(false);
  };

  const openNostrForwardDialog = (): void => {
    setNostrForwardPubkey(robot?.nostrForwardPubkey ?? '');
    setNostrForwardRelay(robot?.nostrForwardRelay ?? '');
    setNostrForwardEnabled(robot?.nostrForwardEnabled ?? false);
    setNostrForwardPubkeyError('');
    setNostrForwardRelayError('');
    setNostrForwardSaveError('');
    setOpenNostrForwardSettings(true);
  };

  const closeNostrForwardDialog = (): void => {
    if (!nostrForwardSaving) setOpenNostrForwardSettings(false);
  };

  const handleSaveNostrForwardSettings = async (): Promise<void> => {
    if (!robot) {
      setNostrForwardSaveError(t('Could not save Nostr forwarding settings. Try again.'));
      return;
    }

    const pubkey = nostrForwardPubkey.trim();
    const relay = nostrForwardRelay.trim();
    const pubkeyInvalid =
      (pubkey !== '' && !isValidNostrPubkey(pubkey)) || (nostrForwardEnabled && pubkey === '');
    const relayInvalid =
      (relay !== '' && !isValidOnionRelayUrl(relay)) || (nostrForwardEnabled && relay === '');

    setNostrForwardPubkeyError(
      pubkeyInvalid ? t('Enter a valid npub or 64 character hex public key') : '',
    );
    setNostrForwardRelayError(
      relayInvalid ? t('Enter a valid ws:// or wss:// .onion relay URL') : '',
    );
    setNostrForwardSaveError('');
    if (pubkeyInvalid || relayInvalid) return;

    setNostrForwardSaving(true);
    const saved = await robot.saveNostrForward(federation, {
      nostr_forward_pubkey: pubkey || null,
      nostr_forward_relay: relay || null,
      nostr_forward_enabled: nostrForwardEnabled,
    });
    setNostrForwardSaving(false);

    if (saved) {
      setOpenNostrForwardSettings(false);
    } else {
      setNostrForwardSaveError(t('Could not save Nostr forwarding settings. Try again.'));
    }
  };

  return (
    <>
      <ListItemButton disabled={disabled} onClick={() => setOpenOptions(true)}>
        <ListItemIcon sx={{ minWidth: 56 }}>
          <RobotAvatar
            shortAlias={coordinator.federated ? coordinator.shortAlias : undefined}
            hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
            style={{ width: '2.5em', height: '2.5em' }}
            smooth={true}
            small={true}
          />
        </ListItemIcon>
        <ListItemText
          primary={coordinator.longAlias}
          secondary={
            robot?.activeOrderId ? (
              <Typography color='success'>
                &nbsp;<b>{t('Active order!')}</b>
              </Typography>
            ) : robot?.lastOrderId ? (
              <Typography color='warning'>&nbsp;{t('Finished order')}</Typography>
            ) : (
              <Typography>{t('No orders found')}</Typography>
            )
          }
        />
        {(robot?.earnedRewards ?? 0) > 0 && (
          <ListItemIcon sx={{ minWidth: 56 }}>
            <EmojiEvents />
          </ListItemIcon>
        )}
      </ListItemButton>
      <Dialog open={openOptions} key={coordinator.shortAlias} onClose={() => setOpenOptions(false)}>
        <DialogContent>
          <List dense disablePadding={true}>
            <ListItemButton
              onClick={() => {
                setOpen((open) => {
                  return { ...open, coordinator: coordinator.shortAlias };
                });
              }}
            >
              <ListItemIcon sx={{ minWidth: 56 }}>
                <RobotAvatar
                  shortAlias={coordinator.federated ? coordinator.shortAlias : undefined}
                  hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
                  style={{ width: '1.8em', height: '1.8em' }}
                  smooth={true}
                  small={true}
                />
              </ListItemIcon>

              <Typography variant='h5'>{coordinator.longAlias}</Typography>
            </ListItemButton>
            {robot?.activeOrderId ? (
              <ListItemButton
                onClick={() => {
                  navigateToPage(
                    `order/${String(coordinator.shortAlias)}/${String(robot?.activeOrderId)}`,
                    navigate,
                  );
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 56 }}>
                  <Badge badgeContent='' color='primary'>
                    <Numbers color='primary' />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={t('One active order #{{orderID}}', {
                    orderID: String(robot?.activeOrderId),
                  })}
                  secondary={t('Your current order')}
                />
              </ListItemButton>
            ) : robot?.lastOrderId ? (
              <ListItemButton
                onClick={() => {
                  navigateToPage(
                    `order/${String(coordinator.shortAlias)}/${String(robot?.lastOrderId)}`,
                    navigate,
                  );
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 56 }}>
                  <Numbers color='primary' />
                </ListItemIcon>
                <ListItemText
                  primary={t('Your last order #{{orderID}}', {
                    orderID: robot?.lastOrderId,
                  })}
                  secondary={t('Inactive order')}
                />
              </ListItemButton>
            ) : (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 56 }}>
                  <Numbers />
                </ListItemIcon>
                <ListItemText
                  primary={t('No active orders')}
                  secondary={t('You do not have previous orders')}
                />
              </ListItem>
            )}

            <Divider />

            <EnableTelegramDialog
              open={openEnableTelegram}
              onClose={() => {
                setOpenEnableTelegram(false);
              }}
              tgBotName={robot?.tgBotName ?? ''}
              tgToken={robot?.tgToken ?? ''}
            />

            <ListItem>
              <ListItemIcon sx={{ minWidth: 56 }}>
                <Send />
              </ListItemIcon>

              <ListItemText>
                {robot?.tgEnabled ? (
                  <Typography color={theme.palette.success.main}>
                    <b>{t('Telegram enabled')}</b>
                  </Typography>
                ) : (
                  <Button
                    color='primary'
                    onClick={() => {
                      setOpenEnableTelegram(true);
                    }}
                  >
                    {t('Enable Telegram Notifications')}
                  </Button>
                )}
              </ListItemText>
            </ListItem>

            {/* Webhook Settings */}
            <ListItem>
              <ListItemIcon sx={{ minWidth: 56 }}>
                <Webhook />
              </ListItemIcon>

              <ListItemText>
                {robot?.webhookEnabled ? (
                  <Typography color={theme.palette.success.main}>
                    <b>{t('Webhook enabled')}</b>
                  </Typography>
                ) : (
                  <Button
                    color='primary'
                    onClick={() => {
                      setOpenWebhookSettings(true);
                    }}
                  >
                    {t('Configure Webhook')}
                  </Button>
                )}
                {robot?.webhookEnabled && (
                  <Button
                    size='small'
                    onClick={() => {
                      setOpenWebhookSettings(true);
                    }}
                  >
                    {t('Edit')}
                  </Button>
                )}
              </ListItemText>
            </ListItem>

            {/* Webhook Settings Dialog */}
            <Dialog open={openWebhookSettings} onClose={() => setOpenWebhookSettings(false)}>
              <DialogContent>
                <Typography variant='h6' gutterBottom>
                  {t('Webhook Notifications')}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {t('Receive notifications via HTTP POST to your own .onion server.')}
                </Typography>
                <Grid container spacing={2} sx={{ flexDirection: 'column' }}>
                  <Grid>
                    <TextField
                      fullWidth
                      label={t('Webhook URL (.onion only)')}
                      placeholder='http://yourserver.onion/webhook'
                      value={webhookUrl}
                      onChange={(e) => {
                        setWebhookUrl(e.target.value);
                        setWebhookUrlError('');
                      }}
                      size='small'
                      error={Boolean(webhookUrlError)}
                      helperText={webhookUrlError}
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      fullWidth
                      label={t('API Key (optional)')}
                      placeholder='Your secret API key'
                      value={webhookApiKey}
                      onChange={(e) => setWebhookApiKey(e.target.value)}
                      size='small'
                      type='password'
                    />
                  </Grid>
                  <Grid>
                    <FormControlLabel
                      label={t('Enable webhook notifications')}
                      control={
                        <Switch
                          checked={webhookEnabled}
                          onChange={(e) => setWebhookEnabled(e.target.checked)}
                        />
                      }
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenWebhookSettings(false)}>{t('Cancel')}</Button>
                <Button
                  variant='contained'
                  onClick={handleSaveWebhookSettings}
                  disabled={webhookSaving}
                >
                  {webhookSaving ? <CircularProgress size={20} /> : t('Save')}
                </Button>
              </DialogActions>
            </Dialog>

            <ListItem>
              <ListItemIcon sx={{ minWidth: 56 }}>
                <NostrIcon />
              </ListItemIcon>

              <ListItemText>
                {robot?.nostrForwardEnabled ? (
                  <Typography color={theme.palette.success.main}>
                    <b>{t('Nostr forwarding enabled')}</b>
                  </Typography>
                ) : (
                  <Button color='primary' onClick={openNostrForwardDialog}>
                    {t('Nostr forwarding')}
                  </Button>
                )}
                {robot?.nostrForwardEnabled && (
                  <Button size='small' onClick={openNostrForwardDialog}>
                    {t('Edit')}
                  </Button>
                )}
              </ListItemText>
            </ListItem>

            <Dialog
              open={openNostrForwardSettings}
              onClose={closeNostrForwardDialog}
              aria-labelledby='nostr-forward-dialog-title'
              aria-describedby='nostr-forward-description'
            >
              <DialogTitle id='nostr-forward-dialog-title'>{t('Nostr forwarding')}</DialogTitle>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSaveNostrForwardSettings();
                }}
              >
                <DialogContent>
                  <Typography
                    id='nostr-forward-description'
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {t(
                      'Forward trade notifications to your main Nostr account through your own .onion relay. The coordinator can associate this robot with that account.',
                    )}
                  </Typography>
                  <Grid container spacing={2} sx={{ flexDirection: 'column' }}>
                    <Grid>
                      <TextField
                        fullWidth
                        label={t('Main Nostr public key (npub or hex)')}
                        value={nostrForwardPubkey}
                        onChange={(event) => {
                          setNostrForwardPubkey(event.target.value);
                          setNostrForwardPubkeyError('');
                          setNostrForwardSaveError('');
                        }}
                        size='small'
                        error={Boolean(nostrForwardPubkeyError)}
                        helperText={nostrForwardPubkeyError}
                        disabled={nostrForwardSaving}
                        slotProps={{
                          htmlInput: { autoCapitalize: 'none', spellCheck: false },
                        }}
                      />
                    </Grid>
                    <Grid>
                      <TextField
                        fullWidth
                        label={t('Relay URL (ws/wss .onion only)')}
                        value={nostrForwardRelay}
                        onChange={(event) => {
                          setNostrForwardRelay(event.target.value);
                          setNostrForwardRelayError('');
                          setNostrForwardSaveError('');
                        }}
                        size='small'
                        error={Boolean(nostrForwardRelayError)}
                        helperText={nostrForwardRelayError}
                        disabled={nostrForwardSaving}
                        slotProps={{
                          htmlInput: { autoCapitalize: 'none', spellCheck: false },
                        }}
                      />
                    </Grid>
                    <Grid>
                      <FormControlLabel
                        label={t('Enable Nostr forwarding')}
                        control={
                          <Switch
                            checked={nostrForwardEnabled}
                            onChange={(event) => {
                              setNostrForwardEnabled(event.target.checked);
                              if (!event.target.checked) {
                                if (!nostrForwardPubkey.trim()) setNostrForwardPubkeyError('');
                                if (!nostrForwardRelay.trim()) setNostrForwardRelayError('');
                              }
                              setNostrForwardSaveError('');
                            }}
                            disabled={nostrForwardSaving}
                          />
                        }
                      />
                    </Grid>
                  </Grid>
                  {nostrForwardSaveError && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                      {nostrForwardSaveError}
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button
                    type='button'
                    onClick={closeNostrForwardDialog}
                    disabled={nostrForwardSaving}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button type='submit' variant='contained' loading={nostrForwardSaving}>
                    {t('Save')}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>

            <ListItem>
              <ListItemIcon sx={{ minWidth: 56 }}>
                <UserNinjaIcon />
              </ListItemIcon>

              <ListItemText>
                <Tooltip
                  placement='bottom'
                  enterTouchDelay={0}
                  title={t(
                    "Stealth lightning invoices do not contain details about the trade except an order reference. Enable this setting if you don't want to disclose details to a custodial lightning wallet.",
                  )}
                >
                  <Grid>
                    <FormControlLabel
                      labelPlacement='end'
                      label={t('Use stealth invoices')}
                      control={
                        <Switch
                          checked={robot?.stealthInvoices}
                          onChange={() => {
                            setStealthInvoice();
                          }}
                        />
                      }
                    />
                  </Grid>
                </Tooltip>
              </ListItemText>
            </ListItem>

            <ListItem>
              <ListItemIcon sx={{ minWidth: 56 }}>
                <EmojiEvents />
              </ListItemIcon>

              {!openClaimRewards ? (
                <ListItemText secondary={t('Your compensations')}>
                  <Grid container sx={{ justifyContent: 'space-between' }}>
                    <Grid size={9}>
                      <Typography>{`${String(robot?.earnedRewards)} Sats`}</Typography>
                    </Grid>

                    <Grid size={3}>
                      <Button
                        disabled={robot?.earnedRewards === 0}
                        onClick={() => {
                          setOpenClaimRewards(true);
                        }}
                        variant='contained'
                        size='small'
                      >
                        {t('Claim')}
                      </Button>
                    </Grid>
                  </Grid>
                </ListItemText>
              ) : (
                <form noValidate style={{ maxWidth: 270 }}>
                  <Grid container style={{ display: 'flex', alignItems: 'stretch' }}>
                    <Grid style={{ display: 'flex', maxWidth: 160 }}>
                      <TextField
                        error={Boolean(badInvoice)}
                        helperText={badInvoice ?? ''}
                        label={t('Invoice for {{amountSats}} Sats', {
                          amountSats: robot?.earnedRewards,
                        })}
                        size='small'
                        value={rewardInvoice}
                        onChange={(e) => {
                          setRewardInvoice(e.target.value);
                        }}
                      />
                    </Grid>
                    <Grid style={{ display: 'flex', maxWidth: 80 }} sx={{ alignItems: 'stretch' }}>
                      <Button
                        sx={{ maxHeight: 38 }}
                        disabled={rewardInvoice === ''}
                        onClick={(e) => {
                          handleSubmitInvoiceClicked(e, rewardInvoice);
                        }}
                        variant='contained'
                        color='primary'
                        size='small'
                        type='submit'
                      >
                        {t('Submit')}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </ListItem>

            {showRewardsSpinner && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </div>
            )}

            {withdrawn && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Typography color='primary' variant='body2'>
                  <b>{t('There it goes!')}</b>
                </Typography>
              </div>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOptions(false)} size='large'>
            {t('Back')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RobotInfo;
