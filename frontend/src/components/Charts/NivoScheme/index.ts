import { light } from '@mui/material/styles/createPalette';
import { palette } from '@mui/system';
import { Theme as NivoTheme } from '@nivo/core';
import { Theme as MuiTheme } from './createTheme';

export const getNivoScheme: (theme: MuiTheme) => NivoTheme = (theme) => {
  const lightMode = {
    markers: {
      lineColor: 'rgb(0, 0, 0)',
      lineStrokeWidth: 1,
    },
    axis: {
      ticks: {
        line: {
          strokeWidth: '1',
          stroke: 'rgb(0, 0, 0)',
        },
      },
      domain: {
        line: {
          strokeWidth: '1',
          stroke: 'rgb(0, 0, 0)',
        },
      },
    },
  };

  const darkMode = {
    markers: {
      lineColor: 'rgb(255, 255, 255)',
      lineStrokeWidth: 1,
    },
    axis: {
      ticks: {
        text: {
          fill: 'rgb(255, 255, 255)',
        },
        line: {
          strokeWidth: '1',
          stroke: 'rgb(255, 255, 255)',
        },
      },
      domain: {
        line: {
          strokeWidth: '1',
          stroke: 'rgb(255, 255, 255)',
        },
      },
    },
    crosshair: {
      line: {
        strokeWidth: 1,
        stroke: 'rgb(255, 255, 255)',
      },
    },
  };

  return theme.palette.mode === 'dark' ? darkMode : lightMode;
};

export default getNivoScheme;
