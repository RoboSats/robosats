import React, { useContext, useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Grid,
  Typography,
  Rating,
  Collapse,
  Link,
  Alert,
  Tooltip,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';
import TradeSummary from '../TradeSummary';
import { Favorite, RocketLaunch, ContentCopy, Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { finalizeEvent, type Event } from 'nostr-tools';
import { type Order } from '../../../models';
import { systemClient } from '../../../services/System';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';
import { type UseAppStoreType, AppContext } from '../../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../../contexts/GarageContext';
import { useTheme } from '@mui/system';

interface SuccessfulPromptProps {
  order: Order;
  rateUserPlatform: (rating: number) => void;
  onClickStartAgain: () => void;
  onClickRenew: () => void;
  loadingRenew: boolean;
}

export const SuccessfulPrompt = ({
  order,
  rateUserPlatform,
  onClickStartAgain,
  onClickRenew,
  loadingRenew,
}: SuccessfulPromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const currencyCode: string = currencies[`${order.currency}`];
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const [coordinatorToken, setCoordinatorToken] = useState<string>();
  const [hostRating, setHostRating] = useState<number>();

  const rateHostPlatform = function (): void {
    if (!hostRating) return;

    const slot = garage.getSlot();
    const coordinatorPubKey = federation.getCoordinator(order.shortAlias)?.nostrHexPubkey;

    if (!coordinatorToken) {
      console.error('Missing coordinator token');
      return;
    }

    if (!slot?.nostrPubKey || !slot.nostrSecKey || !coordinatorPubKey || !order.id) {
      console.error('Rating not valid');
      return;
    }

    const eventTemplate: Event = {
      kind: 31986,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['sig', coordinatorToken],
        ['d', `${order.shortAlias}:${order.id}`],
        ['p', coordinatorPubKey],
        ['rating', String(hostRating / 5)],
      ],
      content: '',
      pubkey: slot.nostrPubKey,
      id: '',
      sig: '',
    };

    const signedEvent = finalizeEvent(eventTemplate, slot.nostrSecKey);
    federation.roboPool.sendEvent(signedEvent);
  };

  useEffect(() => {
    const slot = garage.getSlot();
    if (slot?.nostrPubKey) {
      slot.getRobot(order.shortAlias)?.loadReviewToken(federation, setCoordinatorToken);
    }
  }, []);

  useEffect(() => {
    rateHostPlatform();
  }, [hostRating]);

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
      padding={1}
    >
      <Grid container direction='row'>
        <Grid item width='48%'>
          <Typography variant='body2' align='center'>
            {t('Rate your trade experience')}
          </Typography>
          <Rating
            name='size-large'
            defaultValue={0}
            size='large'
            onChange={(e) => {
              const rate = e.target.value;
              rateUserPlatform(rate);
            }}
          />
        </Grid>
        <Grid item width='48%'>
          <Tooltip
            title={t('You need to enable nostr to rate your coordinator.')}
            disableHoverListener={settings.connection === 'nostr'}
          >
            <div
              style={{
                borderLeft: `1px solid ${theme.palette.divider}`,
                marginLeft: '6px',
                paddingLeft: '6px',
              }}
            >
              <Typography variant='body2' align='center'>
                {t('Rate your host')}{' '}
                <b>{federation.getCoordinator(order.shortAlias)?.longAlias}</b>{' '}
              </Typography>
              <Rating
                disabled={settings.connection !== 'nostr'}
                name='size-large'
                defaultValue={0}
                size='large'
                onChange={(e) => {
                  const rate = e.target.value;
                  setHostRating(parseInt(rate));
                }}
              />
            </div>
          </Tooltip>
        </Grid>
      </Grid>
      {hostRating ? (
        <Grid item xs={12}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {hostRating === 5 ? (
              <>
                <Typography variant='body2' align='center'>
                  <b>
                    {t('Thank you! {{shortAlias}} loves you too', {
                      shortAlias: federation.getCoordinator(order.shortAlias)?.longAlias,
                    })}
                  </b>
                </Typography>
                <Favorite color='error' />
              </>
            ) : (
              <Typography variant='body2' align='center'>
                <b>{t('Thank you for using Robosats!')}</b>
              </Typography>
            )}
          </div>
          {hostRating === 5 ? (
            <Typography variant='body2' align='center'>
              {t(
                'RoboSats gets better with more liquidity and users. Tell a bitcoiner friend about Robosats!',
              )}
            </Typography>
          ) : (
            <Typography variant='body2' align='center'>
              <Trans i18nKey='let_us_know_hot_to_improve'>
                Let us know how the platform could improve (
                <Link target='_blank' href='https://t.me/robosats'>
                  Telegram
                </Link>
                {' / '}
                <Link target='_blank' href='https://github.com/RoboSats/robosats/issues'>
                  Github
                </Link>
                )
              </Trans>
            </Typography>
          )}
        </Grid>
      ) : (
        <></>
      )}

      {/* SHOW TXID IF USER RECEIVES ONCHAIN */}
      <Collapse in={Boolean(order.txid)} sx={{ width: '100%' }}>
        <Alert
          severity='success'
          style={{ marginTop: 0.5 }}
          action={
            <IconButton
              color='inherit'
              onClick={() => {
                systemClient.copyToClipboard(order.txid);
              }}
            >
              <ContentCopy sx={{ width: '0.8em', height: '0.8em' }} />
            </IconButton>
          }
        >
          {t('Your TXID')}
        </Alert>
      </Collapse>

      <Collapse
        in={order.tx_queued && order.address !== undefined && order.txid == null}
        sx={{ width: '100%' }}
      >
        <Alert
          sx={{ marginTop: 0.5 }}
          severity='info'
          action={
            <IconButton
              color='inherit'
              onClick={() => {
                systemClient.copyToClipboard(order.address);
              }}
            >
              <ContentCopy sx={{ width: '0.8em', height: '0.8em' }} />
            </IconButton>
          }
        >
          <CircularProgress sx={{ maxWidth: '0.8em', maxHeight: '0.8em', marginRight: '5px' }} />
          {t('Sending coins')}
        </Alert>
      </Collapse>

      <Grid
        item
        container
        alignItems='center'
        justifyContent='space-evenly'
        sx={{ marginTop: 0.5 }}
      >
        <Grid item>
          <Button color='primary' variant='outlined' onClick={onClickStartAgain}>
            <RocketLaunch sx={{ width: '0.8em' }} />
            <Typography style={{ display: 'inline-block' }}>{t('Start Again')}</Typography>
          </Button>
        </Grid>

        {order.is_maker ? (
          <Grid item>
            <LoadingButton
              color='primary'
              variant='outlined'
              onClick={onClickRenew}
              loading={loadingRenew}
            >
              <Refresh sx={{ width: '0.8em' }} />
              <Typography style={{ display: 'inline-block' }}>{t('Renew')}</Typography>
            </LoadingButton>
          </Grid>
        ) : null}
      </Grid>

      {order.platform_summary != null ? (
        <Grid item sx={{ marginTop: 0.5 }}>
          <TradeSummary
            robotNick={order.ur_nick}
            isMaker={order.is_maker}
            makerHashId={order.maker_hash_id}
            takerHashId={order.taker_hash_id}
            currencyCode={currencyCode}
            makerSummary={order.maker_summary}
            takerSummary={order.taker_summary}
            platformSummary={order.platform_summary}
            orderId={order.id}
            coordinatorLongAlias={federation.getCoordinator(order.shortAlias)?.longAlias}
          />
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export default SuccessfulPrompt;
