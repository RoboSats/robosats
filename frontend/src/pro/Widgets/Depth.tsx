import React from 'react';

import { Order, LimitList } from '../../models';
import { Paper, useTheme } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';

interface DepthChartWidgetProps {
  layout: any;
  orders: Order[];
  currency: number;
  limitList: LimitList;
  windowSize: { width: number; height: number };
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
      limitList,
      orders,
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
            elevation={0}
            orders={orders}
            currency={currency}
            limits={limitList}
            maxWidth={(windowSize.width / 48) * layout.w} // EM units
            maxHeight={(layout.h * theme.typography.fontSize * 2.5) / theme.typography.fontSize} // EM units
            fillContainer={true}
          />
        </Paper>
      );
    }, [currency, orders, limitList, layout]);
  },
);

export default DepthChartWidget;
