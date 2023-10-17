import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Tooltip,
  Grid,
} from '@mui/material';
import { PhotoSizeSelectActual } from '@mui/icons-material';
import Map from '../Map';
import { randomNumberBetween } from '@mui/x-data-grid/utils/utils';

interface Props {
  open: boolean;
  orderType: number;
  latitude?: number;
  longitude?: number;
  onClose?: (position?: [number, number]) => void;
  interactive?: boolean;
  zoom?: number;
}

const F2fMapDialog = ({
  open = false,
  orderType,
  onClose = () => {},
  latitude,
  longitude,
  interactive,
  zoom,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<[number, number]>();
  const [useTiles, setUseTiles] = useState<boolean>(false);

  const onSave = () => {
    if (position && position[0] && position[1]) {
      const randomAggregator = randomNumberBetween(Math.random(), -0.005, 0.005);
      onClose([position[0] + randomAggregator(), position[1] + randomAggregator()]);
    }
  };

  useEffect(() => {
    if (open && latitude && longitude) {
      setPosition([latitude, longitude]);
    } else {
      setPosition(undefined);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      aria-labelledby='worldmap-dialog-title'
      aria-describedby='worldmap-description'
      maxWidth={false}
    >
      <DialogTitle>
        <Grid container justifyContent='space-between' spacing={0} sx={{ maxHeight: '1em' }}>
          <Grid item>{t(interactive ? 'Choose a location' : 'Map')}</Grid>
          <Grid item>
            <Tooltip enterTouchDelay={0} placement='top' title={t('Show tiles')}>
              <div
                style={{
                  display: 'flex',
                  width: '4em',
                  height: '1.1em',
                }}
              >
                <Switch
                  size='small'
                  checked={useTiles}
                  onChange={() => setUseTiles((value) => !value)}
                />
                <PhotoSizeSelectActual sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent style={{ height: '100vh', width: '80vw' }}>
        <Map
          interactive={interactive}
          orderType={orderType}
          useTiles={useTiles}
          position={position}
          setPosition={setPosition}
          zoom={zoom}
          center={[latitude ?? 0, longitude ?? 0]}
        />
      </DialogContent>
      <DialogActions>
        {interactive ? (
          <Tooltip
            enterTouchDelay={0}
            placement='top'
            title={t(
              'To protect your privacy, your selection will be slightly randomized without losing accuracy',
            )}
          >
            <Button color='primary' variant='contained' onClick={onSave} disabled={!position}>
              {t('Save')}
            </Button>
          </Tooltip>
        ) : (
          <Button
            color='primary'
            variant='contained'
            onClick={() => onClose()}
            disabled={!position}
          >
            {t('Close')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default F2fMapDialog;
