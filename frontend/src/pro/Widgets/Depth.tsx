import React from 'react';

import { Order, LimitList } from '../../models';
import { Paper, useTheme } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';

interface DepthChartWidgetProps {
  layout: any;
  gridCellSize: number;
  orders: PublicOrder[];
  currency: number;
  limitList: LimitList;
  windowSize: { width: number; height: number };
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
  baseUrl: string;
}

const DepthChartWidget = React.forwardRef(
  (
    {
      layout,
      gridCellSize,
      limitList,
      orders,
      baseUrl,
      currency,
      windowSize,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: DepthChartWidgetProps,
    ref,
  ) => {
    const theme = useTheme();
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
          <DepthChart
            baseUrl={baseUrl}
            elevation={0}
            orders={orders}
            currency={currency}
            limits={limitList}
            maxWidth={layout.w * gridCellSize} // EM units
            maxHeight={layout.h * gridCellSize} // EM units
            fillContainer={true}
          />
        </Paper>
      );
    }, [currency, orders, limitList, layout]);
  },
);

export default DepthChartWidget;
