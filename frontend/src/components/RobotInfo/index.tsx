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
import { type Coordinator, type Robot } from '../../models';
import { useTranslation } from 'react-i18next';
import { EnableTelegramDialog } from '../Dialogs';
import { UserNinjaIcon } from '../Icons';

import { getWebln } from '../../utils';
import { apiClient } from '../../services/api';
import { signCleartextMessage } from '../../pgp';
import { AppContext, type UseAppStoreType, origin } from '../../contexts/AppContext';

interface Props {
  robot: Robot;
  coordinator: Coordinator;
  onClose: () => void;
}

const RobotInfo: React.FC<Props> = ({ robot, coordinator, onClose }: Props) => {
  const { dispatchFederation, settings } = useContext<UseAppStoreType>(AppContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const theme = useTheme();

  const url = coordinator[settings.network][origin];
  const [rewardInvoice, setRewardInvoice] = useState<string>('');
  const [showRewardsSpinner, setShowRewardsSpinner] = useState<boolean>(false);
  const [withdrawn, setWithdrawn] = useState<boolean>(false);
  const [badInvoice, setBadInvoice] = useState<string>('');
  const [openClaimRewards, setOpenClaimRewards] = useState<boolean>(false);
  const [weblnEnabled, setWeblnEnabled] = useState<boolean>(false);
  const [openEnableTelegram, setOpenEnableTelegram] = useState<boolean>(false);

  const handleWebln = async (): void => {
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
    handleWebln();
  }, []);

  const handleWeblnInvoiceClicked = async (e: MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.preventDefault();
    if (robot.earnedRewards > 0) {
      const webln = await getWebln();
      const invoice = webln.makeInvoice(robot.earnedRewards).then(() => {
        if (invoice != null) {
          handleSubmitInvoiceClicked(e, invoice.paymentRequest);
        }
      });
    }
  };

  const handleSubmitInvoiceClicked = (e: any, rewardInvoice: string): void => {
    setBadInvoice('');
    setShowRewardsSpinner(true);
    void signCleartextMessage(rewardInvoice, robot.encPrivKey, robot.token).then(
      (signedInvoice) => {
        void apiClient
          .post(
            url,
            '/api/reward/',
            {
              invoice: signedInvoice,
            },
            { tokenSHA256: robot.tokenSHA256 },
          )
          .then((data: any) => {
            setBadInvoice(data.bad_invoice ?? '');
            setShowRewardsSpinner(false);
            setWithdrawn(data.successful_withdrawal);
            setOpenClaimRewards(!(data.successful_withdrawal !== undefined));
            const newRobot = {
              ...robot,
              earnedRewards: data.successful_withdrawal !== undefined ? 0 : robot.earnedRewards,
            };
            dispatchFederation({
              type: 'updateRobot',
              payload: { shortAlias: coordinator.shortAlias, robot: newRobot },
            });
          });
      },
    );
    e.preventDefault();
  };

  const setStealthInvoice = (wantsStealth: boolean): void => {
    void apiClient
      .post(url, '/api/stealth/', { wantsStealth }, { tokenSHA256: robot.tokenSHA256 })
      .then((data) => {
        const newRobot = { ...robot, stealthInvoices: data?.wantsStealth };
        dispatchFederation({
          type: 'updateRobot',
          payload: { shortAlias: coordinator.shortAlias, robot: newRobot },
        });
      });
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {`${coordinator.longAlias}:`}
        {robot.earnedRewards > 0 && (
          <Typography color='success'>&nbsp;{t('Claim Sats!')} </Typography>
        )}
        {robot.activeOrderId > 0 && (
          <Typography color='success'>
            &nbsp;<b>{t('Active order!')}</b>
          </Typography>
        )}
        {robot.lastOrderId > 0 && robot.activeOrderId === undefined && (
          <Typography color='warning'>&nbsp;{t('finished order')}</Typography>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <List dense disablePadding={true}>
          {robot.activeOrderId > 0 ? (
            <ListItemButton
              onClick={() => {
                navigate(`/order/${coordinator.shortAlias}/${String(robot.activeOrderId)}`);
                onClose();
              }}
            >
              <ListItemIcon>
                <Badge badgeContent='' color='primary'>
                  <Numbers color='primary' />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={t('One active order #{{orderID}}', { orderID: robot.activeOrderId })}
                secondary={t('Your current order')}
              />
            </ListItemButton>
          ) : robot.lastOrderId > 0 ? (
            <ListItemButton
              onClick={() => {
                navigate(`/order/${coordinator.shortAlias}/${String(robot.lastOrderId)}`);
                onClose();
              }}
            >
              <ListItemIcon>
                <Numbers color='primary' />
              </ListItemIcon>
              <ListItemText
                primary={t('Your last order #{{orderID}}', { orderID: robot.lastOrderId })}
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
            tgBotName={robot.tgBotName}
            tgToken={robot.tgToken}
          />

          <ListItem>
            <ListItemIcon>
              <Send />
            </ListItemIcon>

            <ListItemText>
              {robot.tgEnabled ? (
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
                        checked={robot.stealthInvoices}
                        onChange={() => {
                          setStealthInvoice(!robot.stealthInvoices);
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
                <Grid container>
                  <Grid item xs={9}>
                    <Typography>{`${robot.earnedRewards} Sats`}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Button
                      disabled={robot.earnedRewards === 0}
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
                        amountSats: robot.earnedRewards,
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
