import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';

interface DepthChartWidgetProps {
  layout: any;
  gridCellSize: number;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const DepthChartWidget = React.forwardRef(function Component(
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
) {
  const { fav, book, limits, exchange } = useContext<UseAppStoreType>(AppContext);
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
  }, [fav.currency, book, limits, exchange, layout]);
});

export default DepthChartWidget;
