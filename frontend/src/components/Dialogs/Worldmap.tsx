import React, { useContext, useEffect, useState } from 'react';
import { apiClient } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { MapContainer, GeoJSON, useMapEvents, Circle, TileLayer } from 'react-leaflet';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  useTheme,
  Tooltip,
  Grid,
  LinearProgress,
} from '@mui/material';
import { WifiTetheringError } from '@mui/icons-material';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { GeoJsonObject } from 'geojson';
import { LatLng, LeafletEvent, LeafletMouseEvent } from 'leaflet';

interface Props {
  open: boolean;
  orderType: number;
  onClose: (position: LatLng) => void;
}

const WorldmapDialog = ({ open = false, orderType, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { baseUrl } = useContext<UseAppStoreType>(AppContext);
  const [worldmap, setWorldmap] = useState<GeoJsonObject | undefined>();
  const [position, setPosition] = useState<LatLng>();
  const [stealth, setStealth] = useState<boolean>(true);

  useEffect(() => {
    if (open && !worldmap) {
      apiClient
        .get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json')
        .then(setWorldmap);
    }
  }, [open]);

  const onSave = () => {
    if (position) onClose(position);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(event: LeafletMouseEvent) {
        setPosition(event.latlng);
      },
    });

    const color = orderType == 1 ? theme.palette.primary.main : theme.palette.secondary.main;

    return position ? (
      <Circle center={position} pathOptions={{ fillColor: color, color }} radius={10000}></Circle>
    ) : (
      <></>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='worldmap-dialog-title'
      aria-describedby='worldmap-description'
      maxWidth={false}
    >
      <DialogTitle>
        <Grid container justifyContent='space-between' spacing={0} sx={{ maxHeight: '1em' }}>
          <Grid item>{t('Choose a location')}</Grid>
          <Grid item>
            <Tooltip enterTouchDelay={0} placement='top' title={t('Enable advanced options')}>
              <div
                style={{
                  display: 'flex',
                  width: '4em',
                  height: '1.1em',
                }}
              >
                <Switch
                  size='small'
                  checked={stealth}
                  onChange={() => setStealth((value) => !value)}
                />
                <WifiTetheringError sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent style={{ height: '100vh', width: '80vw' }}>
        <MapContainer center={[0, 0]} zoom={3} style={{ height: '100%', width: '100%' }}>
          {stealth && !worldmap && <LinearProgress />}
          {stealth && worldmap && (
            <GeoJSON
              data={worldmap}
              style={{
                weight: 1,
                fillColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              }}
            />
          )}
          {!stealth && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
          )}
          <LocationMarker />
        </MapContainer>
      </DialogContent>
      <DialogActions>
        <Button color='primary' variant='contained' onClick={onSave} disabled={!position}>
          {t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorldmapDialog;
