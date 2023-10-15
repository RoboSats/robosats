import React, { useContext, useEffect, useState } from 'react';
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
import { LatLng } from 'leaflet';

interface Props {
  open: boolean;
  orderType: number;
  latitude?: number;
  longitude?: number;
  onClose?: (position?: LatLng) => void;
  save?: boolean;
  zoom?: number;
}

const F2fMapDialog = ({
  open = false,
  orderType,
  onClose = () => {},
  latitude,
  longitude,
  save,
  zoom,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<LatLng>();
  const [useTiles, setUseTiles] = useState<boolean>(false);

  const onSave = () => {
    onClose(position);
  };

  useEffect(() => {
    if (open && latitude && longitude) {
      setPosition(new LatLng(latitude, longitude));
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
          <Grid item>{t(save ? 'Choose a location' : 'Map')}</Grid>
          <Grid item>
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
          orderType={orderType}
          useTiles={useTiles}
          position={position}
          setPosition={setPosition}
          zoom={zoom}
          center={[latitude ?? 0, longitude ?? 0]}
        />
      </DialogContent>
      <DialogActions>
        <Button color='primary' variant='contained' onClick={onSave} disabled={!position}>
          {save ? t('Save') : t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default F2fMapDialog;
