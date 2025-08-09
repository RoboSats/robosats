import React, { createContext, useEffect, useState, useContext, type ReactNode } from 'react';

import { Federation, Settings } from '../models';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';

export interface CurrentOrderIdProps {
  id: number | null;
  shortAlias: string | null;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  federationUpdatedAt: string;
  setFederationUpdatedAt: (federationUpdatedAt: string) => void;
  updateConnection: (settings: Settings) => void;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation('onion', new Settings(), ''),
  federationUpdatedAt: '',
  setFederationUpdatedAt: () => {},
  updateConnection: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): React.JSX.Element => {
  const { settings, page, origin, hostUrl, torStatus, client, fav } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker } = useContext<UseGarageStoreType>(GarageContext);
  const [federation] = useState(new Federation(origin, settings, hostUrl));
  const [federationUpdatedAt, setFederationUpdatedAt] = useState<string>(new Date().toISOString());

  const updateConnection = (settings: Settings) => {
    federation.setConnection(origin, settings, hostUrl, fav.coordinator);
  };

  useEffect(() => {
    setMaker((maker) => {
      return { ...maker, coordinator: federation.getCoordinatorsAlias()[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    federation.registerHook('onFederationUpdate', () => {
      setFederationUpdatedAt(new Date().toISOString());
    });
  }, []);

  useEffect(() => {
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) updateConnection(settings);
  }, [settings.network, settings.useProxy, torStatus, settings.connection]);

  useEffect(() => {
    if (page === 'offers') void federation.loadBook();
  }, [page]);

  return (
    <FederationContext.Provider
      value={{
        federation,
        federationUpdatedAt,
        setFederationUpdatedAt,
        updateConnection,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
