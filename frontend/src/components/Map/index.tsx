import React, { useContext, useEffect, useState } from 'react';
import { MapContainer, GeoJSON, useMapEvents, TileLayer, Tooltip, Marker } from 'react-leaflet';
import { useTheme, LinearProgress } from '@mui/material';
import { type GeoJsonObject } from 'geojson';
import { DivIcon, type LeafletMouseEvent } from 'leaflet';
import { type PublicOrder } from '../../models';
import OrderTooltip from '../Charts/helpers/OrderTooltip';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import getWorldmapGeojson from '../../geo/Web';
import { apiClient } from '../../services/api';

interface MapPinProps {
  fillColor: string;
  outlineColor: string;
  eyesColor: string;
}
const MapPin = ({ fillColor, outlineColor, eyesColor }: MapPinProps): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18.66 29.68">
      <path
        fill="${fillColor}"
        d="M18,8A9.13,9.13,0,0,0,10.89.62,10.88,10.88,0,0,0,9.33.49,10.88,10.88,0,0,0,7.77.62,9.13,9.13,0,0,0,.66,8a12.92,12.92,0,0,0,1.19,8.25C2.68,18.09,7.47,27.6,9.07,29c0,.12.11.19.19.19l.07,0,.07,0c.08,0,.15-.07.19-.19,1.6-1.41,6.39-10.92,7.22-12.8A12.92,12.92,0,0,0,18,8Z"
      />
      <path
        fill="${outlineColor}"
        d="M9.23,29.6a.57.57,0,0,1-.5-.35C7,27.57,2.24,18.09,1.48,16.38A13.57,13.57,0,0,1,.26,7.87C1.18,3.78,4,.92,7.7.23h0A8.38,8.38,0,0,1,11,.24h0c3.74.69,6.52,3.55,7.44,7.64a13.57,13.57,0,0,1-1.22,8.51c-.76,1.71-5.5,11.19-7.25,12.87a.57.57,0,0,1-.55.35H9.23ZM8,1,7.85,1a8.68,8.68,0,0,0-6.8,7C.5,10.52.86,13,2.22,16.05c.9,2,5.62,11.32,7.11,12.65,1.49-1.33,6.21-10.63,7.11-12.65,1.36-3.07,1.72-5.53,1.17-8h0a8.68,8.68,0,0,0-6.8-7l-.12,0A10.47,10.47,0,0,0,9.33.89,10.3,10.3,0,0,0,8,1Z"
      />

      <rect
        fill="${outlineColor}"
        x="3.12"
        y="6.34"
        width="12.53"
        height="7.76"
        rx="3.88"
      />
      <rect
        fill="${eyesColor}"
        x="5.02"
        y="7.82"
        width="2.16"
        height="2.34"
        rx="1.02"
      />
      <rect
        fill="${eyesColor}"
        x="11.25"
        y="7.82"
        width="2.16"
        height="2.34"
        rx="1.02"
      />
      <path
        fill="${eyesColor}"
        d="M9.24,12.76A3.57,3.57,0,0,1,7,12a.4.4,0,1,1,.53-.61,2.78,2.78,0,0,0,3.49,0,.4.4,0,0,1,.48.65A3.71,3.71,0,0,1,9.24,12.76Z"
      />
    </svg>
  `;
};

interface Props {
  orderType?: number;
  useTiles: boolean;
  position?: [number, number] | undefined;
  setPosition?: (position: [number, number]) => void;
  orders?: Record<string, PublicOrder | undefined>;
  onOrderClicked?: (id: number, shortAlias: string) => void;
  zoom?: number;
  center?: [number, number];
  interactive?: boolean;
}

const Map = ({
  orderType,
  position,
  zoom,
  orders = {},
  setPosition = () => {},
  useTiles = false,
  onOrderClicked = () => null,
  center = [0, 0],
  interactive = false,
}: Props): React.JSX.Element => {
  const theme = useTheme();
  const { hostUrl } = useContext<UseAppStoreType>(AppContext);
  const [worldmap, setWorldmap] = useState<GeoJsonObject>();

  useEffect(() => {
    getWorldmapGeojson(apiClient, hostUrl)
      .then((data) => {
        setWorldmap(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  const RobotMarker = (
    key: string | number,
    position: [number, number],
    orderType: number,
    order?: PublicOrder,
  ): React.JSX.Element => {
    const fillColor = orderType === 1 ? theme.palette.primary.main : theme.palette.secondary.main;
    const outlineColor = 'black';
    const eyesColor = 'white';

    return (
      <Marker
        key={key}
        position={position}
        icon={
          new DivIcon({
            html: MapPin({ fillColor, outlineColor, eyesColor }),
            iconAnchor: [14, 38],
            iconSize: [24, 24],
            className: '',
          })
        }
        eventHandlers={{
          click: () => {
            if (order?.id != null) onOrderClicked(order.id, order.coordinatorShortAlias ?? '');
          },
        }}
      >
        {order != null && (
          <Tooltip direction='top'>
            <OrderTooltip order={order} />
          </Tooltip>
        )}
      </Marker>
    );
  };

  const LocationMarker = (): React.JSX.Element => {
    useMapEvents({
      click(event: LeafletMouseEvent) {
        if (interactive) {
          setPosition([event.latlng.lat, event.latlng.lng]);
        }
      },
    });

    return position != null ? RobotMarker('marker', position, orderType ?? 0) : <></>;
  };

  const getOrderMarkers = (): React.JSX.Element => {
    if (Object.values(orders).length < 1) return <></>;
    return (
      <MarkerClusterGroup showCoverageOnHover={true} disableClusteringAtZoom={14}>
        {Object.values(orders).map((order) => {
          if (!(order?.latitude != null) || !(order?.longitude != null)) return <></>;
          return RobotMarker(order.id, [order.latitude, order.longitude], order.type ?? 0, order);
        })}
      </MarkerClusterGroup>
    );
  };

  return (
    <MapContainer
      maxZoom={15}
      center={center ?? [0, 0]}
      zoom={zoom ?? 1}
      attributionControl={false}
      style={{ height: '100%', width: '100%', backgroundColor: theme.palette.background.paper }}
    >
      {!useTiles && !worldmap && <LinearProgress />}
      {!useTiles && worldmap && (
        <GeoJSON
          data={worldmap}
          style={{
            weight: 1,
            fillColor: theme.palette.text.disabled,
            color: theme.palette.text.secondary,
          }}
        />
      )}
      {useTiles && (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          referrerPolicy='no-referrer'
        />
      )}
      {getOrderMarkers()}
      <LocationMarker />
    </MapContainer>
  );
};

export default Map;
