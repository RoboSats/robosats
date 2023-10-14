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
import { WifiTetheringError } from '@mui/icons-material';
import Map from '../Map';
import { LatLng } from 'leaflet';
import { Maker } from '../../models';

interface Props {
  open: boolean;
  orderType: number;
  onClose: (position?: LatLng) => void;
  maker: Maker;
}

const F2fMapDialog = ({ open = false, orderType, onClose, maker }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<LatLng>();
  const [lowQuality, setLowQuality] = useState<boolean>(true);

  const onSave = () => {
    onClose(position);
  };

  useEffect(() => {
    if (open) {
      if (maker.latitude && maker.longitude)
        setPosition(new LatLng(maker.latitude, maker.longitude));
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
          <Grid item>{t('Choose a location')}</Grid>
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
                  checked={lowQuality}
                  onChange={() => setLowQuality((value) => !value)}
                />
                <WifiTetheringError sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent style={{ height: '100vh', width: '80vw' }}>
        <Map
          orderType={orderType}
          lowQuality={lowQuality}
          position={position}
          setPosition={setPosition}
        />
      </DialogContent>
      <DialogActions>
        <Button color='primary' variant='contained' onClick={onSave} disabled={!position}>
          {t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default F2fMapDialog;
