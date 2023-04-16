import React, { useContext } from 'react';
import { AppContext, AppContextProps } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import { GridItem } from 'react-grid-layout';
import FederationTable from '../../components/FederationTable';

interface FederationWidgetProps {
  layout: GridItem;
  gridCellSize: number;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const FederationWidget = React.forwardRef(
  (
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
  ) => {
    const {
      federation,
      // setFederation,
      setFocusedCoordinator,
      open,
      setOpen,
      baseUrl,
    } = useContext<AppContextProps>(AppContext);
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
          <FederationTable
            federation={federation}
            // setFederation={setFederation}
            setFocusedCoordinator={setFocusedCoordinator}
            openCoordinator={() => setOpen({ ...open, coordinator: true })}
            baseUrl={baseUrl}
            maxWidth={layout.w * gridCellSize} // EM units
            maxHeight={layout.h * gridCellSize} // EM units
          />
        </Paper>
      );
    }, [federation]);
  },
);

export default FederationWidget;
