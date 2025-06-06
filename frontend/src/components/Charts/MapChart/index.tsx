import React, { useContext, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Switch,
  Tooltip,
} from '@mui/material';
import Map from '../../Map';
import { PhotoSizeSelectActual } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';

interface MapChartProps {
  maxWidth: number;
  maxHeight: number;
  elevation?: number;
  onOrderClicked?: (id: number, shortAlias: string) => void;
}

const MapChart: React.FC<MapChartProps> = ({
  maxWidth,
  maxHeight,
  elevation = 6,
  onOrderClicked = () => {},
}) => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [useTiles, setUseTiles] = useState<boolean>(false);
  const [acceptedTilesWarning, setAcceptedTilesWarning] = useState<boolean>(false);
  const [openWarningDialog, setOpenWarningDialog] = useState<boolean>(false);

  const height = maxHeight < 5 ? 5 : maxHeight;
  const width = maxWidth < 10 ? 10 : maxWidth > 72.8 ? 72.8 : maxWidth;

  return (
    <Paper
      elevation={elevation}
      style={{
        width: `${width}em`,
        height: `${height}em`,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Dialog
        open={openWarningDialog}
        onClose={() => {
          setOpenWarningDialog(false);
        }}
      >
        <DialogTitle>{t('Download high resolution map?')}</DialogTitle>
        <DialogContent>
          {t(
            'By doing so, you will be fetching map tiles from a third-party provider. Depending on your setup, private information might be leaked to servers outside the RoboSats federation.',
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenWarningDialog(false);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            onClick={() => {
              setOpenWarningDialog(false);
              setAcceptedTilesWarning(true);
              setUseTiles(true);
            }}
          >
            {t('Accept')}
          </Button>
        </DialogActions>
      </Dialog>
      <Paper variant='outlined' style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
        {Object.values(federation.book).length < 1 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: `${(height - 3) / 2 - 1}em`,
              height: `${height - 4}em`,
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <>
            <Grid
              item
              style={{
                height: '3.1em',
                justifyContent: 'space-between',
                display: 'flex',
                paddingTop: '0.8em',
              }}
            >
              <b style={{ paddingLeft: '1em' }}>{t('Map')}</b>
              <Tooltip enterTouchDelay={0} placement='top' title={t('Show tiles')}>
                <div
                  style={{
                    display: 'flex',
                    width: '5em',
                    height: '1.1em',
                  }}
                >
                  <Switch
                    size='small'
                    checked={useTiles}
                    onChange={() => {
                      if (acceptedTilesWarning) {
                        setUseTiles((value) => !value);
                      } else {
                        setOpenWarningDialog(true);
                      }
                    }}
                  />
                  <PhotoSizeSelectActual sx={{ color: 'text.secondary' }} />
                </div>
              </Tooltip>
            </Grid>
            <div style={{ height: `${height - 3.2}em` }}>
              <Map
                useTiles={useTiles}
                orders={Object.values(federation.book)}
                onOrderClicked={onOrderClicked}
              />
            </div>
          </>
        )}
      </Paper>
    </Paper>
  );
};

export default MapChart;
