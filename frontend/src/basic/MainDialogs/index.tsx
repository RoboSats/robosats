import React, { useState, useContext, useEffect } from 'react';
import {
  CommunityDialog,
  CoordinatorSummaryDialog,
  InfoDialog,
  LearnDialog,
  ProfileDialog,
  StatsDialog,
  UpdateClientDialog,
} from '../../components/Dialogs';
import { pn } from '../../utils';
import { AppContext, UseAppStoreType, closeAll } from '../../contexts/AppContext';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: boolean;
  stats: boolean;
  update: boolean;
  profile: boolean;
}

const MainDialogs = (): JSX.Element => {
  const { open, setOpen, info, limits, robot, setRobot, setPage, setCurrentOrder, baseUrl } =
    useContext<UseAppStoreType>(AppContext);

  const [maxAmount, setMaxAmount] = useState<string>('...loading...');

  useEffect(() => {
    if (limits.list[1000]) {
      setMaxAmount(pn(limits.list[1000].max_amount * 100000000));
    }
  }, [limits.list]);

  useEffect(() => {
    if (info.openUpdateClient) {
      setOpen({ ...closeAll, update: true });
    }
  }, [info]);

  return (
    <>
      <UpdateClientDialog
        open={open.update}
        coordinatorVersion={info.coordinatorVersion}
        clientVersion={info.clientVersion}
        onClose={() => setOpen({ ...open, update: false })}
      />
      <InfoDialog
        open={open.info}
        maxAmount={maxAmount}
        onClose={() => setOpen({ ...open, info: false })}
      />
      <LearnDialog open={open.learn} onClose={() => setOpen({ ...open, learn: false })} />
      <CommunityDialog
        open={open.community}
        onClose={() => setOpen({ ...open, community: false })}
      />
      <CoordinatorSummaryDialog
        open={open.coordinator}
        onClose={() => setOpen({ ...open, coordinator: false })}
        info={info}
      />
      <StatsDialog
        open={open.stats}
        onClose={() => setOpen({ ...open, stats: false })}
        info={info}
      />
      <ProfileDialog
        open={open.profile}
        baseUrl={baseUrl}
        onClose={() => setOpen({ ...open, profile: false })}
        robot={robot}
        setRobot={setRobot}
        setPage={setPage}
        setCurrentOrder={setCurrentOrder}
      />
    </>
  );
};

export default MainDialogs;
