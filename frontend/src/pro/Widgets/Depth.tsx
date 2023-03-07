import React, { useContext } from 'react';
import { AppContext, AppContextProps } from '../../contexts/AppContext';
import { Paper, useTheme } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';

interface DepthChartWidgetProps {
  layout: any;
  gridCellSize: number;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const DepthChartWidget = React.forwardRef(
  (
    {
      layout,
      gridCellSize,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: DepthChartWidgetProps,
    ref,
  ) => {
    const theme = useTheme();
    const { fav, book, limits, exchange } = useContext<AppContextProps>(AppContext);
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
          <DepthChart
            elevation={0}
            maxWidth={layout.w * gridCellSize} // EM units
            maxHeight={layout.h * gridCellSize} // EM units
            fillContainer={true}
          />
        </Paper>
      );
    }, [fav.currency, book, limits, layout]);
  },
);

export default DepthChartWidget;
