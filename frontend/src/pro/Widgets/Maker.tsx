import React, { useContext } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

import MakerForm from '../../components/MakerForm';
import { Paper } from '@mui/material';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const MakerWidget = React.forwardRef(function Component() {
  const { fav } = useContext<UseAppStoreType>(AppContext);
  const { federationUpdatedAt } = useContext<UseFederationStoreType>(FederationContext);
  const { maker } = useContext<UseGarageStoreType>(GarageContext);
  return React.useMemo(() => {
    return (
      <Paper elevation={3} style={{ padding: 8, overflow: 'auto', width: '100%', height: '100%' }}>
        <MakerForm />
      </Paper>
    );
  }, [maker, fav, federationUpdatedAt]);
});

export default MakerWidget;
