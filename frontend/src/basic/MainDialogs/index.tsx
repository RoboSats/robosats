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
import { AppContext, AppContextProps } from '../../contexts/AppContext';

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
}

const MainDialogs = (): JSX.Element => {
  const {
    open,
    setOpen,
    info,
    limits,
    closeAll,
    robot,
    setRobot,
    setPage,
    setCurrentOrder,
    baseUrl,
    settings,
    federation,
    clientVersion,
    focusedCoordinator,
  } = useContext<AppContextProps>(AppContext);

  const [maxAmount, setMaxAmount] = useState<string>('...loading...');

  useEffect(() => {
    if (limits.list[1000]) {
      setMaxAmount(pn(limits.list[1000].max_amount * 100000000));
    }
  }, [limits.list]);

  return (
    <>
      <UpdateDialog
        coordinatorVersion={info.version}
        clientVersion={clientVersion.semver}
        onClose={() => setOpen(closeAll)}
      />
      <AboutDialog open={open.info} maxAmount={maxAmount} onClose={() => setOpen(closeAll)} />
      <LearnDialog open={open.learn} onClose={() => setOpen({ ...open, learn: false })} />
      <CommunityDialog open={open.community} onClose={() => setOpen(closeAll)} />
      <ExchangeDialog
        federation={federation}
        open={open.exchange}
        onClose={() => setOpen(closeAll)}
        info={info}
      />
      <ClientDialog open={open.client} onClose={() => setOpen({ ...open, client: false })} />
      <ProfileDialog
        open={open.profile}
        baseUrl={baseUrl}
        onClose={() => setOpen(closeAll)}
        robot={robot}
        setRobot={setRobot}
        setPage={setPage}
        setCurrentOrder={setCurrentOrder}
      />
      <CoordinatorDialog
        open={open.coordinator}
        network={settings.network}
        onClose={() => setOpen(closeAll)}
        coordinator={federation[focusedCoordinator]}
        baseUrl={baseUrl}
      />
    </>
  );
};

export default MainDialogs;
