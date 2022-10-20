import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { useHistory } from 'react-router-dom';
import currencyDict from '../../../static/assets/currencies.json';
import DepthChart from '../Charts/DepthChart';

import { Book, Favorites, LimitList, Maker } from '../../models';

// Icons
import { BarChart, FormatListBulleted } from '@mui/icons-material';
import BookTable from './BookTable';
import { MakerForm } from '../MakerPage';

interface BookPageProps {
  book: Book;
  limits: { list: LimitList; loading: boolean };
  fetchLimits: () => void;
  fav: Favorites;
  setFav: (state: Favorites) => void;
  fetchBook: () => void;
  windowSize: { width: number; height: number };
  lastDayPremium: number;
  maker: Maker;
  setMaker: (state: Maker) => void;
}

const BookPage = ({
  lastDayPremium = 0,
  limits,
  book = { orders: [], loading: true },
  fetchBook,
  fetchLimits,
  fav,
  setFav,
  maker,
  setMaker,
  windowSize,
}: BookPageProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();
  const [view, setView] = useState<'list' | 'depth'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);

  const doubleView = windowSize.width > 115;
  const width = windowSize.width * 0.9;
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

  useEffect(() => {
    if (book.orders.length < 1) {
      fetchBook(true, false);
    } else {
      fetchBook(false, true);
    }
  }, []);

  const handleCurrencyChange = function (e) {
    const currency = e.target.value;
    setFav({ ...fav, currency });
  };

  const handleTypeChange = function (mouseEvent, val) {
    setFav({ ...fav, type: val });
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
            {fav.type == 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency == 0 ? t('ANY') : currencyDict[fav.currency.toString()],
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency == 0 ? t('ANY') : currencyDict[fav.currency.toString()],
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
              pricingMethods={false}
              maker={maker}
              setMaker={setMaker}
              fav={fav}
              setFav={setFav}
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
            style={{ width: `${windowSize.width}em` }}
          >
            <Grid item>
              <BookTable
                clickRefresh={() => fetchBook()}
                book={book}
                fav={fav}
                maxWidth={maxBookTableWidth} // EM units
                maxHeight={windowSize.height * 0.825 - 5} // EM units
                fullWidth={windowSize.width} // EM units
                fullHeight={windowSize.height} // EM units
                defaultFullscreen={false}
                onCurrencyChange={handleCurrencyChange}
                onTypeChange={handleTypeChange}
                noResultsOverlay={NoOrdersFound}
              />
            </Grid>
            <Grid item>
              <DepthChart
                orders={book.orders}
                lastDayPremium={lastDayPremium}
                currency={fav.currency}
                limits={limits.list}
                maxWidth={chartWidthEm} // EM units
                maxHeight={windowSize.height * 0.825 - 5} // EM units
              />
            </Grid>
          </Grid>
        ) : view === 'depth' ? (
          <DepthChart
            orders={book.orders}
            lastDayPremium={lastDayPremium}
            currency={fav.currency}
            limits={limits.list}
            maxWidth={windowSize.width * 0.8} // EM units
            maxHeight={windowSize.height * 0.825 - 5} // EM units
          />
        ) : (
          <BookTable
            book={book}
            clickRefresh={() => fetchBook()}
            fav={fav}
            maxWidth={windowSize.width * 0.97} // EM units
            maxHeight={windowSize.height * 0.825 - 5} // EM units
            fullWidth={windowSize.width} // EM units
            fullHeight={windowSize.height} // EM units
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
