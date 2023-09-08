import React, { useState, useContext, useEffect } from 'react';
import {
  CommunityDialog,
  CoordinatorSummaryDialog,
  InfoDialog,
  LearnDialog,
  ProfileDialog,
  StatsDialog,
  UpdateClientDialog,
  NoticeDialog,
} from '../../components/Dialogs';
import { pn } from '../../utils';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: boolean;
  stats: boolean;
  update: boolean;
  profile: boolean;
  notice: boolean;
}

const MainDialogs = (): JSX.Element => {
  const { open, setOpen, info, limits, robot, setRobot, setCurrentOrder, baseUrl } =
    useContext<UseAppStoreType>(AppContext);

  const [maxAmount, setMaxAmount] = useState<string>('...loading...');

  useEffect(() => {
    if (limits.list[1000]) {
      setMaxAmount(pn(limits.list[1000].max_amount * 100000000));
    }
  }, [limits.list]);

  useEffect(() => {
    if (info.openUpdateClient) {
      setOpen((open) => {
        return { ...open, update: true };
      });
    }
  }, [info]);

  useEffect(() => {
    if (!info.loading && info.notice_severity !== 'none' && info.notice_message !== '') {
      setOpen((open) => {
        return { ...open, notice: true };
      });
    }
  }, [info]);

  return (
    <>
      <UpdateClientDialog
        open={open.update}
        coordinatorVersion={info.coordinatorVersion}
        clientVersion={info.clientVersion}
        onClose={() => {
          setOpen({ ...open, update: false });
        }}
      />
      <NoticeDialog
        open={open.notice}
        severity={info.notice_severity}
        message={info.notice_message}
        onClose={() => {
          setOpen({ ...open, notice: false });
        }}
      />
      <InfoDialog
        open={open.info}
        maxAmount={maxAmount}
        onClose={() => {
          setOpen({ ...open, info: false });
        }}
      />
      <LearnDialog
        open={open.learn}
        onClose={() => {
          setOpen({ ...open, learn: false });
        }}
      />
      <CommunityDialog
        open={open.community}
        onClose={() => {
          setOpen({ ...open, community: false });
        }}
      />
      <CoordinatorSummaryDialog
        open={open.coordinator}
        onClose={() => {
          setOpen({ ...open, coordinator: false });
        }}
        info={info}
      />
      <StatsDialog
        open={open.stats}
        onClose={() => {
          setOpen({ ...open, stats: false });
        }}
        info={info}
      />
      <ProfileDialog
        open={open.profile}
        baseUrl={baseUrl}
        onClose={() => {
          setOpen({ ...open, profile: false });
        }}
        robot={robot}
        setRobot={setRobot}
        setCurrentOrder={setCurrentOrder}
      />
    </>
  );
};

export default MainDialogs;
