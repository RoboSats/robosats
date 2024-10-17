import React, {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  useContext,
  type ReactNode,
} from 'react';

import { Federation, Settings } from '../models';

import { federationLottery } from '../utils';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';
import Coordinator, { type Origin, type Origins } from '../models/Coordinator.model';

export interface CurrentOrderIdProps {
  id: number | null;
  shortAlias: string | null;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  sortedCoordinators: string[];
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
  addNewCoordinator: (alias: string, url: string) => void;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation('onion', new Settings(), ''),
  sortedCoordinators: [],
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
  addNewCoordinator: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): JSX.Element => {
  const { settings, page, origin, hostUrl, open, torStatus, client } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage } = useContext<UseGarageStoreType>(GarageContext);
  const [federation] = useState(new Federation(origin, settings, hostUrl));
  const [sortedCoordinators, setSortedCoordinators] = useState(federationLottery(federation));
  const [coordinatorUpdatedAt, setCoordinatorUpdatedAt] = useState<string>(
    new Date().toISOString(),
  );
  const [federationUpdatedAt, setFederationUpdatedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    setMaker((maker) => {
      return { ...maker, coordinator: sortedCoordinators[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    federation.registerHook('onFederationUpdate', () => {
      setFederationUpdatedAt(new Date().toISOString());
    });
  }, []);

  useEffect(() => {
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
      void federation.updateUrl(origin, settings, hostUrl);
      void federation.loadLimits();
    }
  }, [settings.network, settings.useProxy, torStatus]);

  useEffect(() => {
    federation.setConnection(settings);
  }, [settings.connection]);

  const addNewCoordinator: (alias: string, url: string) => void = (alias, url) => {
    if (!federation.coordinators[alias]) {
      const attributes: Record<any, any> = {
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
      const newCoordinator: Coordinator = federation.coordinators[alias];
      newCoordinator.loadLimits(() => {
        setCoordinatorUpdatedAt(new Date().toISOString());
      });
      garage.syncCoordinator(federation, alias);
      setSortedCoordinators(federationLottery(federation));
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
        sortedCoordinators,
        coordinatorUpdatedAt,
        federationUpdatedAt,
        addNewCoordinator,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
