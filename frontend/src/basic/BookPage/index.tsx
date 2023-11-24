import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DepthChart from '../../components/Charts/DepthChart';

import { NoRobotDialog } from '../../components/Dialogs';
import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';

// Icons
import { BarChart, FormatListBulleted, Map } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import MapChart from '../../components/Charts/MapChart';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const BookPage = (): JSX.Element => {
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { setDelay } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'depth' | 'map'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);

  const doubleView = windowSize.width > 115;
  const width = windowSize.width * 0.9;
  const maxBookTableWidth = 85;
  const chartWidthEm = width - maxBookTableWidth;

  const onOrderClicked = function (id: number, shortAlias: string): void {
    if (garage.getSlot()?.avatarLoaded) {
      setDelay(10000);
      navigate(`/order/${shortAlias}/${id}`);
    } else {
      setOpenNoRobot(true);
    }
  };

  const NavButtons = function (): JSX.Element {
    return (
      <ButtonGroup variant='contained' color='inherit'>
        <Button
          color='primary'
          onClick={() => {
            setOpenMaker(true);
          }}
        >
          {t('Create')}
        </Button>
        {doubleView ? (
          <></>
        ) : (
          <>
            <Button
              onClick={() => {
                setView('list');
              }}
            >
              <FormatListBulleted /> {t('List')}
            </Button>
            <Button
              onClick={() => {
                setView('depth');
              }}
            >
              <BarChart /> {t('Chart')}
            </Button>
            <Button
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
      <NoRobotDialog
        open={openNoRobot}
        onClose={() => {
          setOpenNoRobot(false);
        }}
        onClickGenerateRobot={() => {
          navigate('/robot');
        }}
      />
      {openMaker ? (
        <Dialog
          open={openMaker}
          onClose={() => {
            setOpenMaker(false);
          }}
        >
          <Box sx={{ maxWidth: '18em', padding: '0.5em' }}>
            <MakerForm
              onOrderCreated={(id) => {
                navigate(`/order/${id}`);
              }}
              onClickGenerateRobot={() => {
                navigate('/robot');
              }}
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
            <Grid item justifyContent='space-between'>
              <Grid item>
                <DepthChart
                  maxWidth={chartWidthEm} // EM units
                  maxHeight={(windowSize.height * 0.825 - 5) / 2} // EM units
                  onOrderClicked={onOrderClicked}
                />
              </Grid>
              <Grid item>
                <MapChart
                  maxWidth={chartWidthEm} // EM units
                  maxHeight={(windowSize.height * 0.825 - 5) / 2} // EM units
                  onOrderClicked={onOrderClicked}
                />
              </Grid>
            </Grid>
          </Grid>
        ) : view === 'depth' ? (
          <DepthChart
            maxWidth={windowSize.width * 0.8} // EM units
            maxHeight={windowSize.height * 0.825 - 5} // EM units
            onOrderClicked={onOrderClicked}
          />
        ) : view === 'map' ? (
          <MapChart
            maxWidth={windowSize.width * 0.8} // EM units
            maxHeight={windowSize.height * 0.825 - 5} // EM units
            onOrderClicked={onOrderClicked}
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
