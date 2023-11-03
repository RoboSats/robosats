import React, { useContext } from 'react';
import { AppContext, type AppContextProps } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { Paper } from '@mui/material';
import { type GridItem } from 'react-grid-layout';
import FederationTable from '../../components/FederationTable';

interface FederationWidgetProps {
  layout: GridItem;
  gridCellSize: number;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const FederationWidget = React.forwardRef(function Component(
  {
    layout,
    gridCellSize,
    style,
    className,
    onMouseDown,
    onMouseUp,
    onTouchEnd,
  }: FederationWidgetProps,
  ref,
) {
  const { open, setOpen } = useContext<AppContextProps>(AppContext);
  const { federation, setFocusedCoordinator, coordinatorUpdatedAt } =
    useContext<UseFederationStoreType>(FederationContext);

  return React.useMemo(() => {
    return (
      <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
        <FederationTable
          openCoordinator={() => setOpen({ ...open, coordinator: true })}
          maxWidth={layout.w * gridCellSize} // EM units
          maxHeight={layout.h * gridCellSize} // EM units
        />
      </Paper>
    );
  }, [federation, coordinatorUpdatedAt]);
});

export default FederationWidget;
