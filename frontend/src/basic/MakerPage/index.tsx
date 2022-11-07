import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Grid, Paper, Collapse, Typography } from '@mui/material';

import { LimitList, Maker, Book, Favorites } from '../../models';

import { filterOrders } from '../../utils';

import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';

import { Page } from '../NavBar';

interface MakerPageProps {
  limits: { list: LimitList; loading: boolean };
  fetchLimits: () => void;
  book: Book;
  fav: Favorites;
  maker: Maker;
  setFav: (state: Favorites) => void;
  setMaker: (state: Maker) => void;
  windowSize: { width: number; height: number };
  hasRobot: boolean;
  setCurrentOrder: (state: number) => void;
  setPage: (state: Page) => void;
  baseUrl: string;
}

const MakerPage = ({
  limits,
  fetchLimits,
  book,
  fav,
  maker,
  setFav,
  setMaker,
  windowSize,
  setCurrentOrder,
  setPage,
  hasRobot = false,
  baseUrl,
}: MakerPageProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const maxHeight = windowSize.height * 0.85 - 3;
  const [showMatches, setShowMatches] = useState<boolean>(false);

  const matches = filterOrders({
    orders: book.orders,
    baseFilter: { currency: fav.currency === 0 ? 1 : fav.currency, type: fav.type },
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
                book={book}
                maxWidth={Math.min(windowSize.width, 60)} // EM units
                maxHeight={Math.min(matches.length * 3.25 + 3.25, 16)} // EM units
                defaultFullscreen={false}
                showControls={false}
                showFooter={false}
                showNoResults={false}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
      <Grid item>
        <Paper
          elevation={12}
          style={{
            padding: '0.6em',
            width: '17.25em',
            maxHeight: `${maxHeight}em`,
            overflow: 'auto',
          }}
        >
          <MakerForm
            limits={limits}
            fetchLimits={fetchLimits}
            fav={fav}
            setFav={setFav}
            maker={maker}
            setMaker={setMaker}
            onOrderCreated={(id) => {
              setCurrentOrder(id);
              setPage('order');
              history.push('/order/' + id);
            }}
            hasRobot={hasRobot}
            disableRequest={matches.length > 0 && !showMatches}
            collapseAll={showMatches}
            onSubmit={() => setShowMatches(matches.length > 0)}
            onReset={() => setShowMatches(false)}
            submitButtonLabel={matches.length > 0 && !showMatches ? 'Submit' : 'Create order'}
            setPage={setPage}
            baseUrl={baseUrl}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MakerPage;
