import React, { useState, useContext, useEffect } from 'react';
import {
  CommunityDialog,
  ExchangeDialog,
  CoordinatorDialog,
  AboutDialog,
  LearnDialog,
  ProfileDialog,
  ClientDialog,
  UpdateDialog,
} from '../../components/Dialogs';
import { pn } from '../../utils';
import { AppContext, type UseAppStoreType, closeAll } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: boolean;
  exchange: boolean;
  client: boolean;
  update: boolean;
  profile: boolean;
  notice: boolean;
}

const MainDialogs = (): JSX.Element => {
  const { open, setOpen, settings, clientVersion, hostUrl } =
    useContext<UseAppStoreType>(AppContext);
  const { federation, focusedCoordinator, coordinatorUpdatedAt } =
    useContext<UseFederationStoreType>(FederationContext);

  const [maxAmount, setMaxAmount] = useState<string>('...loading...');

  useEffect(() => {
    if (focusedCoordinator) {
      const limits = federation.getCoordinator(focusedCoordinator).limits;
      if (limits[1000] !== undefined) {
        setMaxAmount(pn(limits[1000].max_amount * 100000000));
      }
    }
  }, [coordinatorUpdatedAt]);

  return (
    <>
      <UpdateDialog
        coordinatorVersion={federation.exchange.info.version}
        clientVersion={clientVersion.semver}
        onClose={() => {
          setOpen((open) => {
            return { ...open, update: false };
          });
        }}
      />
      <AboutDialog
        open={open.info}
        maxAmount={maxAmount}
        onClose={() => {
          setOpen((open) => {
            return { ...open, info: false };
          });
        }}
      />
      <LearnDialog
        open={open.learn}
        onClose={() => {
          setOpen((open) => {
            return { ...open, learn: false };
          });
        }}
      />
      <CommunityDialog
        open={open.community}
        onClose={() => {
          setOpen((open) => {
            return { ...open, community: false };
          });
        }}
      />
      <ExchangeDialog
        open={open.exchange}
        onClose={() => {
          setOpen((open) => {
            return { ...open, exchange: false };
          });
        }}
      />
      <ClientDialog
        open={open.client}
        onClose={() => {
          setOpen((open) => {
            return { ...open, client: false };
          });
        }}
      />
      <ProfileDialog
        open={open.profile}
        baseUrl={hostUrl}
        onClose={() => {
          setOpen({ ...open, profile: false });
        }}
      />
      <CoordinatorDialog
        open={open.coordinator}
        network={settings.network}
        onClose={() => {
          setOpen(closeAll);
        }}
        coordinator={focusedCoordinator ? federation.getCoordinator(focusedCoordinator) : null}
      />
    </>
  );
};

export default MainDialogs;
