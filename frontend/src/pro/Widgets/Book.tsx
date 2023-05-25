import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

import { type Book, type Favorites } from '../../models';
import { Paper } from '@mui/material';
import BookTable from '../../components/BookTable';
import { type GridItem } from 'react-grid-layout';

interface BookWidgetProps {
  layout: GridItem;
  gridCellSize?: number;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const BookWidget = React.forwardRef(
  (
    {
      layout,
      gridCellSize = 2,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: BookWidgetProps,
    ref,
  ) => {
    const { book, windowSize, fav } = useContext<UseAppStoreType>(AppContext);
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
          <BookTable
            elevation={0}
            fillContainer={true}
            maxWidth={layout.w * gridCellSize} // EM units
            maxHeight={layout.h * gridCellSize} // EM units
            fullWidth={windowSize.width} // EM units
            fullHeight={windowSize.height} // EM units
            defaultFullscreen={false}
          />
        </Paper>
      );
    }, [book, layout, windowSize, fav]);
  },
);

export default BookWidget;
