import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
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
} from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';
import TradeSummary from '../TradeSummary';
import { Favorite, RocketLaunch, ContentCopy, Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Trans } from 'react-i18next';

import { Order } from '../../../models';
import { systemClient } from '../../../services/System';

interface SuccessfulPromptProps {
  order: Order;
  ratePlatform: (rating: number) => void;
  onClickStartAgain: () => void;
  onClickRenew: () => void;
  loadingRenew: boolean;
}

export const SuccessfulPrompt = ({
  order,
  ratePlatform,
  onClickStartAgain,
  onClickRenew,
  loadingRenew,
}: SuccessfulPromptProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();
  const currencyCode: string = currencies[`${order.currency}`];

  const [rating, setRating] = useState<number | undefined>(undefined);

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Typography variant='body2' align='center'>
          <Trans i18nKey='rate_robosats'>
            What do you think of <b>RoboSats</b>?
          </Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Rating
          name='size-large'
          defaultValue={0}
          size='large'
          onChange={(e) => {
            const rate = e.target.value;
            ratePlatform(rate);
            setRating(rate);
          }}
        />
      </Grid>
      <Collapse in={rating == 5}>
        <Grid item xs={12}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Typography variant='body2' align='center'>
              <b>{t('Thank you! RoboSats loves you too')}</b>
            </Typography>
            <Favorite color='error' />
          </div>
          <Typography variant='body2' align='center'>
            {t(
              'RoboSats gets better with more liquidity and users. Tell a bitcoiner friend about Robosats!',
            )}
          </Typography>
        </Grid>
      </Collapse>
      <Collapse in={rating != 5 && rating != undefined}>
        <Grid>
          <Typography variant='body2' align='center'>
            <b>{t('Thank you for using Robosats!')}</b>
          </Typography>
          <Typography variant='body2' align='center'>
            <Trans i18nKey='let_us_know_hot_to_improve'>
              Let us know how the platform could improve (
              <Link target='_blank' href='https://t.me/robosats'>
                Telegram
              </Link>{' '}
              /{' '}
              <Link target='_blank' href='https://github.com/Reckless-Satoshi/robosats/issues'>
                Github
              </Link>
              )
            </Trans>
          </Typography>
        </Grid>
      </Collapse>

      {/* SHOW TXID IF USER RECEIVES ONCHAIN */}
      <Collapse in={order.txid != undefined}>
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
                (order.network == 'testnet' ? 'testnet/' : '') +
                'tx/' +
                order.txid
              }
            >
              {order.txid}
            </Link>
          </Typography>
        </Alert>
      </Collapse>

      <Grid item container spacing={3}>
        <Grid item xs={order.is_maker ? 6 : 12}>
          <Button color='primary' variant='outlined' onClick={onClickStartAgain}>
            <RocketLaunch />
            {t('Start Again')}
          </Button>
        </Grid>

        {order.is_maker ? (
          <Grid item xs={6}>
            <LoadingButton color='primary' variant='outlined' onClick={onClickRenew}>
              <Refresh />
              {t('Renew Order')}
            </LoadingButton>
          </Grid>
        ) : null}
      </Grid>

      <TradeSummary
        isMaker={order.is_maker}
        makerNick={order.maker_nick}
        takerNick={order.taker_nick}
        currencyCode={currencyCode}
        makerSummary={order.maker_summary}
        takerSummary={order.taker_summary}
        platformSummary={order.platform_summary}
        orderId={order.id}
      />
    </Grid>
  );
};

export default SuccessfulPrompt;
