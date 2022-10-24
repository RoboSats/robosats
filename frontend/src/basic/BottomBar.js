import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  Badge,
  Tooltip,
  ListItemAvatar,
  Paper,
  Grid,
  IconButton,
  Select,
  MenuItem,
  ListItemText,
  ListItem,
  ListItemIcon,
  ListItemButton,
} from '@mui/material';
import MediaQuery from 'react-responsive';
import Flags from 'country-flag-icons/react/3x2';
import { Link as LinkRouter } from 'react-router-dom';
import { apiClient } from '../services/api';
import { systemClient } from '../services/System';
import RobotAvatar from '../components/RobotAvatar';

// Icons
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

// Missing flags
import { CataloniaFlag, BasqueCountryFlag } from '../components/Icons';

import {
  CommunityDialog,
  ExchangeSummaryDialog,
  ProfileDialog,
  StatsDialog,
  UpdateClientDialog,
} from '../components/Dialogs';

class BottomBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profileShown: false,
      openStatsForNerds: false,
      openCommunity: false,
      openExchangeSummary: false,
      openClaimRewards: false,
      openProfile: false,
      showRewards: false,
      rewardInvoice: null,
      badInvoice: false,
      showRewardsSpinner: false,
      withdrawn: false,
    };
  }

  handleClickOpenStatsForNerds = () => {
    this.setState({ openStatsForNerds: true });
  };

  handleClickCloseStatsForNerds = () => {
    this.setState({ openStatsForNerds: false });
  };

  handleClickOpenCommunity = () => {
    this.setState({ openCommunity: true });
  };

  handleClickCloseCommunity = () => {
    this.setState({ openCommunity: false });
  };

  handleClickOpenProfile = () => {
    this.setState({ openProfile: true, profileShown: true });
  };

  handleClickCloseProfile = () => {
    this.setState({ openProfile: false });
  };

  handleClickOpenExchangeSummary = () => {
    this.setState({ openExchangeSummary: true });
  };

  handleClickCloseExchangeSummary = () => {
    this.setState({ openExchangeSummary: false });
  };

  handleSubmitInvoiceClicked = (e, rewardInvoice) => {
    this.setState({ badInvoice: false, showRewardsSpinner: true });

    apiClient
      .post('/api/reward/', {
        invoice: rewardInvoice,
      })
      .then((data) => {
        this.setState({ badInvoice: data.bad_invoice, showRewardsSpinner: false });
        this.props.setInfo({
          ...this.props.info,
          badInvoice: data.bad_invoice,
          openClaimRewards: !data.successful_withdrawal,
          withdrawn: !!data.successful_withdrawal,
          showRewardsSpinner: false,
        });
        this.props.setRobot({
          ...this.props.robot,
          earnedRewards: data.successful_withdrawal ? 0 : this.props.robot.earnedRewards,
        });
      });
    e.preventDefault();
  };

  handleSetStealthInvoice = (wantsStealth) => {
    apiClient
      .put('/api/stealth/', { wantsStealth })
      .then((data) =>
        this.props.setRobot({ ...this.props.robot, stealthInvoices: data?.wantsStealth }),
      );
  };

  getHost() {
    const url =
      window.location != window.parent.location
        ? this.getHost(document.referrer)
        : document.location.href;
    return url.split('/')[2];
  }

  showProfileButton = () => {
    return (
      this.props.robot.avatarLoaded &&
      (this.props.robot.token
        ? systemClient.getCookie('robot_token') === this.props.robot.token
        : true) &&
      systemClient.getCookie('sessionid')
    );
  };

  bottomBarDesktop = () => {
    const { t } = this.props;
    const hasRewards = this.props.robot.earnedRewards > 0;
    const hasOrder = !!(
      (this.props.robot.activeOrderId > 0) &
      !this.state.profileShown &
      this.props.robot.avatarLoaded
    );
    const fontSize = this.props.theme.typography.fontSize;
    const fontSizeFactor = fontSize / 14; // default fontSize is 14
    const typographyProps = {
      primaryTypographyProps: { fontSize },
      secondaryTypographyProps: { fontSize: (fontSize * 12) / 14 },
    };
    return (
      <Paper
        elevation={6}
        style={{ height: '2.5em', width: `${(this.props.windowSize.width / 16) * 14}em` }}
      >
        <Grid container>
          <Grid item xs={1.9}>
            <div style={{ display: this.showProfileButton() ? '' : 'none' }}>
              <ListItemButton onClick={this.handleClickOpenProfile}>
                <Tooltip
                  open={(hasRewards || hasOrder) && this.showProfileButton()}
                  title={
                    (hasRewards ? t('You can claim satoshis!') + ' ' : '') +
                    (hasOrder ? t('You have an active order') : '')
                  }
                >
                  <ListItemAvatar sx={{ width: 30 * fontSizeFactor, height: 30 * fontSizeFactor }}>
                    <RobotAvatar
                      style={{ marginTop: -13 }}
                      statusColor={
                        (this.props.robot.activeOrderId > 0) & !this.state.profileShown
                          ? 'primary'
                          : undefined
                      }
                      nickname={this.props.robot.nickname}
                      onLoad={() =>
                        this.props.setRobot({ ...this.props.robot, avatarLoaded: true })
                      }
                    />
                  </ListItemAvatar>
                </Tooltip>
                <ListItemText primary={this.props.robot.nickname} />
              </ListItemButton>
            </div>
          </Grid>

          <Grid item xs={1.9}>
            <ListItem className='bottomItem'>
              <ListItemIcon size='small'>
                <IconButton
                  disabled={!this.showProfileButton()}
                  color='primary'
                  to={`/book/`}
                  component={LinkRouter}
                >
                  <InventoryIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemText
                {...typographyProps}
                primary={this.props.info.num_public_buy_orders}
                secondary={t('Public Buy Orders')}
              />
            </ListItem>
          </Grid>

          <Grid item xs={1.9}>
            <ListItem className='bottomItem'>
              <ListItemIcon size='small'>
                <IconButton
                  disabled={!this.showProfileButton()}
                  color='primary'
                  to={`/book/`}
                  component={LinkRouter}
                >
                  <SellIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemText
                {...typographyProps}
                primary={this.props.info.num_public_sell_orders}
                secondary={t('Public Sell Orders')}
              />
            </ListItem>
          </Grid>

          <Grid item xs={1.9}>
            <ListItem className='bottomItem'>
              <ListItemIcon size='small'>
                <IconButton
                  disabled={!this.showProfileButton()}
                  color='primary'
                  to={`/`}
                  component={LinkRouter}
                >
                  <SmartToyIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemText
                {...typographyProps}
                primary={this.props.info.active_robots_today}
                secondary={t('Today Active Robots')}
              />
            </ListItem>
          </Grid>

          <Grid item xs={1.9}>
            <ListItem className='bottomItem'>
              <ListItemIcon size='small'>
                <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
                  <PriceChangeIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemText
                {...typographyProps}
                primary={this.props.info.last_day_nonkyc_btc_premium + '%'}
                secondary={t('24h Avg Premium')}
              />
            </ListItem>
          </Grid>

          <Grid item xs={1.5}>
            <ListItem className='bottomItem'>
              <ListItemIcon size='small'>
                <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
                  <PercentIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemText
                {...typographyProps}
                primary={(this.props.info.maker_fee + this.props.info.taker_fee) * 100}
                secondary={t('Trade Fee')}
              />
            </ListItem>
          </Grid>

          <Grid container item xs={1}>
            <Grid item xs={6}>
              {this.LangSelect()}
            </Grid>
            <Grid item xs={3}>
              <Tooltip enterTouchDelay={250} title={t('Show community and support links')}>
                <IconButton
                  color='primary'
                  aria-label='Community'
                  onClick={this.handleClickOpenCommunity}
                >
                  <PeopleIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={3}>
              <Tooltip enterTouchDelay={250} title={t('Show stats for nerds')}>
                <IconButton
                  color='primary'
                  aria-label='Stats for Nerds'
                  onClick={this.handleClickOpenStatsForNerds}
                >
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  handleChangeLang = (e) => {
    const { i18n } = this.props;
    i18n.changeLanguage(e.target.value);
  };

  LangSelect = () => {
    const { i18n } = this.props;
    const lang = i18n.resolvedLanguage == null ? 'en' : i18n.resolvedLanguage.substring(0, 2);
    const flagProps = {
      width: 20,
      height: 20,
    };

    return (
      <Select
        size='small'
        value={lang}
        inputProps={{
          style: { textAlign: 'center' },
        }}
        renderValue={(value) => value.toUpperCase()}
        onChange={this.handleChangeLang}
      >
        <MenuItem value={'en'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.US {...flagProps} />
          </div>
          EN
        </MenuItem>
        <MenuItem value={'es'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.ES {...flagProps} />
          </div>
          ES
        </MenuItem>
        <MenuItem value={'de'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.DE {...flagProps} />
          </div>
          DE
        </MenuItem>
        <MenuItem value={'pl'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.PL {...flagProps} />
          </div>
          PL
        </MenuItem>
        <MenuItem value={'fr'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.FR {...flagProps} />
          </div>
          FR
        </MenuItem>
        <MenuItem value={'ru'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.RU {...flagProps} />
          </div>
          RU
        </MenuItem>
        <MenuItem value={'it'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.IT {...flagProps} />
          </div>
          IT
        </MenuItem>
        <MenuItem value={'pt'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.BR {...flagProps} />
          </div>
          PT
        </MenuItem>
        <MenuItem value={'zh-si'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.CN {...flagProps} />
          </div>
          简体
        </MenuItem>
        <MenuItem value={'zh-tr'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.CN {...flagProps} />
          </div>
          繁體
        </MenuItem>
        <MenuItem value={'sv'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.SE {...flagProps} />
          </div>
          SV
        </MenuItem>
        <MenuItem value={'cs'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.CZ {...flagProps} />
          </div>
          CS
        </MenuItem>
        <MenuItem value={'th'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <Flags.TH {...flagProps} />
          </div>
          TH
        </MenuItem>
        <MenuItem value={'ca'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <CataloniaFlag {...flagProps} />
          </div>
          CA
        </MenuItem>
        <MenuItem value={'eu'}>
          <div style={{ width: 24, position: 'relative', top: 3 }}>
            <BasqueCountryFlag {...flagProps} />
          </div>
          EU
        </MenuItem>
      </Select>
    );
  };

  bottomBarPhone = () => {
    const { t } = this.props;
    const hasRewards = this.props.robot.earnedRewards > 0;
    const hasOrder = !!(
      (this.props.info.active_order_id > 0) &
      !this.state.profileShown &
      this.props.robot.avatarLoaded
    );
    return (
      <Paper
        elevation={6}
        style={{ height: '2.85em', width: `${(this.props.windowSize.width / 16) * 14}em` }}
      >
        <Grid container>
          <Grid item xs={1.6}>
            <div style={{ display: this.showProfileButton() ? '' : 'none' }}>
              <Tooltip
                open={(hasRewards || hasOrder) && this.showProfileButton()}
                title={
                  (hasRewards ? t('You can claim satoshis!') + ' ' : '') +
                  (hasOrder ? t('You have an active order') : '')
                }
              >
                <IconButton
                  onClick={this.handleClickOpenProfile}
                  sx={{ margin: 0, bottom: 17, right: 8 }}
                >
                  <RobotAvatar
                    style={{ width: 55, height: 55 }}
                    avatarClass='phoneFlippedSmallAvatar'
                    statusColor={
                      (this.props.activeOrderId > 0) & !this.state.profileShown
                        ? 'primary'
                        : undefined
                    }
                    nickname={this.props.robot.nickname}
                    onLoad={() => this.props.setRobot({ ...this.props.robot, avatarLoaded: true })}
                  />
                </IconButton>
              </Tooltip>
            </div>
          </Grid>

          <Grid item xs={1.6} align='center'>
            <Tooltip enterTouchDelay={300} title={t('Number of public BUY orders')}>
              <IconButton
                disabled={!this.showProfileButton()}
                color='primary'
                to={`/book/`}
                component={LinkRouter}
              >
                <Badge badgeContent={this.props.info.num_public_buy_orders} color='action'>
                  <InventoryIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={1.6} align='center'>
            <Tooltip enterTouchDelay={300} title={t('Number of public SELL orders')}>
              <IconButton
                disabled={!this.showProfileButton()}
                color='primary'
                to={`/book/`}
                component={LinkRouter}
              >
                <Badge badgeContent={this.props.info.num_public_sell_orders} color='action'>
                  <SellIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={1.6} align='center'>
            <Tooltip enterTouchDelay={300} title={t('Today active robots')}>
              <IconButton
                disabled={!this.showProfileButton()}
                color='primary'
                onClick={() => this.props.fetchInfo()}
                to={`/`}
                component={LinkRouter}
              >
                <Badge badgeContent={this.props.info.active_robots_today} color='action'>
                  <SmartToyIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={1.8} align='center'>
            <Tooltip enterTouchDelay={300} title={t('24h non-KYC bitcoin premium')}>
              <IconButton color='primary' onClick={this.handleClickOpenExchangeSummary}>
                <Badge
                  badgeContent={this.props.info.last_day_nonkyc_btc_premium + '%'}
                  color='action'
                >
                  <PriceChangeIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid container item xs={3.8}>
            <Grid item xs={6}>
              {this.LangSelect()}
            </Grid>
            <Grid item xs={3}>
              <Tooltip enterTouchDelay={250} title={t('Show community and support links')}>
                <IconButton
                  color='primary'
                  aria-label='Community'
                  onClick={this.handleClickOpenCommunity}
                >
                  <PeopleIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={3}>
              <Tooltip enterTouchDelay={250} title={t('Show stats for nerds')}>
                <IconButton
                  color='primary'
                  aria-label='Stats for Nerds'
                  onClick={this.handleClickOpenStatsForNerds}
                >
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  render() {
    return (
      <div>
        <CommunityDialog
          open={this.state.openCommunity}
          handleClickCloseCommunity={this.handleClickCloseCommunity}
        />

        <UpdateClientDialog
          open={this.state.openUpdateClient}
          coordinatorVersion={this.props.info.coordinatorVersion}
          clientVersion={this.props.info.clientVersion}
          handleClickClose={() =>
            this.props.setInfo({ ...this.props.info, openUpdateClient: false })
          }
        />

        <ExchangeSummaryDialog
          open={this.state.openExchangeSummary}
          handleClickCloseExchangeSummary={this.handleClickCloseExchangeSummary}
          numPublicBuyOrders={this.props.info.num_public_buy_orders}
          numPublicSellOrders={this.props.info.num_public_sell_orders}
          bookLiquidity={this.props.info.book_liquidity}
          activeRobotsToday={this.props.info.active_robots_today}
          lastDayNonkycBtcPremium={this.props.info.last_day_nonkyc_btc_premium}
          makerFee={this.props.info.maker_fee}
          takerFee={this.props.info.taker_fee}
          swapFeeRate={this.props.info.current_swap_fee_rate}
        />

        <ProfileDialog
          open={this.state.openProfile}
          handleClickCloseProfile={this.handleClickCloseProfile}
          nickname={this.props.robot.nickname}
          activeOrderId={this.props.robot.activeOrderId}
          lastOrderId={this.props.robot.lastOrderId}
          referralCode={this.props.robot.referralCode}
          tgEnabled={this.props.robot.tgEnabled}
          tgBotName={this.props.robot.tgBotName}
          tgToken={this.props.robot.tgToken}
          handleSubmitInvoiceClicked={this.handleSubmitInvoiceClicked}
          host={this.getHost()}
          showRewardsSpinner={this.state.showRewardsSpinner}
          withdrawn={this.props.info.withdrawn}
          badInvoice={this.props.info.badInvoice}
          earnedRewards={this.props.robot.earnedRewards}
          updateRobot={(newParam) => this.props.setRobot({ ...robot, ...newParam })}
          stealthInvoices={this.props.robot.stealthInvoices}
          handleSetStealthInvoice={this.handleSetStealthInvoice}
        />

        <StatsDialog
          open={this.state.openStatsForNerds}
          handleClickCloseStatsForNerds={this.handleClickCloseStatsForNerds}
          coordinatorVersion={this.props.info.coordinatorVersion}
          clientVersion={this.props.info.clientVersion}
          lndVersion={this.props.info.lnd_version}
          network={this.props.info.network}
          nodeAlias={this.props.info.node_alias}
          nodeId={this.props.info.node_id}
          alternativeName={this.props.info.alternative_name}
          alternativeSite={this.props.info.alternative_site}
          commitHash={this.props.info.robosats_running_commit_hash}
          lastDayVolume={this.props.info.last_day_volume}
          lifetimeVolume={this.props.info.lifetime_volume}
        />

        <MediaQuery minWidth={1200}>{this.bottomBarDesktop()}</MediaQuery>

        <MediaQuery maxWidth={1199}>{this.bottomBarPhone()}</MediaQuery>
      </div>
    );
  }
}

export default withTranslation()(BottomBar);
