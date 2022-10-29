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
  closeAll: OpenDialogs;
}

const MainDialogs = ({
  open,
  setOpen,
  info,
  closeAll,
  robot,
  setRobot,
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
        numPublicBuyOrders={info.num_public_buy_orders}
        numPublicSellOrders={info.num_public_sell_orders}
        bookLiquidity={info.book_liquidity}
        activeRobotsToday={info.active_robots_today}
        lastDayNonkycBtcPremium={info.last_day_nonkyc_btc_premium}
        makerFee={info.maker_fee}
        takerFee={info.taker_fee}
        swapFeeRate={info.current_swap_fee_rate}
      />
      <StatsDialog
        open={open.stats}
        onClose={() => setOpen({ ...open, stats: false })}
        coordinatorVersion={info.coordinatorVersion}
        clientVersion={info.clientVersion}
        lndVersion={info.lnd_version}
        network={info.network}
        nodeAlias={info.node_alias}
        nodeId={info.node_id}
        alternativeName={info.alternative_name}
        alternativeSite={info.alternative_site}
        commitHash={info.robosats_running_commit_hash}
        lastDayVolume={info.last_day_volume}
        lifetimeVolume={info.lifetime_volume}
      />
      <ProfileDialog
        open={open.profile}
        onClose={() => setOpen({ ...open, profile: false })}
        robot={robot}
        setRobot={setRobot}
      />
    </>
  );
};

export default MainDialogs;
