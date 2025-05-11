import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, ButtonGroup, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DepthChart from '../../components/Charts/DepthChart';
import BookTable from '../../components/BookTable';

// Icons
import { BarChart, FormatListBulleted, Map } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import MapChart from '../../components/Charts/MapChart';
import thirdParties from '../../../static/thirdparties.json';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import VisitThirdParty from '../../components/Dialogs/VisitThirdParty';
import { type PublicOrder } from '../../models';

const BookPage = (): React.JSX.Element => {
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'depth' | 'map'>('list');
  const [openVisitThirdParty, setOpenVisitThirdParty] = useState<boolean>(false);
  const [thirdPartyOrder, setThirdPartyOrder] = useState<PublicOrder>();

  const doubleView = windowSize.width > 100;
  const width = windowSize.width * 0.85;
  const maxBookTableWidth = width * 0.65;
  const chartWidthEm = width * 0.3;
  const fontSize = theme.typography.fontSize;

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
      navigate(`/order/${shortAlias}/${id}`);
    }
  };

  const NavButtons = function (): React.JSX.Element {
    return (
      <ButtonGroup variant='contained' color='inherit'>
        {doubleView ? (
          <></>
        ) : (
          <>
            <Button
              color={view === 'list' ? 'primary' : 'inherit'}
              variant='contained'
              onClick={() => {
                setView('list');
              }}
            >
              <FormatListBulleted /> {t('List')}
            </Button>
            <Button
              color={view === 'depth' ? 'primary' : 'inherit'}
              variant='contained'
              onClick={() => {
                setView('depth');
              }}
            >
              <BarChart /> {t('Chart')}
            </Button>
            <Button
              color={view === 'map' ? 'primary' : 'inherit'}
              variant='contained'
              onClick={() => {
                setView('map');
              }}
            >
              <Map /> {t('Map')}
            </Button>
          </>
        )}
      </ButtonGroup>
    );
  };

  return (
    <Grid container direction='column' alignItems='center' spacing={1} sx={{ minWidth: 400 }}>
      <VisitThirdParty
        open={openVisitThirdParty}
        onClose={() => {
          setOpenVisitThirdParty(false);
        }}
        thirdPartyOrder={thirdPartyOrder}
      />
      <Grid item xs={12}>
        {doubleView ? (
          <Grid
            container
            alignItems='center'
            justifyContent='center'
            spacing={1}
            direction='row'
            style={{ width: `${width}em`, height: `${windowSize.height * 0.875}em` }}
          >
            <Grid>
              <BookTable
                maxWidth={maxBookTableWidth} // EM units
                maxHeight={windowSize.height * 0.78} // EM units
                fullWidth={windowSize.width} // EM units
                fullHeight={windowSize.height} // EM units
                defaultFullscreen={false}
                onOrderClicked={onOrderClicked}
              />
            </Grid>
            <Grid>
              <Grid item style={{ marginBottom: 8 }}>
                <DepthChart
                  maxWidth={chartWidthEm} // EM units
                  maxHeight={(windowSize.height * 0.78) / 2 - 5 / fontSize} // EM units
                  onOrderClicked={onOrderClicked}
                />
              </Grid>
              <Grid item>
                <MapChart
                  maxWidth={chartWidthEm} // EM units
                  maxHeight={(windowSize.height * 0.78) / 2 - 4 / fontSize} // EM units
                  onOrderClicked={onOrderClicked}
                />
              </Grid>
            </Grid>
          </Grid>
        ) : view === 'depth' ? (
          <DepthChart
            maxWidth={windowSize.width * 0.8} // EM units
            maxHeight={windowSize.height * 0.72} // EM units
            onOrderClicked={onOrderClicked}
          />
        ) : view === 'map' ? (
          <MapChart
            maxWidth={windowSize.width * 0.8} // M units
            maxHeight={windowSize.height * 0.72} // EM units
            onOrderClicked={onOrderClicked}
          />
        ) : (
          <BookTable
            maxWidth={windowSize.width * 0.8} // EM units
            maxHeight={windowSize.height * 0.72} // EM units
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
