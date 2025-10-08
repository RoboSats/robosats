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
import ThirdPartyDialog from '../../components/Dialogs/ThirdParty';
import SearchDialog from '../../components/Dialogs/Search';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: string;
  warning: boolean;
  exchange: boolean;
  client: boolean;
  update: boolean;
  profile: boolean;
  recovery: boolean;
  confirmCollabCancel: boolean;
  thirdParty: string;
  search: boolean;
}

const MainDialogs = (): React.JSX.Element => {
  const { open, setOpen, settings, clientVersion } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

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
      <ThirdPartyDialog
        open={Boolean(open.thirdParty)}
        onClose={() => {
          setOpen(closeAll);
        }}
        shortAlias={open.thirdParty}
      />
      <SearchDialog
        open={Boolean(open.search)}
        onClose={() => {
          setOpen(closeAll);
        }}
      />
    </>
  );
};

export default MainDialogs;
