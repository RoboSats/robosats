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
import { FederationContext, UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, UseGarageStoreType } from '../../contexts/GarageContext';

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
  const { limits, federation, focusedCoordinator, exchange } =
    useContext<UseFederationStoreType>(FederationContext);
  const { robot, setRobot } = useContext<UseGarageStoreType>(GarageContext);

  const [maxAmount, setMaxAmount] = useState<string>('...loading...');

  useEffect(() => {
    if (limits.list[1000] !== undefined) {
      setMaxAmount(pn(limits.list[1000].max_amount * 100000000));
    }
  }, [limits.list]);

  return (
    <>
      <UpdateDialog
        coordinatorVersion={exchange.info.version}
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
        robot={robot}
        setRobot={setRobot}
      />
      <CoordinatorDialog
        open={open.coordinator}
        network={settings.network}
        onClose={() => {
          setOpen(closeAll);
        }}
        coordinator={federation[focusedCoordinator]}
      />
    </>
  );
};

export default MainDialogs;
