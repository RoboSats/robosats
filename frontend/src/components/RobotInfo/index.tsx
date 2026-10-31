import React, { useContext, useEffect, useState } from 'react';

import {
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Box,
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
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Numbers, Send, EmojiEvents, Webhook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Robot, type Coordinator } from '../../models';
import { useTranslation } from 'react-i18next';
import { EnableTelegramDialog } from '../Dialogs';
import { UserNinjaIcon } from '../Icons';

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
  const [routingBudgetPPM, setRoutingBudgetPPM] = useState<string>('1000');
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

  const isValidOnionUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith('.onion');
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

  const handleSubmitReward = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (showRewardsSpinner || !e.currentTarget.reportValidity()) return;

    setBadInvoice('');
    setShowRewardsSpinner(true);
    try {
      if (!robot?.token || robot.encPrivKey == null) throw new Error('Missing robot keys');
      const signedInvoice = await signCleartextMessage(
        rewardInvoice,
        robot.encPrivKey,
        robot.token,
      );
      const data = await robot.fetchReward(federation, signedInvoice, Number(routingBudgetPPM));
      if (data?.successful_withdrawal) {
        setWithdrawn(true);
        setOpenClaimRewards(false);
      } else {
        setBadInvoice(data?.bad_invoice || t('Could not claim rewards. Try again.'));
      }
    } catch {
      setBadInvoice(t('Could not claim rewards. Try again.'));
    } finally {
      setShowRewardsSpinner(false);
    }
  };

  const closeOptions = (): void => {
    setOpenOptions(false);
    setOpenClaimRewards(false);
    setRewardInvoice('');
    setBadInvoice('');
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
      <Dialog open={openOptions} key={coordinator.shortAlias} onClose={closeOptions}>
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

            <ListItem
              secondaryAction={
                !openClaimRewards && (
                  <Tooltip
                    placement='left'
                    enterTouchDelay={0}
                    title={
                      (robot?.earnedRewards ?? 0) === 0
                        ? t('Nothing to claim yet')
                        : t('Claim your rewards')
                    }
                  >
                    <span>
                      <Button
                        disabled={(robot?.earnedRewards ?? 0) === 0 || showRewardsSpinner}
                        onClick={() => {
                          setRewardInvoice('');
                          setBadInvoice('');
                          setWithdrawn(false);
                          setOpenClaimRewards(true);
                        }}
                        variant='outlined'
                        color='primary'
                        size='small'
                      >
                        {t('Claim')}
                      </Button>
                    </span>
                  </Tooltip>
                )
              }
            >
              <ListItemIcon sx={{ minWidth: 56 }}>
                <EmojiEvents />
              </ListItemIcon>

              {!openClaimRewards ? (
                <ListItemText
                  primary={`${String(robot?.earnedRewards ?? 0)} Sats`}
                  secondary={t('Your compensations')}
                />
              ) : (
                <form onSubmit={(e) => void handleSubmitReward(e)} style={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Tooltip
                      placement='top'
                      enterTouchDelay={0}
                      title={t(
                        'Routing budget for the reward payment. Higher values may help if payment fails.',
                      )}
                    >
                      <TextField
                        label={t('Routing Budget (PPM)')}
                        type='number'
                        size='small'
                        fullWidth
                        required
                        disabled={showRewardsSpinner}
                        value={routingBudgetPPM}
                        onChange={(e) => setRoutingBudgetPPM(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: 10000, step: 1 } }}
                      />
                    </Tooltip>
                    <TextField
                      error={Boolean(badInvoice)}
                      helperText={badInvoice}
                      label={t('Invoice for {{amountSats}} Sats', {
                        amountSats: Math.floor(
                          (robot?.earnedRewards ?? 0) -
                            ((robot?.earnedRewards ?? 0) * Number(routingBudgetPPM)) / 1000000,
                        ),
                      })}
                      size='small'
                      fullWidth
                      required
                      disabled={showRewardsSpinner}
                      value={rewardInvoice}
                      onChange={(e) => setRewardInvoice(e.target.value)}
                    />
                    <Button
                      disabled={rewardInvoice === '' || showRewardsSpinner}
                      variant='contained'
                      color='primary'
                      fullWidth
                      type='submit'
                    >
                      {showRewardsSpinner ? (
                        <CircularProgress size={24} color='inherit' />
                      ) : (
                        t('Submit')
                      )}
                    </Button>
                  </Box>
                </form>
              )}
            </ListItem>

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
          <Button onClick={closeOptions} size='large'>
            {t('Back')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RobotInfo;
