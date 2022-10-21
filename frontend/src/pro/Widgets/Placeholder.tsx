import React from 'react';

import { styled } from '@mui/material/styles';

const PlaceholderWidget = styled('div')(
  ({ theme }) => `
    background-color: rgb(128,128,128,0.3);
    color: ${theme.palette.text.primary};
    font-size: ${theme.typography.fontSize};
    text-align: center;
    vertical-align: center;
    padding: 1em;
    border-radius: 0.3em;
  `,
);

export default PlaceholderWidget;
