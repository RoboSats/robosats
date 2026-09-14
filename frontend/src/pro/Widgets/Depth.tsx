import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import DepthChart from '../../components/Charts/DepthChart';
import { type LayoutItem } from 'react-grid-layout';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

interface DepthChartWidgetProps {
  layout: LayoutItem | undefined;
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
      <Paper
        elevation={3}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <DepthChart
          elevation={0}
          maxWidth={(layout?.w ?? 0) * gridCellSize}
          maxHeight={(layout?.h ?? 0) * gridCellSize}
          fillContainer={true}
        />
      </Paper>
    );
  }, [fav.currency, layout, federation.exchange]);
});

export default DepthChartWidget;
