import React, { createContext, useEffect, useState, useContext, type ReactNode } from 'react';
import { Event, nip17 } from 'nostr-tools';

import { Federation, Settings } from '../models';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';
import arraysAreDifferent from '../utils/array';

export interface CurrentOrderIdProps {
  id: number | null;
  shortAlias: string | null;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  notifications: Record<string, Map<string, Event[]>>;
  loadingNotifications: boolean;
  updateConnection: (settings: Settings) => void;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation('onion', new Settings(), ''),
  notifications: {},
  loadingNotifications: true,
  updateConnection: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): React.JSX.Element => {
  const {
    settings,
    page,
    origin,
    hostUrl,
    torStatus,
    client,
    fav,
    slotUpdatedAt,
    setFederationUpdatedAt,
    setNotificationsUpdatedAt,
  } = useContext<UseAppStoreType>(AppContext);
  const { garage, setMaker } = useContext<UseGarageStoreType>(GarageContext);
  const [federation] = useState(new Federation(origin, settings, hostUrl));
  const [subscribedTokens, setSubscribedTokens] = React.useState<string[]>([]);
  const [notifications, setNotifications] = useState<Record<string, Map<string, Event[]>>>({});
  const [loadingNotifications, setLoadingNotifications] = React.useState<boolean>(true);

  const updateConnection = (settings: Settings) => {
    federation.setConnection(origin, settings, hostUrl, fav.coordinator);
  };

  const loadNotifications = () => {
    const tokens = Object.keys(garage.slots);

    if (!arraysAreDifferent(subscribedTokens, tokens) || tokens.length === 0) {
      setLoadingNotifications(false);
      return;
    }

    setNotifications({});
    setSubscribedTokens(tokens);

    federation.roboPool.subscribeNotifications(garage, {
      onevent: (event: Event) => {
        const petPubkey = event.tags.find((t) => t[0] === 'p')?.[1] ?? '';

        setNotifications((notifications) => {
          const robotNotifications = notifications[petPubkey] ?? new Map<string, Event[]>();

          if (robotNotifications.has(event.id)) {
            return notifications;
          }

          const hexPubKey = event.tags.find((t) => t[0] == 'p')?.[1];
          const slot = Object.values(garage.slots).find((s) => s.nostrPubKey == hexPubKey);

          if (slot?.nostrSecKey) {
            setNotificationsUpdatedAt(new Date().toISOString());
            const rumor = nip17.unwrapEvent(event, slot.nostrSecKey);
            const newRobotNotifications = new Map(robotNotifications);
            newRobotNotifications.set(event.id, [event, rumor as Event]);
            return { ...notifications, [petPubkey]: newRobotNotifications };
          }

          return notifications;
        });
      },
      oneose: () => setLoadingNotifications(false),
    });
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
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
      loadNotifications();
    }
  }, [slotUpdatedAt]);

  useEffect(() => {
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
      updateConnection(settings);
      loadNotifications();
    }
  }, [settings.network, settings.useProxy, torStatus, settings.connection]);

  useEffect(() => {
    if (page === 'offers') void federation.loadBook();
  }, [page]);

  return (
    <FederationContext.Provider
      value={{
        federation,
        notifications,
        loadingNotifications,
        updateConnection,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
