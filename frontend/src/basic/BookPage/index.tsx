import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, ButtonGroup, Dialog, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DepthChart from '../../components/Charts/DepthChart';

import { NoRobotDialog } from '../../components/Dialogs';
import MakerForm from '../../components/MakerForm';
import BookTable from '../../components/BookTable';

// Icons
import { BarChart, FormatListBulleted } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

const BookPage = (): JSX.Element => {
  const { robot, fetchFederationBook, windowSize, setDelay, clearOrder } =
    useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'depth'>('list');
  const [openMaker, setOpenMaker] = useState<boolean>(false);
  const [openNoRobot, setOpenNoRobot] = useState<boolean>(false);

  const doubleView = windowSize.width > 115;
  const width = windowSize.width * 0.9;
  const maxBookTableWidth = 85;
  const chartWidthEm = width - maxBookTableWidth;

  useEffect(() => {
    fetchFederationBook();
  }, []);

  const onOrderClicked = function (id: number, shortAlias: string): void {
    if (robot.avatarLoaded) {
      clearOrder();
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
          <Button
            onClick={() => {
              setView(view === 'depth' ? 'list' : 'depth');
            }}
          >
            {view === 'depth' ? (
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
            <Grid item>
              <DepthChart
                maxWidth={chartWidthEm} // EM units
                maxHeight={windowSize.height * 0.825 - 5} // EM units
                onOrderClicked={onOrderClicked}
              />
            </Grid>
          </Grid>
        ) : view === 'depth' ? (
          <DepthChart
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
