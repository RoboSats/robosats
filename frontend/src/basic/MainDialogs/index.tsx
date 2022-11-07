import React, { useEffect } from 'react';
import { Info, Robot } from '../../models';
import {
  CommunityDialog,
  CoordinatorSummaryDialog,
  InfoDialog,
  LearnDialog,
  ProfileDialog,
  StatsDialog,
  UpdateClientDialog,
} from '../../components/Dialogs';
import { Page } from '../NavBar';

export interface OpenDialogs {
  more: boolean;
  learn: boolean;
  community: boolean;
  info: boolean;
  coordinator: boolean;
  stats: boolean;
  update: boolean;
  profile: boolean; // temporary until new Robot Page is ready
}

interface MainDialogsProps {
  open: OpenDialogs;
  setOpen: (state: OpenDialogs) => void;
  info: Info;
  robot: Robot;
  setRobot: (state: Robot) => void;
  setPage: (state: Page) => void;
  setCurrentOrder: (state: number) => void;
  closeAll: OpenDialogs;
}

const MainDialogs = ({
  open,
  setOpen,
  info,
  closeAll,
  robot,
  setRobot,
  setPage,
  setCurrentOrder,
}: MainDialogsProps): JSX.Element => {
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
        maxAmount='4,000,000'
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
