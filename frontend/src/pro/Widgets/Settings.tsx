import React from 'react';

import { Settings } from '../../models';
import { Paper, useTheme } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';

interface SettingsWidgetProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
  style?: Object;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const SettingsWidget = React.forwardRef(
  (
    {
      settings,
      setSettings,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchEnd,
    }: SettingsWidgetProps,
    ref,
  ) => {
    const theme = useTheme();
    return React.useMemo(() => {
      return (
        <Paper
          elevation={3}
          style={{ width: '100%', height: '100%', position: 'relative', top: '0.6em', left: '0em' }}
        >
          <SettingsForm dense={true} settings={settings} setSettings={setSettings} />
        </Paper>
      );
    }, [settings]);
  },
);

export default SettingsWidget;
