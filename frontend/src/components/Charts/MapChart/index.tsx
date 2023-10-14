import React, { useContext, useState } from 'react';
import { CircularProgress, Grid, Paper, Switch, Tooltip } from '@mui/material';
import Map from '../../Map';
import { AppContext, UseAppStoreType } from '../../../contexts/AppContext';
import { WifiTetheringError } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MapChartProps {
  maxWidth: number;
  maxHeight: number;
  fillContainer?: boolean;
  elevation?: number;
  onOrderClicked?: (id: number) => void;
}

const MapChart: React.FC<MapChartProps> = ({
  maxWidth,
  maxHeight,
  fillContainer = false,
  elevation = 6,
  onOrderClicked = () => {},
}) => {
  const { t } = useTranslation();
  const { book } = useContext<UseAppStoreType>(AppContext);
  const [lowQuality, setLowQuality] = useState<boolean>(true);

  const height = maxHeight < 20 ? 20 : maxHeight;
  const width = maxWidth < 20 ? 20 : maxWidth > 72.8 ? 72.8 : maxWidth;

  return (
    <Paper
      elevation={elevation}
      style={
        fillContainer
          ? { width: '100%', maxHeight: '100%', height: '100%' }
          : { width: `${width}em`, maxHeight: `${height}em` }
      }
    >
      <Paper variant='outlined' style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
        {false ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: `${(height - 3) / 2 - 1}em`,
              height: `${height}em`,
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <>
            <Grid
              item
              style={{ height: 50, justifyContent: 'center', display: 'flex', paddingTop: 10 }}
            >
              <Tooltip
                enterTouchDelay={0}
                placement='top'
                title={t('Activate slow mode (use it when the connection is slow)')}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '4em',
                    height: '1.1em',
                  }}
                >
                  <Switch
                    size='small'
                    checked={lowQuality}
                    onChange={() => setLowQuality((value) => !value)}
                  />
                  <WifiTetheringError sx={{ color: 'text.secondary' }} />
                </div>
              </Tooltip>
            </Grid>
            <div style={{ height: `${height - 3.1}em` }}>
              <Map lowQuality={lowQuality} orders={book.orders} onOrderClicked={onOrderClicked} />
            </div>
          </>
        )}
      </Paper>
    </Paper>
  );
};

export default MapChart;
