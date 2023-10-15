import React, { useContext, useEffect, useState } from 'react';
import { apiClient } from '../../services/api';
import { MapContainer, GeoJSON, useMapEvents, Circle, TileLayer, Tooltip } from 'react-leaflet';
import { useTheme, LinearProgress } from '@mui/material';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { GeoJsonObject } from 'geojson';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { PublicOrder } from '../../models';
import OrderTooltip from '../Charts/helpers/OrderTooltip';

interface Props {
  orderType?: number;
  useTiles: boolean;
  position?: LatLng | undefined;
  setPosition?: (position: LatLng) => void;
  orders?: PublicOrder[];
  onOrderClicked?: (id: number) => void;
  zoom?: number;
  center: [number, number];
}

const Map = ({
  orderType,
  position,
  zoom,
  orders = [],
  setPosition = () => {},
  useTiles = false,
  onOrderClicked = () => null,
  center,
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

  const getOrderMarkers = () => {
    return orders.map((order) => {
      if (!order.latitude || !order.longitude) return <></>;

      const color = order.type == 1 ? theme.palette.primary.main : theme.palette.secondary.main;
      return (
        <Circle
          key={order.id}
          center={[order.latitude, order.longitude]}
          pathOptions={{ fillColor: color, color }}
          radius={10000}
          eventHandlers={{
            click: (_event: LeafletMouseEvent) => onOrderClicked(order.id),
          }}
        >
          <Tooltip direction='top'>
            <OrderTooltip order={order} />
          </Tooltip>
        </Circle>
      );
    });
  };

  return (
    <MapContainer
      center={center ?? [0, 0]}
      zoom={zoom ? zoom : 2}
      style={{ height: '100%', width: '100%' }}
    >
      {!useTiles && !worldmap && <LinearProgress />}
      {!useTiles && worldmap && (
        <>
          <GeoJSON
            data={worldmap}
            style={{
              weight: 1,
              fillColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
            }}
          />
          {getOrderMarkers()}
        </>
      )}
      {useTiles && (
        <>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {getOrderMarkers()}
        </>
      )}
      <LocationMarker />
    </MapContainer>
  );
};

export default Map;
