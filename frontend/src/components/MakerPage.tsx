import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, useTheme, Paper, Collapse, Typography } from '@mui/material';

import { LimitList } from '../models/Limit.model';
import Maker from '../models/Maker.model';
import Order from '../models/Order.model';
import MakerForm from './MakerForm';
import BookTable from './BookTable';

import { useHistory } from 'react-router-dom';
import filterOrders from '../utils/filterOrders';

interface MakerPageProps {
  limits: LimitList;
  orders: Order[];
  loadingLimits: boolean;
  type: number;
  windowHeight: number;
  windowWidth: number;
  currency: number;
  setAppState: (state: object) => void;
}

const MakerPage = ({
  limits,
  orders,
  loadingLimits,
  currency,
  type,
  setAppState,
  windowHeight,
  windowWidth,
}: MakerPageProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();

  const [maker, setMaker] = useState<Maker>({
    isExplicit: false,
    amount: '',
    paymentMethods: [],
    paymentMethodsText: 'Not specified',
    badPaymentMethod: false,
    premium: '',
    satoshis: '',
    publicExpiryTime: new Date(0, 0, 0, 23, 59),
    publicDuration: 86340,
    escrowExpiryTime: new Date(0, 0, 0, 3, 0),
    escrowDuration: 10800,
    bondSize: 3,
    minAmount: '',
    maxAmount: '',
    badPremiumText: '',
    badSatoshisText: '',
  });

  const maxHeight = windowHeight ? windowHeight * 0.85 : 1000;
  const [showMatches, setShowMatches] = useState<boolean>(false);

  const matches = filterOrders({
    orders,
    baseFilter: { currency: currency == 0 ? 1 : currency, type },
    paymentMethods: maker.paymentMethods,
    amountFilter: {
      amount: maker.amount,
      minAmount: maker.minAmount,
      maxAmount: maker.maxAmount,
      threshold: 0.7,
    },
  });

  return (
    <Grid container direction='column' alignItems='center' spacing={1}>
      <Grid item>
        <Collapse in={matches.length > 0 && showMatches}>
          <Grid container direction='column' alignItems='center' spacing={1}>
            <Grid item>
              <Typography variant='h5'>{t('Existing orders match yours!')}</Typography>
            </Grid>
            <Grid item>
              <BookTable
                orders={matches}
                type={type}
                currency={currency}
                maxWidth={Math.min(windowWidth, 60)} // EM units
                maxHeight={Math.min(matches.length * 4, 20)} // EM units
                defaultFullscreen={false}
                showControls={false}
                showFooter={false}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
      <Grid item>
        <Paper
          elevation={12}
          style={{ padding: 8, width: '17.25em', maxHeight: `${maxHeight}em`, overflow: 'auto' }}
        >
          <MakerForm
            limits={limits}
            loadingLimits={loadingLimits}
            pricingMethods={false}
            setAppState={setAppState}
            maker={maker}
            setMaker={setMaker}
            type={type}
            currency={currency}
            disableRequest={matches.length > 0 && !showMatches}
            collapseAll={showMatches}
            onSubmit={() => setShowMatches(matches.length > 0)}
            onReset={() => setShowMatches(false)}
            submitButtonLabel={matches.length > 0 && !showMatches ? 'Submit' : 'Create order'}
          />
        </Paper>
      </Grid>
      <Grid item>
        <Button
          color='secondary'
          variant='contained'
          onClick={() => history.goBack()}
          component='a'
        >
          {t('Back')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default MakerPage;
