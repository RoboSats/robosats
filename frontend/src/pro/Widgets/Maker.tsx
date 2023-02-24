import React, { useContext } from 'react';

import MakerForm from '../../components/MakerForm';
import { LimitList, Maker, Favorites } from '../../models';
import { Paper } from '@mui/material';
import { AppContext, AppContextProps } from '../../contexts/AppContext';

interface MakerWidgetProps {
  limits: { list: LimitList; loading: boolean };
  fetchLimits: () => void;
  fav: Favorites;
  maker: Maker;
  setFav: (state: Favorites) => void;
  setMaker: (state: Maker) => void;
  baseUrl: string;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const MakerWidget = React.forwardRef(
  ({ style, className, onMouseDown, onMouseUp, onTouchEnd }: MakerWidgetProps, ref) => {
    const { maker, fav, limits } = useContext<AppContextProps>(AppContext);
    return React.useMemo(() => {
      return (
        <Paper
          elevation={3}
          style={{ padding: 8, overflow: 'auto', width: '100%', height: '100%' }}
        >
          <MakerForm />
        </Paper>
      );
    }, [maker, limits, fav]);
  },
);

export default MakerWidget;
