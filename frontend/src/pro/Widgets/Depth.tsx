import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';
import { type Layout } from 'react-grid-layout';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

interface DepthChartWidgetProps {
  layout: Layout;
  gridCellSize: number;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const DepthChartWidget = React.forwardRef(function Component({
  layout,
  gridCellSize,
}: DepthChartWidgetProps) {
  const { fav } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  return React.useMemo(() => {
    return (
      <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
        <DepthChart
          elevation={0}
          maxWidth={layout.w * gridCellSize} // EM units
          maxHeight={layout.h * gridCellSize} // EM units
        />
      </Paper>
    );
  }, [fav.currency, layout, federation.exchange]);
});

export default DepthChartWidget;
