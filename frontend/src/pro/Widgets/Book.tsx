import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import BookTable from '../../components/BookTable';
import { type GridItem } from 'react-grid-layout';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

interface BookWidgetProps {
  layout: GridItem;
  gridCellSize?: number;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const BookWidget = React.forwardRef(function Component({
  layout,
  gridCellSize = 2,
}: BookWidgetProps) {
  const { windowSize, fav } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  return React.useMemo(() => {
    return (
      <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
        <BookTable
          elevation={0}
          maxWidth={layout.w * gridCellSize} // EM units
          maxHeight={layout.h * gridCellSize} // EM units
          fullWidth={windowSize.width} // EM units
          fullHeight={windowSize.height} // EM units
          defaultFullscreen={false}
        />
      </Paper>
    );
  }, [layout, windowSize, fav, federation.book]);
});

export default BookWidget;
