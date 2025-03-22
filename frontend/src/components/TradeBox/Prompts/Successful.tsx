import React, { useContext, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Grid,
  Typography,
  Rating,
  Collapse,
  Link,
  Alert,
  AlertTitle,
  Tooltip,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';
import TradeSummary from '../TradeSummary';
import { Favorite, RocketLaunch, ContentCopy, Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { type Order } from '../../../models';
import { systemClient } from '../../../services/System';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';

interface SuccessfulPromptProps {
  order: Order;
  rateUserPlatform: (rating: number) => void;
  rateHostPlatform: (rating: number) => void;
  onClickStartAgain: () => void;
  onClickRenew: () => void;
  loadingRenew: boolean;
}

export const SuccessfulPrompt = ({
  order,
  rateUserPlatform,
  rateHostPlatform,
  onClickStartAgain,
  onClickRenew,
  loadingRenew,
}: SuccessfulPromptProps): JSX.Element => {
  const { t } = useTranslation();
  const currencyCode: string = currencies[`${order.currency}`];
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [peerRating, setPeerRating] = useState<string>();
  const [hostRating, setHostRating] = useState<string>();

  console.log(peerRating);

  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
      padding={1}
    >
      <Grid item xs={12}>
        <Typography variant='body2' align='center'>
          {t('How was your experience with {{peer_nick}}?', {
            peer_nick: order.is_maker ? order.taker_nick : order.maker_nick,
          })}
        </Typography>
      </Grid>
      <Grid item>
        <Rating
          name='size-large'
          defaultValue={0}
          size='large'
          onChange={(e) => {
            const rate = e.target.value;
            rateUserPlatform(rate);
            setPeerRating(rate);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant='body2' align='center'>
          {t('How your host {{coordinator}} did it?', {
            coordinator: federation.getCoordinator(order.shortAlias)?.longAlias,
          })}
        </Typography>
      </Grid>
      <Grid item>
        <Rating
          name='size-large'
          defaultValue={0}
          size='large'
          onChange={(e) => {
            const rate = e.target.value;
            console.log(typeof rate);
            rateHostPlatform(rate);
            setHostRating(rate);
          }}
        />
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
            {hostRating === '5' ? (
              <>
                <Typography variant='body2' align='center'>
                  <b>{t('Thank you! RoboSats loves you too')}</b>
                </Typography>
                <Favorite color='error' />
              </>
            ) : (
              <Typography variant='body2' align='center'>
                <b>{t('Thank you for using Robosats!')}</b>
              </Typography>
            )}
          </div>
          {hostRating === '5' ? (
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
      <Collapse in={Boolean(order.txid)}>
        <Alert severity='success'>
          <AlertTitle>
            {t('Your TXID')}
            <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
              <IconButton
                color='inherit'
                onClick={() => {
                  systemClient.copyToClipboard(order.txid);
                }}
              >
                <ContentCopy sx={{ width: '1em', height: '1em' }} />
              </IconButton>
            </Tooltip>
          </AlertTitle>
          <Typography
            variant='body2'
            align='center'
            sx={{ wordWrap: 'break-word', width: '15.71em' }}
          >
            <Link
              target='_blank'
              href={
                'http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/' +
                (order.network === 'testnet' ? 'testnet/' : '') +
                'tx/' +
                order.txid
              }
            >
              {order.txid}
            </Link>
          </Typography>
        </Alert>
      </Collapse>

      <Collapse in={order.tx_queued && order.address !== undefined && order.txid == null}>
        <Alert severity='info'>
          <AlertTitle>
            <CircularProgress sx={{ maxWidth: '0.8em', maxHeight: '0.8em' }} />
            <a> </a>
            {t('Sending coins to')}
            <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
              <IconButton
                color='inherit'
                onClick={() => {
                  systemClient.copyToClipboard(order.address);
                }}
              >
                <ContentCopy sx={{ width: '0.8em', height: '0.8em' }} />
              </IconButton>
            </Tooltip>
          </AlertTitle>
          <Typography
            variant='body2'
            align='center'
            sx={{ wordWrap: 'break-word', width: '15.71em' }}
          >
            <Link
              target='_blank'
              href={`http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/${
                order.network === 'testnet' ? 'testnet/' : ''
              }address/${order.address}`}
            >
              {order.address}
            </Link>
          </Typography>
        </Alert>
      </Collapse>

      <Grid item container alignItems='center' justifyContent='space-evenly'>
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
        <Grid item>
          <TradeSummary
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
