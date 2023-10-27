import React from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';

const AmbossIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} x='0px' y='0px' viewBox='0 0 95.7 84.9'>
      <g id='Layer_2_00000052094167160547307180000012226084410257483709_'>
        <g id='Layer_1-2'>
          <linearGradient
            id='SVGID_1_'
            gradientUnits='userSpaceOnUse'
            x1='0'
            y1='42.45'
            x2='95.7'
            y2='42.45'
          >
            <stop offset='0' style={{ stopColor: '#925bc9' }} />
            <stop offset='1' style={{ stopColor: '#ff59ac' }} />
          </linearGradient>
          <path
            className={'amboss'}
            d='M55.3,84.9V61.3h-15v23.6H0V0h95.7v84.9H55.3z M55.3,28.1h-15v17.1h15V28.1z'
          />
        </g>
      </g>
    </SvgIcon>
  );
};

export default AmbossIcon;
