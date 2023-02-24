import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { useHistory } from 'react-router-dom';
import DepthChart from '../../components/Charts/DepthChart';

import { NoRobotDialog } from '../../components/Dialogs';
import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';
import { Page } from '../NavBar';
import { Book, Favorites, LimitList, Maker } from '../../models';

// Icons
import { BarChart, FormatListBulleted } from '@mui/icons-material';

interface BookPageProps {
  book: Book;
  limits: { list: LimitList; loading: boolean };
  fetchLimits: () => void;
  fav: Favorites;
  setFav: (state: Favorites) => void;
  onViewOrder: () => void;
  fetchBook: () => void;
  clearOrder: () => void;
  windowSize: { width: number; height: number };
  lastDayPremium: number;
  maker: Maker;
  setMaker: (state: Maker) => void;
  hasRobot: boolean;
  setPage: (state: Page) => void;
  setCurrentOrder: (state: number) => void;
  baseUrl: string;
}

const BookPage = ({
  lastDayPremium = 0,
  limits,
  book = { orders: [], loading: true },
  fetchBook,
  fetchLimits,
  clearOrder,
  fav,
  setFav,
  onViewOrder,
  maker,
  setMaker,
  windowSize,
  hasRobot = false,
  setPage = () => null,
  setCurrentOrder = () => null,
  baseUrl,
}: BookPageProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();
  const [view, setView] = useState<'list' | 'depth'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);

  const doubleView = windowSize.width > 115;
  const width = windowSize.width * 0.9;
  const maxBookTableWidth = 85;
  const chartWidthEm = width - maxBookTableWidth;

  useEffect(() => {
    if (book.orders.length < 1) {
      fetchBook(true, false);
    } else {
      fetchBook(false, true);
    }
  }, []);

  const onOrderClicked = function (id: number) {
    if (hasRobot) {
      history.push('/order/' + id);
      setPage('order');
      setCurrentOrder(id);
      onViewOrder();
    } else {
      setOpenNoRobot(true);
    }
  };

  const NavButtons = function () {
    return (
      <ButtonGroup variant='contained' color='inherit'>
        <Button color='primary' onClick={() => setOpenMaker(true)}>
          {t('Create')}
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
      </ButtonGroup>
    );
  };
  return (
    <Grid container direction='column' alignItems='center' spacing={1} sx={{ minWidth: 400 }}>
      <NoRobotDialog open={openNoRobot} onClose={() => setOpenNoRobot(false)} setPage={setPage} />
      {openMaker ? (
        <Dialog open={openMaker} onClose={() => setOpenMaker(false)}>
          <Box sx={{ maxWidth: '18em', padding: '0.5em' }}>
            <MakerForm
              limits={limits}
              fetchLimits={fetchLimits}
              maker={maker}
              setMaker={setMaker}
              fav={fav}
              setFav={setFav}
              setPage={setPage}
              hasRobot={hasRobot}
              onOrderCreated={(id) => {
                clearOrder();
                setCurrentOrder(id);
                setPage('order');
                history.push('/order/' + id);
              }}
              baseUrl={baseUrl}
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
                maxWidth={maxBookTableWidth} // EM units
                maxHeight={windowSize.height * 0.825 - 5} // EM units
                fullWidth={windowSize.width} // EM units
                fullHeight={windowSize.height} // EM units
                defaultFullscreen={false}
                onOrderClicked={onOrderClicked}
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
                onOrderClicked={onOrderClicked}
                baseUrl={baseUrl}
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
            onOrderClicked={onOrderClicked}
            baseUrl={baseUrl}
          />
        ) : (
          <BookTable
            maxWidth={windowSize.width * 0.97} // EM units
            maxHeight={windowSize.height * 0.825 - 5} // EM units
            fullWidth={windowSize.width} // EM units
            fullHeight={windowSize.height} // EM units
            defaultFullscreen={false}
            onOrderClicked={onOrderClicked}
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
