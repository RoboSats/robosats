import React from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';

const CataloniaFlag: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} x='0px' y='0px' viewBox='0 0 810 540'>
      <rect width='810' height='540' fill='#FCDD09' />
      <path stroke='#DA121A' strokeWidth='60' d='M0,90H810m0,120H0m0,120H810m0,120H0' />
    </SvgIcon>
  );
};

export default CataloniaFlag;
