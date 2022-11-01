import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Tabs, Tab, Paper, useTheme, Tooltip } from '@mui/material';
import MoreTooltip from './MoreTooltip';

import { OpenDialogs } from '../MainDialogs';

import { Page } from '.';

import {
  SettingsApplications,
  SmartToy,
  Storefront,
  AddBox,
  Assignment,
  MoreHoriz,
} from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';

type Direction = 'left' | 'right' | undefined;

interface NavBarProps {
  page: Page;
  nickname?: string | null;
  setPage: (state: Page) => void;
  setSlideDirection: (state: { in: Direction; out: Direction }) => void;
  width: number;
  height: number;
  open: OpenDialogs;
  setOpen: (state: OpenDialogs) => void;
  closeAll: OpenDialogs;
  currentOrder: number | null;
  hasRobot: boolean;
}

const NavBar = ({
  page,
  setPage,
  setSlideDirection,
  open,
  nickname = null,
  setOpen,
  closeAll,
  width,
  height,
  currentOrder,
  hasRobot = false,
}: NavBarProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();
  const history = useHistory();
  const smallBar = width < 50;

  const tabSx = smallBar
    ? { position: 'relative', bottom: nickname ? '1em' : '0em', minWidth: '1em' }
    : { position: 'relative', bottom: '1em', minWidth: '2em' };
  const pagesPosition = {
    robot: 1,
    offers: 2,
    create: 3,
    order: 4,
    settings: 5,
  };

  const handleSlideDirection = function (oldPage: Page, newPage: Page) {
    const oldPos: number = pagesPosition[oldPage];
    const newPos: number = pagesPosition[newPage];
    setSlideDirection(
      newPos > oldPos ? { in: 'left', out: 'right' } : { in: 'right', out: 'left' },
    );
  };

  const changePage = function (mouseEvent: any, newPage: Page) {
    if (newPage === 'none') {
      return null;
    } else {
      handleSlideDirection(page, newPage);
      setPage(newPage);
      const param = newPage === 'order' ? currentOrder ?? '' : '';
      setTimeout(
        () => history.push(`/${newPage}/${param}`),
        theme.transitions.duration.leavingScreen * 3,
      );
    }
  };

  useEffect(() => {
    setOpen(closeAll);
  }, [page]);

  return (
    <Paper
      elevation={6}
      sx={{ height: `${height}em`, width: `${width * 0.9}em`, position: 'fixed', bottom: 0 }}
    >
      <Tabs
        TabIndicatorProps={{ sx: { height: '0.3em', position: 'absolute', top: 0 } }}
        variant='fullWidth'
        value={page}
        onChange={changePage}
      >
        <Tab
          sx={{ ...tabSx, minWidth: '2.5em', width: '2.5em', maxWidth: '4em' }}
          value='none'
          disabled={nickname === null}
          onClick={() => setOpen({ ...closeAll, profile: !open.profile })}
          icon={
            nickname ? (
              <RobotAvatar
                style={{ width: '2.3em', height: '2.3em', position: 'relative', top: '0.2em' }}
                avatarClass={theme.palette.mode === 'dark' ? 'navBarAvatarDark' : 'navBarAvatar'}
                nickname={nickname}
              />
            ) : (
              <></>
            )
          }
        />

        <Tab
          label={smallBar ? undefined : t('Robot')}
          sx={{ ...tabSx, minWidth: '1em' }}
          value='robot'
          icon={<SmartToy />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Offers')}
          value='offers'
          icon={<Storefront />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Create')}
          value='create'
          icon={<AddBox />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Order')}
          value='order'
          disabled={!hasRobot || currentOrder == null}
          icon={<Assignment />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Settings')}
          value='settings'
          icon={<SettingsApplications />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('More')}
          value='none'
          onClick={(e) => {
            open.more ? null : setOpen({ ...open, more: true });
          }}
          icon={
            <MoreTooltip open={open} nickname={nickname} setOpen={setOpen} closeAll={closeAll}>
              <MoreHoriz />
            </MoreTooltip>
          }
          iconPosition='start'
        />
      </Tabs>
    </Paper>
  );
};

export default NavBar;

// constructor(props) {
//     super(props);
//     this.state = {
//       profileShown: false,
//       openStatsForNerds: false,
//       openCommunity: false,
//       openExchangeSummary: false,
//       openClaimRewards: false,
//       openProfile: false,
//       showRewards: false,
//       rewardInvoice: null,
//       badInvoice: false,
//       showRewardsSpinner: false,
//       withdrawn: false,
//     };
//   }

//   handleClickOpenStatsForNerds = () => {
//     this.setState({ openStatsForNerds: true });
//   };

//   handleClickCloseStatsForNerds = () => {
//     this.setState({ openStatsForNerds: false });
//   };

//   handleClickOpenCommunity = () => {
//     this.setState({ openCommunity: true });
//   };

//   handleClickCloseCommunity = () => {
//     this.setState({ openCommunity: false });
//   };

//   handleClickOpenProfile = () => {
//     this.setState({ openProfile: true, profileShown: true });
//   };

//   handleClickCloseProfile = () => {
//     this.setState({ openProfile: false });
//   };

//   handleClickOpenExchangeSummary = () => {
//     this.setState({ openExchangeSummary: true });
//   };

//   handleClickCloseExchangeSummary = () => {
//     this.setState({ openExchangeSummary: false });
//   };

//   handleSubmitInvoiceClicked = (e, rewardInvoice) => {
//     this.setState({ badInvoice: false, showRewardsSpinner: true });

//     apiClient
//       .post('/api/reward/', {
//         invoice: rewardInvoice,
//       })
//       .then((data) => {
//         this.setState({ badInvoice: data.bad_invoice, showRewardsSpinner: false });
//         this.props.setInfo({
//           ...this.props.info,
//           badInvoice: data.bad_invoice,
//           openClaimRewards: !data.successful_withdrawal,
//           withdrawn: !!data.successful_withdrawal,
//           showRewardsSpinner: false,
//         });
//         this.props.setRobot({
//           ...this.props.robot,
//           earnedRewards: data.successful_withdrawal ? 0 : this.props.robot.earnedRewards,
//         });
//       });
//     e.preventDefault();
//   };

//   handleSetStealthInvoice = (wantsStealth) => {
//     apiClient
//       .put('/api/stealth/', { wantsStealth })
//       .then((data) =>
//         this.props.setRobot({ ...this.props.robot, stealthInvoices: data?.wantsStealth }),
//       );
//   };

//   showProfileButton = () => {
//     return (
//       this.props.robot.avatarLoaded &&
//       (this.props.robot.token
//         ? systemClient.getCookie('robot_token') === this.props.robot.token
//         : true) &&
//       systemClient.getCookie('sessionid')
//     );
//   };

//   bottomBarDesktop = () => {
//     const { t } = this.props;
//     const hasRewards = this.props.robot.earnedRewards > 0;
//     const hasOrder = !!(
//       (this.props.robot.activeOrderId > 0) &
//       !this.state.profileShown &
//       this.props.robot.avatarLoaded
//     );
//     const fontSize = this.props.theme.typography.fontSize;
//     const fontSizeFactor = fontSize / 14; // default fontSize is 14
//     const typographyProps = {
//       primaryTypographyProps: { fontSize },
//       secondaryTypographyProps: { fontSize: (fontSize * 12) / 14 },
//     };
//     return (
//       <Paper
//         elevation={6}
//         style={{ height: '2.5em', width: `${(this.props.windowSize.width / 16) * 14}em` }}
//       >
//         <Grid container>
//           <Grid item xs={1.9}>
//             <div style={{ display: this.showProfileButton() ? '' : 'none' }}>
//               <ListItemButton onClick={this.handleClickOpenProfile}>
//                 <Tooltip
//                   open={(hasRewards || hasOrder) && this.showProfileButton()}
//                   title={
//                     (hasRewards ? t('You can claim satoshis!') + ' ' : '') +
//                     (hasOrder ? t('You have an active order') : '')
//                   }
//                 >
//                   <ListItemAvatar sx={{ width: 30 * fontSizeFactor, height: 30 * fontSizeFactor }}>
//                     <RobotAvatar
//                       style={{ marginTop: -13 }}
//                       statusColor={
//                         (this.props.robot.activeOrderId > 0) & !this.state.profileShown
//                           ? 'primary'
//                           : undefined
//                       }
//                       nickname={this.props.robot.nickname}
//                       onLoad={() =>
//                         this.props.setRobot({ ...this.props.robot, avatarLoaded: true })
//                       }
//                     />
//                   </ListItemAvatar>
//                 </Tooltip>
//                 <ListItemText primary={this.props.robot.nickname} />
//               </ListItemButton>
//             </div>
//           </Grid>

//           <Grid item xs={1.9}>
//             <ListItem className='bottomItem'>
//               <ListItemIcon size='small'>
//                 <IconButton
//                   disabled={!this.showProfileButton()}
//                   color='primary'
//                   to={`/book/`}
//                   component={LinkRouter}
//                 >
//                   <InventoryIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemText
//                 {...typographyProps}
//                 primary={this.props.info.num_public_buy_orders}
//                 secondary={t('Public Buy Orders')}
//               />
//             </ListItem>
//           </Grid>

//           <Grid item xs={1.9}>
//             <ListItem className='bottomItem'>
//               <ListItemIcon size='small'>
//                 <IconButton
//                   disabled={!this.showProfileButton()}
//                   color='primary'
//                   to={`/book/`}
//                   component={LinkRouter}
//                 >
//                   <SellIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemText
//                 {...typographyProps}
//                 primary={this.props.info.num_public_sell_orders}
//                 secondary={t('Public Sell Orders')}
//               />
//             </ListItem>
//           </Grid>

//           <Grid item xs={1.9}>
//             <ListItem className='bottomItem'>
//               <ListItemIcon size='small'>
//                 <IconButton
//                   disabled={!this.showProfileButton()}
//                   color='primary'
//                   to={`/`}
//                   component={LinkRouter}
//                 >
//                   <SmartToyIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemText
//                 {...typographyProps}
//                 primary={this.props.info.active_robots_today}
//                 secondary={t('Today Active Robots')}
//               />
//             </ListItem>
//           </Grid>

//           <Grid item xs={1.9}>
//             <ListItem className='bottomItem'>
//               <ListItemIcon size='small'>
//                 <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
//                   <PriceChangeIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemText
//                 {...typographyProps}
//                 primary={this.props.info.last_day_nonkyc_btc_premium + '%'}
//                 secondary={t('24h Avg Premium')}
//               />
//             </ListItem>
//           </Grid>

//           <Grid item xs={1.5}>
//             <ListItem className='bottomItem'>
//               <ListItemIcon size='small'>
//                 <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
//                   <PercentIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemText
//                 {...typographyProps}
//                 primary={(this.props.info.maker_fee + this.props.info.taker_fee) * 100}
//                 secondary={t('Trade Fee')}
//               />
//             </ListItem>
//           </Grid>

//           <Grid container item xs={1}>
//             <Grid item xs={6}>
//               {this.LangSelect()}
//             </Grid>
//             <Grid item xs={3}>
//               <Tooltip enterTouchDelay={250} title={t('Show community and support links')}>
//                 <IconButton
//                   color='primary'
//                   aria-label='Community'
//                   onClick={this.handleClickOpenCommunity}
//                 >
//                   <PeopleIcon />
//                 </IconButton>
//               </Tooltip>
//             </Grid>
//             <Grid item xs={3}>
//               <Tooltip enterTouchDelay={250} title={t('Show stats for nerds')}>
//                 <IconButton
//                   color='primary'
//                   aria-label='Stats for Nerds'
//                   onClick={this.handleClickOpenStatsForNerds}
//                 >
//                   <BarChartIcon />
//                 </IconButton>
//               </Tooltip>
//             </Grid>
//           </Grid>
//         </Grid>
//       </Paper>
//     );
//   };

//   bottomBarPhone = () => {
//     const { t } = this.props;
//     const hasRewards = this.props.robot.earnedRewards > 0;
//     const hasOrder = !!(
//       (this.props.info.active_order_id > 0) &
//       !this.state.profileShown &
//       this.props.robot.avatarLoaded
//     );
//     return (
//       <Paper
//         elevation={6}
//         style={{ height: '2.85em', width: `${(this.props.windowSize.width / 16) * 14}em` }}
//       >
//         <Grid container>
//           <Grid item xs={1.6}>
//             <div style={{ display: this.showProfileButton() ? '' : 'none' }}>
//               <Tooltip
//                 open={(hasRewards || hasOrder) && this.showProfileButton()}
//                 title={
//                   (hasRewards ? t('You can claim satoshis!') + ' ' : '') +
//                   (hasOrder ? t('You have an active order') : '')
//                 }
//               >
//                 <IconButton
//                   onClick={this.handleClickOpenProfile}
//                   sx={{ margin: 0, bottom: 17, right: 8 }}
//                 >
//                   <RobotAvatar
//                     style={{ width: 55, height: 55 }}
//                     avatarClass='phoneFlippedSmallAvatar'
//                     statusColor={
//                       (this.props.activeOrderId > 0) & !this.state.profileShown
//                         ? 'primary'
//                         : undefined
//                     }
//                     nickname={this.props.robot.nickname}
//                     onLoad={() => this.props.setRobot({ ...this.props.robot, avatarLoaded: true })}
//                   />
//                 </IconButton>
//               </Tooltip>
//             </div>
//           </Grid>

//           <Grid item xs={1.6} align='center'>
//             <Tooltip enterTouchDelay={300} title={t('Number of public BUY orders')}>
//               <IconButton
//                 disabled={!this.showProfileButton()}
//                 color='primary'
//                 to={`/book/`}
//                 component={LinkRouter}
//               >
//                 <Badge badgeContent={this.props.info.num_public_buy_orders} color='action'>
//                   <InventoryIcon />
//                 </Badge>
//               </IconButton>
//             </Tooltip>
//           </Grid>

//           <Grid item xs={1.6} align='center'>
//             <Tooltip enterTouchDelay={300} title={t('Number of public SELL orders')}>
//               <IconButton
//                 disabled={!this.showProfileButton()}
//                 color='primary'
//                 to={`/book/`}
//                 component={LinkRouter}
//               >
//                 <Badge badgeContent={this.props.info.num_public_sell_orders} color='action'>
//                   <SellIcon />
//                 </Badge>
//               </IconButton>
//             </Tooltip>
//           </Grid>

//           <Grid item xs={1.6} align='center'>
//             <Tooltip enterTouchDelay={300} title={t('Today active robots')}>
//               <IconButton
//                 disabled={!this.showProfileButton()}
//                 color='primary'
//                 to={`/`}
//                 component={LinkRouter}
//               >
//                 <Badge badgeContent={this.props.info.active_robots_today} color='action'>
//                   <SmartToyIcon />
//                 </Badge>
//               </IconButton>
//             </Tooltip>
//           </Grid>

//           <Grid item xs={1.8} align='center'>
//             <Tooltip enterTouchDelay={300} title={t('24h non-KYC bitcoin premium')}>
//               <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
//                 <Badge
//                   badgeContent={this.props.info.last_day_nonkyc_btc_premium + '%'}
//                   color='action'
//                 >
//                   <PriceChangeIcon />
//                 </Badge>
//               </IconButton>
//             </Tooltip>
//           </Grid>

//           <Grid container item xs={3.8}>
//             <Grid item xs={6}>
//               {this.LangSelect()}
//             </Grid>
//             <Grid item xs={3}>
//               <Tooltip enterTouchDelay={250} title={t('Show community and support links')}>
//                 <IconButton
//                   color='primary'
//                   aria-label='Community'
//                   onClick={this.handleClickOpenCommunity}
//                 >
//                   <PeopleIcon />
//                 </IconButton>
//               </Tooltip>
//             </Grid>
//             <Grid item xs={3}>
//               <Tooltip enterTouchDelay={250} title={t('Show stats for nerds')}>
//                 <IconButton
//                   color='primary'
//                   aria-label='Stats for Nerds'
//                   onClick={() => this.props.fetchInfo()}
//                   onClick={this.handleClickOpenStatsForNerds}
//                 >
//                   <BarChartIcon />
//                 </IconButton>
//               </Tooltip>
//             </Grid>
//           </Grid>
//         </Grid>
//       </Paper>
//     );
//   };

//   render() {
//     return (
//       <div>

//         <UpdateClientDialog
//           open={this.state.openUpdateClient}
//           coordinatorVersion={this.props.info.coordinatorVersion}
//           clientVersion={this.props.info.clientVersion}
//           handleClickClose={() =>
//             this.props.setInfo({ ...this.props.info, openUpdateClient: false })
//           }
//         />

//         <ExchangeSummaryDialog
//           open={this.state.openExchangeSummary}
//           handleClickCloseExchangeSummary={this.handleClickCloseExchangeSummary}
//           numPublicBuyOrders={this.props.info.num_public_buy_orders}
//           numPublicSellOrders={this.props.info.num_public_sell_orders}
//           bookLiquidity={this.props.info.book_liquidity}
//           activeRobotsToday={this.props.info.active_robots_today}
//           lastDayNonkycBtcPremium={this.props.info.last_day_nonkyc_btc_premium}
//           makerFee={this.props.info.maker_fee}
//           takerFee={this.props.info.taker_fee}
//           swapFeeRate={this.props.info.current_swap_fee_rate}
//         />

//         <ProfileDialog
//           open={this.state.openProfile}
//           handleClickCloseProfile={this.handleClickCloseProfile}
//           nickname={this.props.robot.nickname}
//           activeOrderId={this.props.robot.activeOrderId}
//           lastOrderId={this.props.robot.lastOrderId}
//           referralCode={this.props.robot.referralCode}
//           tgEnabled={this.props.robot.tgEnabled}
//           tgBotName={this.props.robot.tgBotName}
//           tgToken={this.props.robot.tgToken}
//           handleSubmitInvoiceClicked={this.handleSubmitInvoiceClicked}
//           showRewardsSpinner={this.state.showRewardsSpinner}
//           withdrawn={this.props.info.withdrawn}
//           badInvoice={this.props.info.badInvoice}
//           earnedRewards={this.props.robot.earnedRewards}
//           updateRobot={(newParam) => this.props.setRobot({ ...robot, ...newParam })}
//           stealthInvoices={this.props.robot.stealthInvoices}
//           handleSetStealthInvoice={this.handleSetStealthInvoice}
//         />

//         <StatsDialog
//           open={this.state.openStatsForNerds}
//           handleClickCloseStatsForNerds={this.handleClickCloseStatsForNerds}
//           coordinatorVersion={this.props.info.coordinatorVersion}
//           clientVersion={this.props.info.clientVersion}
//           lndVersion={this.props.info.lnd_version}
//           network={this.props.info.network}
//           nodeAlias={this.props.info.node_alias}
//           nodeId={this.props.info.node_id}
//           alternativeName={this.props.info.alternative_name}
//           alternativeSite={this.props.info.alternative_site}
//           commitHash={this.props.info.robosats_running_commit_hash}
//           lastDayVolume={this.props.info.last_day_volume}
//           lifetimeVolume={this.props.info.lifetime_volume}
//         />

//         <MediaQuery minWidth={1200}>{this.bottomBarDesktop()}</MediaQuery>

//         <MediaQuery maxWidth={1199}>{this.bottomBarPhone()}</MediaQuery>
//       </div>
//     );
//   }
// }

// export default NavBar;
