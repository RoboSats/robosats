import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Grid, Paper, Collapse, Typography } from '@mui/material';
import { filterOrders } from '../../utils';

import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';

import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { NoRobotDialog } from '../../components/Dialogs';

const MakerPage = (): JSX.Element => {
  const { robot, book, fav, maker, windowSize, navbarHeight, setOrder, setDelay } =
    useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;
  const [showMatches, setShowMatches] = useState<boolean>(false);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);

  const matches = useMemo(() => {
    return filterOrders({
      orders: book.orders,
      baseFilter: {
        currency: fav.currency === 0 ? 1 : fav.currency,
        type: fav.type,
        mode: fav.mode,
      },
      premium: Number(maker.premium) ?? null,
      paymentMethods: maker.paymentMethods,
      amountFilter: {
        amount: maker.amount,
        minAmount: maker.minAmount,
        maxAmount: maker.maxAmount,
        threshold: 0.7,
      },
    });
  }, [
    book.orders,
    fav,
    maker.premium,
    maker.amount,
    maker.minAmount,
    maker.maxAmount,
    maker.paymentMethods,
  ]);

  const onViewOrder = function (): void {
    setOrder(undefined);
    setDelay(10000);
  };

  const onOrderClicked = function (id: number): void {
    if (robot.avatarLoaded) {
      navigate(`/order/${id}`);
      onViewOrder();
    } else {
      setOpenNoRobot(true);
    }
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1}>
      <NoRobotDialog
        open={openNoRobot}
        onClose={() => {
          setOpenNoRobot(false);
        }}
        onClickGenerateRobot={() => {
          navigate('/robot');
        }}
      />
      <Grid item>
        <Collapse in={matches.length > 0 && showMatches}>
          <Grid container direction='column' alignItems='center' spacing={1}>
            <Grid item>
              <Typography variant='h5'>{t('Existing orders match yours!')}</Typography>
            </Grid>
            <Grid item>
              <BookTable
                orderList={matches}
                maxWidth={Math.min(windowSize.width, 60)} // EM units
                maxHeight={Math.min(matches.length * 3.25 + 3, 16)} // EM units
                defaultFullscreen={false}
                showControls={false}
                showFooter={false}
                showNoResults={false}
                onOrderClicked={onOrderClicked}
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
            onOrderCreated={(id) => {
              navigate(`/order/${id}`);
            }}
            disableRequest={matches.length > 0 && !showMatches}
            collapseAll={showMatches}
            onSubmit={() => {
              setShowMatches(matches.length > 0);
            }}
            onReset={() => {
              setShowMatches(false);
            }}
            submitButtonLabel={matches.length > 0 && !showMatches ? 'Submit' : 'Create order'}
            onClickGenerateRobot={() => {
              navigate('/robot');
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MakerPage;
