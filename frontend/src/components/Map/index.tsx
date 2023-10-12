import React, { useContext, useEffect, useState } from 'react';
import { apiClient } from '../../services/api';
import { MapContainer, GeoJSON, useMapEvents, Circle, TileLayer } from 'react-leaflet';
import { useTheme, LinearProgress } from '@mui/material';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { GeoJsonObject } from 'geojson';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { PublicOrder } from '../../models';

interface Props {
  orderType?: number;
  lowQuality: boolean;
  position?: LatLng | undefined;
  setPosition?: (position: LatLng) => void;
  orders?: PublicOrder[];
}

const Map = ({
  orderType,
  position,
  orders = [],
  setPosition = () => {},
  lowQuality = true,
}: Props): JSX.Element => {
  const theme = useTheme();
  const { baseUrl } = useContext<UseAppStoreType>(AppContext);
  const [worldmap, setWorldmap] = useState<GeoJsonObject | undefined>();

  useEffect(() => {
    if (!worldmap) {
      apiClient
        .get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json')
        .then(setWorldmap);
    }
  }, []);

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
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
      {lowQuality && !worldmap && <LinearProgress />}
      {lowQuality && worldmap && (
        <GeoJSON
          data={worldmap}
          style={{
            weight: 1,
            fillColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          }}
        />
      )}
      {!lowQuality && (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
      )}
      <LocationMarker />
      <>
        {orders.map((order) => {
          if (!order.latitude || !order.longitude) return <></>;

          const color = order.type == 1 ? theme.palette.primary.main : theme.palette.secondary.main;
          return (
            <Circle
              center={[order.latitude, order.longitude]}
              pathOptions={{ fillColor: color, color }}
              radius={10000}
            ></Circle>
          );
        })}
      </>
    </MapContainer>
  );
};

export default Map;
