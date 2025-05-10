import React from 'react';

import { Paper, Typography } from '@mui/material';

interface PlaceholderWidgetProps {
  label?: string;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const PlaceholderWidget = React.forwardRef(function Component({
  label = 'Placeholder',
}: PlaceholderWidgetProps) {
  return React.useMemo(() => {
    return (
      <Paper elevation={3} style={{ width: '100%', height: '100%', padding: '1em' }}>
        <Typography align='center' variant='h6'>
          {label}
        </Typography>
      </Paper>
    );
  }, []);
});

export default PlaceholderWidget;
