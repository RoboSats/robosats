import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';

import currencies from '../../../../static/assets/currencies.json';

import { Order } from '../../../models';
import { pn } from '../../../utils';
import { Bolt, Link } from '@mui/icons-material';
import { LightningPayoutForm, LightningForm, OnchainPayoutForm, OnchainForm } from '../Forms';

interface PayoutPrompProps {
  order: Order;
  onClickSubmitInvoice: () => void;
  lightning: LightningForm;
  loadingLightning: boolean;
  setLightning: (state: LightningForm) => void;
  onClickSubmitAddress: () => void;
  onchain: OnchainForm;
  setOnchain: (state: OnchainForm) => void;
  loadingOnchain: boolean;
}

export const PayoutPrompt = ({
  order,
  onClickSubmitInvoice,
  loadingLightning,
  lightning,
  setLightning,
  onClickSubmitAddress,
  loadingOnchain,
  onchain,
  setOnchain,
}: PayoutPrompProps): JSX.Element => {
  const { t } = useTranslation();
  const currencyCode: string = currencies[`${order.currency}`];

  const [tab, setTab] = useState<'lightning' | 'onchain'>('lightning');

  return (
    <Grid
      container
      padding={1}
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={1}
    >
      <Grid item>
        <Typography variant='body2'>
          {t(
            'Before letting you send {{amountFiat}} {{currencyCode}}, we want to make sure you are able to receive the BTC.',
            {
              amountFiat: pn(
                parseFloat(parseFloat(order.amount).toFixed(order.currency == 1000 ? 8 : 4)),
              ),
              currencyCode,
            },
          )}
        </Typography>
      </Grid>

      <Grid item>
        <ToggleButtonGroup
          size='small'
          value={tab}
          exclusive
          onChange={(mouseEvent, value: string) => setTab(value)}
        >
          <ToggleButton value='lightning' disableRipple={true}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Bolt /> {t('Lightning')}
            </div>
          </ToggleButton>
          <ToggleButton value='onchain' disabled={!order.swap_allowed}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link /> {t('Onchain')}
            </div>
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>

      <Grid item style={{ display: tab == 'lightning' ? '' : 'none' }}>
        <LightningPayoutForm
          order={order}
          loading={loadingLightning}
          lightning={lightning}
          setLightning={setLightning}
          onClickSubmit={onClickSubmitInvoice}
        />
      </Grid>

      {/* ONCHAIN PAYOUT TAB */}
      <Grid item style={{ display: tab == 'onchain' ? '' : 'none' }}>
        <OnchainPayoutForm
          order={order}
          loading={loadingOnchain}
          onchain={onchain}
          setOnchain={setOnchain}
          onClickSubmit={onClickSubmitAddress}
        />
      </Grid>
    </Grid>
  );
};

export default PayoutPrompt;
