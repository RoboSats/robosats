import React from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';

const BasqueCountryFlag: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} x='0px' y='0px' viewBox='0 0 50 28'>
      <path d='M0,0 v28 h50 v-28 z' fill='#D52B1E' />
      <path d='M0,0 L50,28 M50,0 L0,28' stroke='#009B48' strokeWidth='4.3' />
      <path d='M25,0 v28 M0,14 h50' stroke='#fff' strokeWidth='4.3' />
    </SvgIcon>
  );
};

export default BasqueCountryFlag;
