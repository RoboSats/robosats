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
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { Numbers, Send, EmojiEvents, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type Coordinator } from '../../models';
import { useTranslation } from 'react-i18next';
import { EnableTelegramDialog } from '../Dialogs';
import { UserNinjaIcon } from '../Icons';

import { getWebln } from '../../utils';
import { signCleartextMessage } from '../../pgp';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

interface Props {
  coordinator: Coordinator;
  onClose: () => void;
  disabled?: boolean;
}

const RobotInfo: React.FC<Props> = ({ coordinator, onClose, disabled }: Props) => {
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const theme = useTheme();

  const [rewardInvoice, setRewardInvoice] = useState<string>('');
  const [showRewardsSpinner, setShowRewardsSpinner] = useState<boolean>(false);
  const [withdrawn, setWithdrawn] = useState<boolean>(false);
  const [badInvoice, setBadInvoice] = useState<string>('');
  const [openClaimRewards, setOpenClaimRewards] = useState<boolean>(false);
  const [weblnEnabled, setWeblnEnabled] = useState<boolean>(false);
  const [openEnableTelegram, setOpenEnableTelegram] = useState<boolean>(false);

  const robot = garage.getSlot()?.getRobot(coordinator.shortAlias);

  const handleWebln = async (): Promise<void> => {
    void getWebln()
      .then(() => {
        setWeblnEnabled(true);
      })
      .catch(() => {
        setWeblnEnabled(false);
        console.log('WebLN not available');
      });
  };

  useEffect(() => {
    void handleWebln();
  }, []);

  const handleWeblnInvoiceClicked = async (e: MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.preventDefault();
    if (robot != null && robot.earnedRewards > 0) {
      const webln = await getWebln();
      const invoice = webln.makeInvoice(robot.earnedRewards).then(() => {
        if (invoice != null) {
          handleSubmitInvoiceClicked(e, invoice.paymentRequest);
        }
      });
    }
  };

  const handleSubmitInvoiceClicked = (e: Event, rewardInvoice: string): void => {
    setBadInvoice('');
    setShowRewardsSpinner(true);

    if (robot?.token && robot.encPrivKey != null) {
      void signCleartextMessage(rewardInvoice, robot.encPrivKey, robot?.token).then(
        (signedInvoice) => {
          console.log('Signed message:', signedInvoice);
          void robot.fetchReward(federation, signedInvoice).then((data) => {
            setBadInvoice(data.bad_invoice ?? '');
            setShowRewardsSpinner(false);
            setWithdrawn(data.successful_withdrawal);
            setOpenClaimRewards(!data.successful_withdrawal);
          });
        },
      );
    }
    e.preventDefault();
  };

  const setStealthInvoice = (): void => {
    if (robot) void robot.fetchStealth(federation, !robot?.stealthInvoices);
  };

  return (
    <Accordion disabled={disabled}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {`${coordinator.longAlias}:`}
        {(robot?.earnedRewards ?? 0) > 0 && (
          <Typography color='success'>&nbsp;{t('Claim Sats!')} </Typography>
        )}
        {robot?.activeOrderId ? (
          <Typography color='success'>
            &nbsp;<b>{t('Active order!')}</b>
          </Typography>
        ) : (
          robot?.lastOrderId && <Typography color='warning'>&nbsp;{t('finished order')}</Typography>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <List dense disablePadding={true}>
          {robot?.activeOrderId ? (
            <ListItemButton
              onClick={() => {
                navigate(
                  `/order/${String(coordinator.shortAlias)}/${String(robot?.activeOrderId)}`,
                );
                onClose();
              }}
            >
              <ListItemIcon>
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
                navigate(`/order/${String(coordinator.shortAlias)}/${String(robot?.lastOrderId)}`);
                onClose();
              }}
            >
              <ListItemIcon>
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
              <ListItemIcon>
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
            <ListItemIcon>
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

          <ListItem>
            <ListItemIcon>
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
                <Grid item>
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
            <ListItemIcon>
              <EmojiEvents />
            </ListItemIcon>

            {!openClaimRewards ? (
              <ListItemText secondary={t('Your compensations')}>
                <Grid container justifyContent='space-between'>
                  <Grid item xs={9}>
                    <Typography>{`${String(robot?.earnedRewards)} Sats`}</Typography>
                  </Grid>

                  <Grid item xs={3}>
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
                  <Grid item style={{ display: 'flex', maxWidth: 160 }}>
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
                  <Grid item alignItems='stretch' style={{ display: 'flex', maxWidth: 80 }}>
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
                {weblnEnabled ? (
                  <Grid container style={{ display: 'flex', alignItems: 'stretch' }}>
                    <Grid item alignItems='stretch' style={{ display: 'flex', maxWidth: 240 }}>
                      <Button
                        sx={{ maxHeight: 38, minWidth: 230 }}
                        onClick={(e) => {
                          handleWeblnInvoiceClicked(e);
                        }}
                        variant='contained'
                        color='primary'
                        size='small'
                        type='submit'
                      >
                        {t('Generate with Webln')}
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <></>
                )}
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
      </AccordionDetails>
    </Accordion>
  );
};

export default RobotInfo;
