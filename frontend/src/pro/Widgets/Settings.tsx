import React, { useContext } from 'react';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { Paper } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';

const SettingsWidget = React.forwardRef(function Component() {
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
});

export default SettingsWidget;
