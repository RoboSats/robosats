import React from 'react';

import { Book, Favorites } from '../../models';
import { Paper, useTheme } from '@mui/material';
import BookTable from '../../components/BookTable';

interface BookWidgetProps {
  layout: any;
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
        <Paper elevation={6} style={{ width: '100%', height: '100%' }}>
          <BookTable
            elevation={0}
            clickRefresh={() => fetchBook()}
            book={book}
            fav={fav}
            fillContainer={true}
            maxWidth={(windowSize.width / 48) * layout.w} // EM units
            maxHeight={(layout.h * 30) / theme.typography.fontSize} // EM units
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
