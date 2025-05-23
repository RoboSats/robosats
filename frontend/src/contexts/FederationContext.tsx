import React, { createContext, useEffect, useState, useContext, type ReactNode } from 'react';

import { Federation, Settings } from '../models';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';
import type Coordinator from '../models/Coordinator.model';
import { type Origin, type Origins } from '../models/Coordinator.model';

export interface CurrentOrderIdProps {
  id: number | null;
  shortAlias: string | null;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
  addNewCoordinator: (alias: string, url: string) => void;
}

const initialFederation = new Federation('onion', new Settings(), '');

export const initialFederationContext: UseFederationStoreType = {
  federation: initialFederation,
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
  addNewCoordinator: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): React.JSX.Element => {
  const { settings, page, origin, hostUrl, open, torStatus, client, fav } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage } = useContext<UseGarageStoreType>(GarageContext);
  const [federation] = useState(initialFederationContext.federation);
  const [coordinatorUpdatedAt, setCoordinatorUpdatedAt] = useState<string>(
    new Date().toISOString(),
  );
  const [federationUpdatedAt, setFederationUpdatedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    setMaker((maker) => {
      return { ...maker, coordinator: federation.getCoordinatorsAlias()[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    federation.registerHook('onFederationUpdate', () => {
      setFederationUpdatedAt(new Date().toISOString());
    });
  }, []);

  useEffect(() => {
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
      federation.setConnection(origin, settings, hostUrl, fav.coordinator);
    }
  }, [settings.network, settings.useProxy, torStatus, settings.connection]);

  const addNewCoordinator: (alias: string, url: string) => void = (alias, url) => {
    if (!federation.getCoordinator(alias)) {
      const attributes: object = {
        longAlias: alias,
        shortAlias: alias,
        federated: false,
        enabled: true,
      };
      const origins: Origins = {
        clearnet: undefined,
        onion: url as Origin,
        i2p: undefined,
      };
      if (settings.network === 'mainnet') {
        attributes.mainnet = origins;
      } else {
        attributes.testnet = origins;
      }
      federation.addCoordinator(origin, settings, hostUrl, attributes);
      const newCoordinator: Coordinator = federation.getCoordinator(alias);
      newCoordinator.loadLimits(() => {
        setCoordinatorUpdatedAt(new Date().toISOString());
      });
      garage.syncCoordinator(federation, alias);
      setFederationUpdatedAt(new Date().toISOString());
    }
  };

  useEffect(() => {
    if (page === 'offers') void federation.loadBook();
  }, [page]);

  // use effects to fetchRobots on Profile open
  useEffect(() => {
    const slot = garage.getSlot();

    if (open.profile && slot?.hashId && slot?.token) {
      void garage.fetchRobot(federation, slot?.token); // refresh/update existing robot
    }
  }, [open.profile]);

  return (
    <FederationContext.Provider
      value={{
        federation,
        coordinatorUpdatedAt,
        federationUpdatedAt,
        addNewCoordinator,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
