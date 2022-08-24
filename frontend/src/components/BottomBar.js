import React, { Component } from 'react'
import { withTranslation } from "react-i18next";
import { Badge, Tooltip, ListItemAvatar, Avatar,Paper, Grid, IconButton, Select, MenuItem, ListItemText, ListItem, ListItemIcon, ListItemButton } from "@mui/material";
import MediaQuery from 'react-responsive'
import Flags from 'country-flag-icons/react/3x2'
import { Link as LinkRouter } from "react-router-dom";

// Icons
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

// Missing flags
import { CataloniaFlag, BasqueCountryFlag} from "./Icons";

import {
    CommunityDialog,
    ExchangeSummaryDialog,
    ProfileDialog,
    StatsDialog,
} from './Dialogs';

import { getCookie } from "../utils/cookies";

class BottomBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openStatsForNerds: false,
            openCommuniy: false,
            openExchangeSummary:false,
            openClaimRewards: false,
            num_public_buy_orders: 0,
            num_public_sell_orders: 0,
            book_liquidity: 0,
            active_robots_today: 0,
            maker_fee: 0,
            taker_fee: 0,
            last_day_nonkyc_btc_premium: 0,
            last_day_volume: 0,
            lifetime_volume: 0,
            robosats_running_commit_hash: '000000000000000',
            openProfile: false,
            profileShown: false,
            alternative_site: 'robosats...',
            node_id: '00000000',
            showRewards: false,
            rewardInvoice: null,
            badInvoice: false,
            showRewardsSpinner: false,
            withdrawn: false,
        };
    }

    componentDidMount() {
        this.getInfo();
    }

    getInfo() {
        this.setState(null)
        fetch('/api/info/')
          .then((response) => response.json())
          .then((data) => this.setState(data)
          & this.props.setAppState({nickname:data.nickname, 
                                    loading:false,
                                    activeOrderId: data.active_order_id ? data.active_order_id : null,
                                    lastOrderId: data.last_order_id ? data.last_order_id : null,
                                    referralCode: data.referral_code,
                                    earnedRewards: data.earned_rewards,}));
      }

    handleClickOpenStatsForNerds = () => {
        this.setState({openStatsForNerds: true});
    };

    handleClickCloseStatsForNerds = () => {
        this.setState({openStatsForNerds: false});
    };

    handleClickOpenCommunity = () => {
        this.setState({openCommuniy: true});
    };
    handleClickCloseCommunity = () => {
        this.setState({openCommuniy: false});
    };

    handleClickOpenProfile = () => {
        this.getInfo();
        this.setState({openProfile: true, profileShown: true});
    };
    handleClickCloseProfile = () => {
        this.setState({openProfile: false});
    };

    handleSubmitInvoiceClicked=(e, rewardInvoice)=>{
        this.setState({
            badInvoice:false,
            showRewardsSpinner: true,
        });

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken'),},
            body: JSON.stringify({
              'invoice': rewardInvoice,
            }),
        };
        fetch('/api/reward/', requestOptions)
        .then((response) => response.json())
        .then((data) => this.setState({
            badInvoice:data.bad_invoice,
            openClaimRewards: data.successful_withdrawal ? false : true,
            withdrawn: data.successful_withdrawal ? true : false,
            showRewardsSpinner: false,
        })
        & this.props.setAppState({
            earnedRewards: data.successful_withdrawal ? 0 : this.props.earnedRewards,
        })
        );
        e.preventDefault();
    }

    handleSetStealthInvoice = (wantsStealth) => {
        const requestOptions = {
            method: 'PUT',
            headers: {'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({wantsStealth: wantsStealth}),
        };
        fetch('/api/stealth/', requestOptions)
          .then((response) => response.json())
          .then((data) => this.props.setAppState({stealthInvoices: data.wantsStealth}));
    }

    getHost(){
        var url = (window.location != window.parent.location) ? this.getHost(document.referrer) : document.location.href;
        return url.split('/')[2]
      }

    showProfileButton = () =>{
        return (this.props.avatarLoaded && (this.props.token ? getCookie('robot_token')==this.props.token : true ) && (getCookie('sessionid')))
    }

bottomBarDesktop =()=>{
    const { t } = this.props;
    var hasRewards = this.props.earnedRewards > 0 ? true: false;
    var hasOrder = this.props.activeOrderId > 0 & !this.state.profileShown & this.props.avatarLoaded ? true : false;

    return(
        <Paper elevation={6} style={{height:40}}>
                <Grid container>

                    <Grid item xs={1.9}>
                        <div style={{display: this.showProfileButton() ? '':'none'}}>
                        <ListItemButton onClick={this.handleClickOpenProfile} >
                            <Tooltip
                                open={(hasRewards || hasOrder) && this.showProfileButton()}
                                title={(hasRewards ? t("You can claim satoshis!")+" ": "" )+
                                    (hasOrder ? t("You have an active order"):"")}
                                >
                                <ListItemAvatar sx={{ width: 30, height: 30 }} >
                                    <Badge badgeContent={(this.props.activeOrderId > 0 & !this.props.profileShown) ? "": null} color="primary">
                                    <Avatar className='flippedSmallAvatar' sx={{margin: 0, top: -13}}
                                        alt={this.props.nickname}
                                        imgProps={{
                                            onLoad:() => this.props.setAppState({avatarLoaded: true}),
                                        }}
                                        src={this.props.nickname ? window.location.origin +'/static/assets/avatars/' + this.props.nickname + '.png' : null}
                                        />
                                    </Badge>
                                </ListItemAvatar>
                            </Tooltip>
                            <ListItemText primary={this.props.nickname}/>
                        </ListItemButton>
                        </div>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton 
                                    disabled={!this.showProfileButton()}
                                    color="primary" 
                                    onClick={()=> this.props.setAppState({buyChecked: false, sellChecked: true, type:0}) & this.getInfo()}
                                    to={`/book/`}
                                    component={LinkRouter} >
                                    <InventoryIcon/>
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText
                                primaryTypographyProps={{fontSize: '14px'}}
                                secondaryTypographyProps={{fontSize: '12px'}}
                                primary={this.state.num_public_buy_orders}
                                secondary={t("Public Buy Orders")} />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton 
                                    disabled={!this.showProfileButton()}
                                    color="primary" 
                                    onClick={()=> this.props.setAppState({buyChecked: true, sellChecked: false, type:1}) & this.getInfo()}
                                    to={`/book/`}
                                    component={LinkRouter} >
                                    <SellIcon/>
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText
                                primaryTypographyProps={{fontSize: '14px'}}
                                secondaryTypographyProps={{fontSize: '12px'}}
                                primary={this.state.num_public_sell_orders}
                                secondary={t("Public Sell Orders")} />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton 
                                    disabled={!this.showProfileButton()}
                                    color="primary" 
                                    onClick={()=> this.getInfo()}
                                    to={`/`}
                                    component={LinkRouter} >
                                    <SmartToyIcon/>
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText
                                primaryTypographyProps={{fontSize: '14px'}}
                                secondaryTypographyProps={{fontSize: '12px'}}
                                primary={this.state.active_robots_today}
                                secondary={t("Today Active Robots")}/>
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton color="primary"
                                    onClick={this.handleClickOpenExchangeSummary}>
                                    <PriceChangeIcon/>
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText
                                primaryTypographyProps={{fontSize: '14px'}}
                                secondaryTypographyProps={{fontSize: '12px'}}
                                primary={this.state.last_day_nonkyc_btc_premium+"%"}
                                secondary={t("24h Avg Premium")} />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.5}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton color="primary"
                                    onClick={this.handleClickOpenExchangeSummary}>
                                    <PercentIcon/>
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText
                                primaryTypographyProps={{fontSize: '14px'}}
                                secondaryTypographyProps={{fontSize: '12px'}}
                                primary={(this.state.maker_fee + this.state.taker_fee)*100}
                                secondary={t("Trade Fee")} />
                        </ListItem>
                    </Grid>

                    <Grid container item xs={1}>
                        <Grid item xs={6}>
                            {this.LangSelect()}
                        </Grid>
                        <Grid item xs={3}>
                        <Tooltip enterTouchDelay={250} title={t("Show community and support links")}>
                            <IconButton
                            color="primary"
                            aria-label="Community"
                            onClick={this.handleClickOpenCommunity} >
                                <PeopleIcon />
                            </IconButton>
                        </Tooltip>
                        </Grid>
                        <Grid item xs={3}>
                            <Tooltip enterTouchDelay={250} title={t("Show stats for nerds")}>
                                <IconButton color="primary"
                                    aria-label="Stats for Nerds"
                                    onClick={this.handleClickOpenStatsForNerds} >
                                    <BarChartIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>

                    </Grid>
                </Grid>
            </Paper>
    )
}
    handleChangeLang=(e)=>{
        const { i18n } = this.props;
        i18n.changeLanguage(e.target.value)
    }

    LangSelect = () => {
        const { i18n } = this.props;
        const lang = i18n.resolvedLanguage == null ? 'en' : i18n.resolvedLanguage.substring(0,2);
        const flagProps = {
            width: 20,
            height: 20,
          };

        return(
            <Select
                size = 'small'
                value = {lang}
                inputProps={{
                    style: {textAlign:"center"}
                }}
                renderValue={(value)=>value.toUpperCase()}
                onChange={this.handleChangeLang}>
                    <MenuItem value={'en'}><div style={{width:24,position:"relative",top:3}}><Flags.US {...flagProps}/></div>EN</MenuItem>
                    <MenuItem value={'es'}><div style={{width:24,position:"relative",top:3}}><Flags.ES {...flagProps}/></div>ES</MenuItem>
                    <MenuItem value={'de'}><div style={{width:24,position:"relative",top:3}}><Flags.DE {...flagProps}/></div>DE</MenuItem>
                    <MenuItem value={'pl'}><div style={{width:24,position:"relative",top:3}}><Flags.PL {...flagProps}/></div>PL</MenuItem>
                    <MenuItem value={'fr'}><div style={{width:24,position:"relative",top:3}}><Flags.FR {...flagProps}/></div>FR</MenuItem>
                    <MenuItem value={'ru'}><div style={{width:24,position:"relative",top:3}}><Flags.RU {...flagProps}/></div>RU</MenuItem>
                    <MenuItem value={'it'}><div style={{width:24,position:"relative",top:3}}><Flags.IT {...flagProps}/></div>IT</MenuItem>
                    <MenuItem value={'pt'}><div style={{width:24,position:"relative",top:3}}><Flags.BR {...flagProps}/></div>PT</MenuItem>
                    <MenuItem disabled={true} value={'zh'}><div style={{width:24,position:"relative",top:3}}><Flags.CN {...flagProps}/></div>ZH</MenuItem>
                    <MenuItem value={'sv'}><div style={{width:24,position:"relative",top:3}}><Flags.SE {...flagProps}/></div>SV</MenuItem>
                    <MenuItem value={'cs'}><div style={{width:24,position:"relative",top:3}}><Flags.CZ {...flagProps}/></div>CS</MenuItem>
                    <MenuItem value={'th'}><div style={{width:24,position:"relative",top:3}}><Flags.TH {...flagProps}/></div>TH</MenuItem>
                    <MenuItem value={'ca'}><div style={{width:24,position:"relative",top:3}}><CataloniaFlag {...flagProps}/></div>CA</MenuItem>
                    <MenuItem value={'eu'}><div style={{width:24,position:"relative",top:3}}><BasqueCountryFlag {...flagProps}/></div>EU</MenuItem>
                </Select>
        )
    }

    handleClickOpenExchangeSummary = () => {
        // avoid calling getInfo while sessionid not yet set. Temporary fix.
        if(getCookie('sessionid')){
            this.getInfo();
        }
        this.setState({openExchangeSummary: true});
    };
    handleClickCloseExchangeSummary = () => {
        this.setState({openExchangeSummary: false});
    };

