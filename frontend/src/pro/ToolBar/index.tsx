import React from 'react';
import { Paper } from '@mui/material';

interface ToolBarProps {
  width: number;
}

const ToolBar = ({ width }: ToolBarProps): JSX.Element => {
  return (
    <Paper
      elevation={12}
      sx={{
        width: `100%`,
        height: '3em',
        textAlign: 'center',
        padding: '1em',
        borderRadius: 0,
      }}
    >
      ToolBar Goes Here!
    </Paper>
  );
};

export default ToolBar;
