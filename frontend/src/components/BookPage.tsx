import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import currencyDict from '../../static/assets/currencies.json';
import DepthChart from './Charts/DepthChart';

import { Order } from '../models/Order.model';
import { LimitList } from '../models/Limit.model';

// Icons
import { BarChart, FormatListBulleted } from '@mui/icons-material';
import BookTable from './BookTable';
import MakerForm from './MakerForm';

interface BookPageProps {
  bookLoading?: boolean;
  bookRefreshing?: boolean;
  loadingLimits: boolean;
  orders: Order[];
  limits: LimitList;
  type: number;
  currency: number;
  windowWidth: number;
  windowHeight: number;
  fetchBook: () => void;
  setAppState: () => void;
}

const BookPage = ({
  bookLoading = false,
  bookRefreshing = false,
  loadingLimits,
  orders = [],
  limits,
  type,
  currency,
  windowWidth,
  windowHeight,
  setAppState,
  fetchBook,
}: BookPageProps): JSX.Element => {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'depth'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);

  const widthEm = windowWidth;
  const heightEm = windowHeight;
  const doubleView = widthEm > 115;

  const width = widthEm * 0.9;
  const bookTableWidth = 85;
  const chartWidthEm = width - bookTableWidth;
  const tableWidthXS = (bookTableWidth / width) * 12;
  const chartWidthXS = (chartWidthEm / width) * 12;

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
      <Grid item xs={12}>
        <Grid item xs={12}>
          <Typography component='h5' variant='h5'>
            {type == 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode: currencyDict[currency.toString()],
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode: currencyDict[currency.toString()],
                })}
          </Typography>
        </Grid>
        <br />
        <Grid item>
          <Button
            size='large'
            variant='contained'
            color='primary'
            onClick={() => setOpenMaker(true)}
          >
            {t('Make Order')}
          </Button>
        </Grid>
        <Typography color='primary' variant='body1'>
          <b>{t('Be the first one to create an order')}</b>
          <br />
          <br />
        </Typography>
      </Grid>
    );
  };

  interface MainViewProps {
    doubleView: boolean;
    widthEm: number;
    heightEm: number;
  }

  const MainView = function ({ doubleView, widthEm, heightEm }: MainViewProps) {
    if (doubleView) {
      return (
        <Grid
          container
          alignItems='center'
          justifyContent='flex-start'
          spacing={1}
          direction='row'
          style={{ width: `${widthEm}em`, position: 'relative', left: `${widthEm / 140}em` }}
        >
          <Grid item xs={tableWidthXS} style={{ width: `${bookTableWidth}em` }}>
            <BookTable
              loading={bookLoading}
              refreshing={bookRefreshing}
              clickRefresh={() => fetchBook(false, true)}
              orders={orders}
              type={type}
              currency={currency}
              maxWidth={bookTableWidth} // EM units
              maxHeight={heightEm * 0.8 - 5} // EM units
              fullWidth={widthEm} // EM units
              fullHeight={heightEm} // EM units
              defaultFullscreen={false}
              onCurrencyChange={handleCurrencyChange}
              onTypeChange={handleTypeChange}
              noResultsOverlay={NoOrdersFound}
            />
          </Grid>
          <Grid
            item
            xs={chartWidthXS}
            style={{ width: `${chartWidthEm}em`, position: 'relative', left: '-10em' }}
          >
            <DepthChart
              bookLoading={bookLoading}
              orders={orders}
              lastDayPremium={lastDayPremium}
              currency={currency}
              compact={true}
              setAppState={setAppState}
              limits={limits}
              maxWidth={chartWidthEm} // EM units
              maxHeight={heightEm * 0.8 - 5} // EM units
            />
          </Grid>
        </Grid>
      );
    } else {
      if (view === 'depth') {
        return (
          <DepthChart
            bookLoading={bookLoading}
            orders={orders}
            lastDayPremium={lastDayPremium}
            currency={currency}
            compact={true}
            setAppState={setAppState}
            limits={limits}
            maxWidth={widthEm * 0.8} // EM units
            maxHeight={heightEm * 0.8 - 5} // EM units
          />
        );
      } else {
        return (
          <BookTable
            loading={bookLoading}
            refreshing={bookRefreshing}
            clickRefresh={() => fetchBook(false, true)}
            orders={orders}
            type={type}
            currency={currency}
            maxWidth={widthEm * 0.97} // EM units
            maxHeight={heightEm * 0.8 - 5} // EM units
            fullWidth={widthEm} // EM units
            fullHeight={heightEm} // EM units
            defaultFullscreen={false}
            onCurrencyChange={handleCurrencyChange}
            onTypeChange={handleTypeChange}
            noResultsOverlay={NoOrdersFound}
          />
        );
      }
    }
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1} sx={{ minWidth: 400 }}>
      <Dialog open={openMaker} onClose={() => setOpenMaker(false)}>
        <Box sx={{ maxWidth: '18em', padding: '0.5em' }}>
          <MakerForm
            limits={limits}
            loadingLimits={loadingLimits}
            pricingMethods={false}
            setAppState={setAppState}
            maker={maker}
            setMaker={setMaker}
            type={type}
            currency={currency}
          />
        </Box>
      </Dialog>
      <Grid item xs={12}>
        {doubleView ? (
          <Grid
            container
            alignItems='center'
            justifyContent='flex-start'
            spacing={1}
            direction='row'
            style={{ width: `${widthEm}em`, position: 'relative', left: `${widthEm / 140}em` }}
          >
            <Grid item xs={tableWidthXS} style={{ width: `${bookTableWidth}em` }}>
              <BookTable
                loading={bookLoading}
                refreshing={bookRefreshing}
                clickRefresh={() => fetchBook(false, true)}
                orders={orders}
                type={type}
                currency={currency}
                maxWidth={bookTableWidth} // EM units
                maxHeight={heightEm * 0.8 - 5} // EM units
                fullWidth={widthEm} // EM units
                fullHeight={heightEm} // EM units
                defaultFullscreen={false}
                onCurrencyChange={handleCurrencyChange}
                onTypeChange={handleTypeChange}
                noResultsOverlay={NoOrdersFound}
              />
            </Grid>
            <Grid
              item
              xs={chartWidthXS}
              style={{ width: `${chartWidthEm}em`, position: 'relative', left: '-10em' }}
            >
              <DepthChart
                bookLoading={bookLoading}
                orders={orders}
                lastDayPremium={lastDayPremium}
                currency={currency}
                compact={true}
                setAppState={setAppState}
                limits={limits}
                maxWidth={chartWidthEm} // EM units
                maxHeight={heightEm * 0.8 - 5} // EM units
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
            maxWidth={widthEm * 0.8} // EM units
            maxHeight={heightEm * 0.8 - 5} // EM units
          />
        ) : (
          <BookTable
            loading={bookLoading}
            refreshing={bookRefreshing}
            clickRefresh={() => fetchBook(false, true)}
            orders={orders}
            type={type}
            currency={currency}
            maxWidth={widthEm * 0.97} // EM units
            maxHeight={heightEm * 0.8 - 5} // EM units
            fullWidth={widthEm} // EM units
            fullHeight={heightEm} // EM units
            defaultFullscreen={false}
            onCurrencyChange={handleCurrencyChange}
            onTypeChange={handleTypeChange}
            noResultsOverlay={NoOrdersFound}
          />
        )}
      </Grid>
      <Grid item xs={12}>
        <ButtonGroup variant='contained' aria-label='outlined primary button group'>
          {orders.length > 0 ? (
            <>
              <Button
                variant='contained'
                color='primary'
                color='primary'
                onClick={() => setOpenMaker(true)}
              >
                {t('Make Order')}
              </Button>
              {doubleView ? null : (
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
            </>
          ) : null}
          <Button color='secondary' variant='contained' to='/' component={Link}>
            {t('Back')}
          </Button>
        </ButtonGroup>
      </Grid>
    </Grid>
  );
};

export default BookPage;