bottomBarPhone =()=>{
    const { t } = this.props;
    var hasRewards = this.props.earnedRewards > 0 ? true: false;
    var hasOrder = this.state.active_order_id > 0 & !this.state.profileShown & this.props.avatarLoaded ? true : false;
    return(
        <Paper elevation={6} style={{height:40}}>
                <Grid container>

                    <Grid item xs={1.6}>
                    <div style={{display: this.showProfileButton() ? '':'none'}}>
                    <Tooltip open={(hasRewards || hasOrder) && this.showProfileButton()}
                            title={(hasRewards ? t("You can claim satoshis!")+" ": "" )+
                                (hasOrder ? t("You have an active order"):"")}>
                        <IconButton onClick={this.handleClickOpenProfile} sx={{margin: 0, bottom: 17, right: 8}} >
                            <Badge badgeContent={(this.state.active_order_id >0 & !this.state.profileShown) ? "": null} color="primary">
                                <Avatar className='phoneFlippedSmallAvatar'
                                sx={{ width: 55, height:55 }}
                                alt={this.props.nickname}
                                imgProps={{
                                    onLoad:() => this.props.setAppState({avatarLoaded: true}),
                                }}
                                src={this.props.nickname ? window.location.origin +'/static/assets/avatars/' + this.props.nickname + '.png' : null}
                                />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    </div>
                    </Grid>

                    <Grid item xs={1.6} align="center">
                        <Tooltip enterTouchDelay={300} title={t("Number of public BUY orders")}>
                            <IconButton
                                disabled={!this.showProfileButton()}
                                color="primary" 
                                onClick={()=> this.props.setAppState({buyChecked: false, sellChecked: true, type:0}) & this.getInfo()}
                                to={`/book/`}
                                component={LinkRouter} >
                                <Badge badgeContent={this.state.num_public_buy_orders}  color="action">
                                    <InventoryIcon/>
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid item xs={1.6} align="center">
                        <Tooltip enterTouchDelay={300} title={t("Number of public SELL orders")}>
                            <IconButton 
                                disabled={!this.showProfileButton()}
                                color="primary" 
                                onClick={()=> this.props.setAppState({buyChecked: true, sellChecked: false, type:1}) & this.getInfo()}
                                to={`/book/`}
                                component={LinkRouter} >
                                    <Badge badgeContent={this.state.num_public_sell_orders}  color="action">
                                        <SellIcon/>
                                    </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid item xs={1.6} align="center">
                        <Tooltip enterTouchDelay={300} title={t("Today active robots")}>
                            <IconButton 
                                disabled={!this.showProfileButton()}
                                color="primary" 
                                onClick={()=> this.getInfo()}
                                to={`/`}
                                component={LinkRouter} >
                                <Badge badgeContent={this.state.active_robots_today}  color="action">
                                    <SmartToyIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid item xs={1.8} align="center">
                        <Tooltip enterTouchDelay={300} title={t("24h non-KYC bitcoin premium")}>
                            <IconButton color="primary"
                                onClick={this.handleClickOpenExchangeSummary} >
                                <Badge badgeContent={this.state.last_day_nonkyc_btc_premium+"%"}  color="action">
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
                        <Tooltip enterTouchDelay={250} title={t("Show community and support links")}>
                            <IconButton
                            color="primary"
                            aria-label="Community"
                            onClick={this.handleClickOpenCommunity} >
                                <PeopleIcon />
                            </IconButton>
                        </Tooltip>
                        </Grid>
                        <Grid item xs={3}>
                        <Tooltip enterTouchDelay={250} title={t("Show stats for nerds")}>
                            <IconButton color="primary"
                                aria-label="Stats for Nerds"
                                onClick={this.handleClickOpenStatsForNerds} >
                                <BarChartIcon />
                            </IconButton>
                        </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
    )
}

    render() {
        return (
            <div>
                <CommunityDialog
                    isOpen={this.state.openCommuniy}
                    handleClickCloseCommunity={this.handleClickCloseCommunity}
                />

                <ExchangeSummaryDialog
                    isOpen={this.state.openExchangeSummary}
                    handleClickCloseExchangeSummary={this.handleClickCloseExchangeSummary}
                    numPublicBuyOrders={this.state.num_public_buy_orders}
                    numPublicSellOrders={this.state.num_public_sell_orders}
                    bookLiquidity={this.state.book_liquidity}
                    activeRobotsToday={this.state.active_robots_today}
                    lastDayNonkycBtcPremium={this.state.last_day_nonkyc_btc_premium}
                    makerFee={this.state.maker_fee}
                    takerFee={this.state.taker_fee}
                    swapFeeRate={this.state.current_swap_fee_rate}
                />

                <ProfileDialog
                    isOpen={this.state.openProfile}
                    handleClickCloseProfile={this.handleClickCloseProfile}
                    nickname={this.props.nickname}
                    activeOrderId={this.props.activeOrderId}
                    lastOrderId={this.props.lastOrderId}
                    referralCode={this.props.referralCode}
                    handleSubmitInvoiceClicked={this.handleSubmitInvoiceClicked}
                    host={this.getHost()}
                    showRewardsSpinner={this.state.showRewardsSpinner}
                    withdrawn={this.state.withdrawn}
                    badInvoice={this.state.badInvoice}
                    earnedRewards={this.props.earnedRewards}
                    setAppState={this.props.setAppState}
                    stealthInvoices={this.props.stealthInvoices}
                    handleSetStealthInvoice={this.handleSetStealthInvoice}
                />

                <StatsDialog
                    isOpen={this.state.openStatsForNerds}
                    handleClickCloseStatsForNerds={this.handleClickCloseStatsForNerds}
                    lndVersion={this.state.lnd_version}
                    network={this.state.network}
                    nodeAlias={this.state.node_alias}
                    nodeId={this.state.node_id}
                    alternativeName={this.state.alternative_name}
                    alternativeSite={this.state.alternative_site}
                    robosatsRunningCommitHash={this.state.robosats_running_commit_hash}
                    lastDayVolume={this.state.last_day_volume}
                    lifetimeVolume={this.state.lifetime_volume}
                />

                <MediaQuery minWidth={1200}>
                    {this.bottomBarDesktop()}
                </MediaQuery>

                <MediaQuery maxWidth={1199}>
                    {this.bottomBarPhone()}
                </MediaQuery>
            </div>
        )
    }
}

export default withTranslation()(BottomBar);
