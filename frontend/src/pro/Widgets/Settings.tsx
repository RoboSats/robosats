import React, { useContext } from 'react';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { Settings } from '../../models';
import { Paper } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';

interface SettingsWidgetProps {
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const SettingsWidget = React.forwardRef(
  ({ style, className, onMouseDown, onMouseUp, onTouchEnd }: SettingsWidgetProps, ref) => {
    const { settings } = useContext<UseAppStoreType>(AppContext);
    return React.useMemo(() => {
      return (
        <Paper
          elevation={3}
          style={{ width: '100%', height: '100%', position: 'relative', top: '0.6em', left: '0em' }}
        >
          <SettingsForm dense={true} />
        </Paper>
      );
    }, [settings]);
  },
);

export default SettingsWidget;
