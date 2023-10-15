import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const LocationPin: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon sx={props.sx} color={props.color} viewBox='0 0 21.67 29.99'>
      <rect x='9.95' y='10.67' width='1.77' height='19.33' rx='0.88' />
      <path d='M10.84,21.67A10.84,10.84,0,1,1,21.67,10.84,10.85,10.85,0,0,1,10.84,21.67ZM10.84,2a8.84,8.84,0,1,0,8.83,8.84A8.84,8.84,0,0,0,10.84,2Z' />
      <rect fill={props.color} x='1' y='1' width='19.67' height='19.67' rx='9.84' />
    </SvgIcon>
  );
};

export default LocationPin;
