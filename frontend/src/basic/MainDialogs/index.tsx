import React, { useContext } from 'react';
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
import { AppContext, type UseAppStoreType, closeAll } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: string;
  exchange: boolean;
  client: boolean;
  update: boolean;
  profile: boolean;
  notice: boolean;
}

const MainDialogs = (): JSX.Element => {
  const { open, setOpen, settings, clientVersion, hostUrl } =
    useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

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
        maxAmount={'100000'} //FIXME About dialog shoul allow to change coordinator
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
        open={Boolean(open.coordinator)}
        network={settings.network}
        onClose={() => {
          setOpen(closeAll);
        }}
        shortAlias={open.coordinator}
      />
    </>
  );
};

export default MainDialogs;
