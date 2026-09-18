import React from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';

// Matrix [m] logo — the two square brackets enclosing a stylized m
const Matrix: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon sx={props.sx} color={props.color} viewBox='0 0 75 75'>
      {/* Left bracket */}
      <rect x='0' y='0' width='6' height='75' />
      <rect x='0' y='0' width='18' height='6' />
      <rect x='0' y='69' width='18' height='6' />
      {/* Right bracket */}
      <rect x='69' y='0' width='6' height='75' />
      <rect x='57' y='0' width='18' height='6' />
      <rect x='57' y='69' width='18' height='6' />
      {/* m glyph — two humps */}
      <rect x='12' y='22' width='6' height='34' />
      <rect x='18' y='16' width='12' height='6' />
      <rect x='30' y='22' width='6' height='34' />
      <rect x='36' y='16' width='12' height='6' />
      <rect x='48' y='22' width='6' height='34' />
      <rect x='18' y='22' width='12' height='6' />
      <rect x='36' y='22' width='12' height='6' />
    </SvgIcon>
  );
};

export default Matrix;
