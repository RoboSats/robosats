import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Grid, Paper, Collapse, Typography } from '@mui/material';
import { filterOrders, genBase62Token } from '../../utils';

import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';
import thirdParties from '../../../static/thirdparties.json';

import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { NoRobotDialog } from '../../components/Dialogs';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import VisitThirdParty from '../../components/Dialogs/VisitThirdParty';
import { type PublicOrder } from '../../models';

const MakerPage = (): React.JSX.Element => {
  const { windowSize, navbarHeight, navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage, maker } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mobileView = windowSize?.width < 50;

  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;
  const [showMatches, setShowMatches] = useState<boolean>(false);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);
  const [clickedOrder, setClickedOrder] = useState<{ id: number; shortAlias: string }>();
  const [openVisitThirdParty, setOpenVisitThirdParty] = useState<boolean>(false);
  const [thirdPartyOrder, setThirdPartyOrder] = useState<PublicOrder>();

  const matches = useMemo(() => {
    return filterOrders({
      federation,
      baseFilter: {
        currency: maker.currency === 0 ? 1 : maker.currency,
        type: maker.type,
        mode: maker.mode,
        coordinator: 'robosats',
      },
      premium: maker.premium ?? null,
      paymentMethods: maker.paymentMethods,
      amountFilter: {
        amount: maker.amount,
        minAmount: maker.minAmount,
        maxAmount: maker.maxAmount,
        threshold: 0.7,
      },
    });
  }, [
    federation.book,
    maker.currency,
    maker.type,
    maker.mode,
    maker.premium,
    maker.amount,
    maker.minAmount,
    maker.maxAmount,
    maker.paymentMethods,
  ]);

  const onOrderClicked = function (id: number, shortAlias: string): void {
    const thirdParty = thirdParties[shortAlias];
    if (thirdParty) {
      const thirdPartyOrder = Object.values(federation.book).find(
        (o) => o?.id === id && o?.coordinatorShortAlias === shortAlias,
      );
      if (thirdPartyOrder) {
        setThirdPartyOrder(thirdPartyOrder);
        setOpenVisitThirdParty(true);
      }
    } else {
      if (garage.getSlot()?.hashId) {
        navigateToPage(`order/${shortAlias}/${id}`, navigate);
      } else {
        setClickedOrder({ id, shortAlias });
        setOpenNoRobot(true);
      }
    }
  };

  const tableMaxWidth = mobileView ? windowSize.width * 0.8 : Math.min(windowSize.width, 60);
  const tableMaxHeight = Math.min(matches.length * 3.25 + 3, windowSize.height * 0.68);

  return (
    <Grid container direction='column' alignItems='center' spacing={1}>
      <VisitThirdParty
        open={openVisitThirdParty}
        onClose={() => {
          setOpenVisitThirdParty(false);
        }}
        thirdPartyOrder={thirdPartyOrder}
      />
      <NoRobotDialog
        open={openNoRobot}
        onClose={() => {
          setOpenNoRobot(false);
        }}
        onClickGenerateRobot={() => {
          const token = genBase62Token(36);
          garage
            .createRobot(federation, token)
            .then(() => {
              setOpenNoRobot(true);
              if (clickedOrder)
                navigateToPage(`order/${clickedOrder?.shortAlias}/${clickedOrder?.id}`, navigate);
            })
            .catch((e) => {
              console.log(e);
            });
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
                maxWidth={tableMaxWidth} // EM units
                maxHeight={tableMaxHeight} // EM units
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
            disableRequest={matches.length > 0 && !showMatches}
            collapseAll={showMatches}
            onSubmit={() => {
              setShowMatches(matches.length > 0);
            }}
            onReset={() => {
              setShowMatches(false);
            }}
            submitButtonLabel={matches.length > 0 && !showMatches ? 'Submit' : 'Create order'}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MakerPage;
