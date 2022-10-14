import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { useHistory } from 'react-router-dom';
import currencyDict from '../../../static/assets/currencies.json';
import DepthChart from '../Charts/DepthChart';

import { Order, LimitList, Maker } from '../../models';

// Icons
import { BarChart, FormatListBulleted } from '@mui/icons-material';
import BookTable from './BookTable';
import { MakerForm } from '../MakerPage';

interface BookPageProps {
  bookLoading?: boolean;
  bookRefreshing?: boolean;
  loadingLimits: boolean;
  lastDayPremium: number;
  orders: Order[];
  limits: LimitList;
  fetchLimits: () => void;
  type: number;
  currency: number;
  windowWidth: number;
  windowHeight: number;
  fetchBook: (loading: boolean, refreshing: boolean) => void;
  setAppState: (state: object) => void;
}

const BookPage = ({
  bookLoading = false,
  bookRefreshing = false,
  lastDayPremium = 0,
  loadingLimits,
  orders = [],
  limits,
  fetchLimits,
  type,
  currency,
  windowWidth,
  windowHeight,
  setAppState,
  fetchBook,
}: BookPageProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();
  const [view, setView] = useState<'list' | 'depth'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);

  const doubleView = windowWidth > 115;
  const width = windowWidth * 0.9;
  const maxBookTableWidth = 85;
  const chartWidthEm = width - maxBookTableWidth;

  const defaultMaker: Maker = {
    isExplicit: false,
    amount: '',
    paymentMethods: [],
    paymentMethodsText: 'not specified',
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
  };

  const [maker, setMaker] = useState<Maker>(defaultMaker);

  useEffect(() => {
    if (orders.length < 1) {
      fetchBook(true, false);
    } else {
      fetchBook(false, true);
    }
  }, []);

  const handleCurrencyChange = function (e) {
    const currency = e.target.value;
    setAppState({ currency });
  };

  const handleTypeChange = function (mouseEvent, val) {
    setAppState({ type: val });
  };

  const NoOrdersFound = function () {
    return (
      <Grid
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        sx={{ width: '100%', height: '100%' }}
      >
        <Grid item>
          <Typography align='center' component='h5' variant='h5'>
            {type == 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode: currency == 0 ? t('ANY') : currencyDict[currency.toString()],
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode: currency == 0 ? t('ANY') : currencyDict[currency.toString()],
                })}
          </Typography>
        </Grid>
        <Grid item>
          <Typography align='center' color='primary' variant='h6'>
            {t('Be the first one to create an order')}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  const NavButtons = function () {
    return (
      <ButtonGroup variant='contained' color='inherit'>
        <Button color='primary' onClick={() => setOpenMaker(true)}>
          {t('Create Order')}
        </Button>
        {doubleView ? (
          <></>
        ) : (
          <Button
            color='inherit'
            style={{ color: '#111111' }}
            onClick={() => setView(view === 'depth' ? 'list' : 'depth')}
          >
            {view == 'depth' ? (
              <>
                <FormatListBulleted /> {t('List')}
              </>
            ) : (
              <>
                <BarChart /> {t('Chart')}
              </>
            )}
          </Button>
        )}
        <Button color='secondary' onClick={() => history.push('/')}>
          {t('Back')}
        </Button>
      </ButtonGroup>
    );
  };
  return (
    <Grid container direction='column' alignItems='center' spacing={1} sx={{ minWidth: 400 }}>
      {openMaker ? (
        <Dialog open={openMaker} onClose={() => setOpenMaker(false)}>
          <Box sx={{ maxWidth: '18em', padding: '0.5em' }}>
            <MakerForm
              limits={limits}
              fetchLimits={fetchLimits}
              loadingLimits={loadingLimits}
              pricingMethods={false}
              setAppState={setAppState}
              maker={maker}
              defaultMaker={defaultMaker}
              setMaker={setMaker}
              type={type}
              currency={currency}
            />
          </Box>
        </Dialog>
      ) : null}

      <Grid item xs={12}>
        {doubleView ? (
          <Grid
            container
            alignItems='center'
            justifyContent='center'
            spacing={1}
            direction='row'
            style={{ width: `${windowWidth}em` }}
          >
            <Grid item>
              <BookTable
                loading={bookLoading}
                refreshing={bookRefreshing}
                clickRefresh={() => fetchBook(false, true)}
                orders={orders}
                type={type}
                currency={currency}
                maxWidth={maxBookTableWidth} // EM units
                maxHeight={windowHeight * 0.825 - 5} // EM units
                fullWidth={windowWidth} // EM units
                fullHeight={windowHeight} // EM units
                defaultFullscreen={false}
                onCurrencyChange={handleCurrencyChange}
                onTypeChange={handleTypeChange}
                noResultsOverlay={NoOrdersFound}
              />
            </Grid>
            <Grid item>
              <DepthChart
                orders={orders}
                lastDayPremium={lastDayPremium}
                currency={currency}
                compact={true}
                setAppState={setAppState}
                limits={limits}
                maxWidth={chartWidthEm} // EM units
                maxHeight={windowHeight * 0.825 - 5} // EM units
              />
            </Grid>
          </Grid>
        ) : view === 'depth' ? (
          <DepthChart
            bookLoading={bookLoading}
            orders={orders}
            lastDayPremium={lastDayPremium}
            currency={currency}
            compact={true}
            setAppState={setAppState}
            limits={limits}
            maxWidth={windowWidth * 0.8} // EM units
            maxHeight={windowHeight * 0.825 - 5} // EM units
          />
        ) : (
          <BookTable
            loading={bookLoading}
            refreshing={bookRefreshing}
            clickRefresh={() => fetchBook(false, true)}
            orders={orders}
            type={type}
            currency={currency}
            maxWidth={windowWidth * 0.97} // EM units
            maxHeight={windowHeight * 0.825 - 5} // EM units
            fullWidth={windowWidth} // EM units
            fullHeight={windowHeight} // EM units
            defaultFullscreen={false}
            onCurrencyChange={handleCurrencyChange}
            onTypeChange={handleTypeChange}
            noResultsOverlay={NoOrdersFound}
          />
        )}
      </Grid>

      <Grid item xs={12}>
        <NavButtons />
      </Grid>
    </Grid>
  );
};

export default BookPage;
