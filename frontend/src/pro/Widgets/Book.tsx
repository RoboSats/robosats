import React from 'react';

import { Book, Favorites } from '../../models';
import { Paper, useTheme } from '@mui/material';
import BookTable from '../../components/BookTable';

interface BookWidgetProps {
  baseUrl: string;
  layout: any;
  gridCellSize?: number;
  book: Book;
  fetchBook: () => void;
  fav: Favorites;
  setFav: (state: Favorites) => void;
  windowSize: { width: number; height: number };
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
      baseUrl,
      gridCellSize = 2,
      book,
      fetchBook,
      fav,
      setFav,
      windowSize,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: BookWidgetProps,
    ref,
  ) => {
    const theme = useTheme();
    return React.useMemo(() => {
      return (
        <Paper elevation={3} style={{ width: '100%', height: '100%' }}>
          <BookTable
            baseUrl={baseUrl}
            elevation={0}
            clickRefresh={() => fetchBook()}
            book={book}
            fav={fav}
            fillContainer={true}
            maxWidth={layout.w * gridCellSize} // EM units
            maxHeight={layout.h * gridCellSize} // EM units
            fullWidth={windowSize.width} // EM units
            fullHeight={windowSize.height} // EM units
            defaultFullscreen={false}
            onCurrencyChange={(e) => setFav({ ...fav, currency: e.target.value })}
            onTypeChange={(mouseEvent, val) => setFav({ ...fav, type: val })}
          />
        </Paper>
      );
    }, [book, layout, windowSize, fav]);
  },
);

export default BookWidget;
