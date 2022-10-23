import React from 'react';

import { Paper, Typography, useTheme } from '@mui/material';

interface PlaceholderWidgetProps {
  label?: string;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const PlaceholderWidget = React.forwardRef(
  (
    {
      label = 'Placeholder',
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: PlaceholderWidgetProps,
    ref,
  ) => {
    const theme = useTheme();
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%', padding: '1em' }}>
          <Typography align='center' variant='h6'>
            {label}
          </Typography>
        </Paper>
      );
    }, []);
  },
);

export default PlaceholderWidget;
