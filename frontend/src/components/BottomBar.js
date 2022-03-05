import React, { Component } from 'react'
import {Badge, Tooltip, TextField, ListItemAvatar, Avatar,Paper, Grid, IconButton, Typography, Select, MenuItem, List, ListItemText, ListItem, ListItemIcon, ListItemButton, Divider, Dialog, DialogContent} from "@mui/material";
import MediaQuery from 'react-responsive'
import { Link } from 'react-router-dom'

// Icons
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BoltIcon from '@mui/icons-material/Bolt';
import GitHubIcon from '@mui/icons-material/GitHub';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SendIcon from '@mui/icons-material/Send';
import PublicIcon from '@mui/icons-material/Public';
import NumbersIcon from '@mui/icons-material/Numbers';
import PasswordIcon from '@mui/icons-material/Password';
import ContentCopy from "@mui/icons-material/ContentCopy";
import DnsIcon from '@mui/icons-material/Dns';
import WebIcon from '@mui/icons-material/Web';

// pretty numbers
function pn(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export default class BottomBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openStatsForNerds: false,
            openCommuniy: false,
            openExchangeSummary:false,
            num_public_buy_orders: 0,
            num_public_sell_orders: 0,
            active_robots_today: 0,
            maker_fee: 0,
            taker_fee: 0,
            today_avg_nonkyc_btc_premium: 0,
            today_volume: 0,
            lifetime_volume: 0,
            robosats_running_commit_hash: '000000000000000',
            openProfile: false,
            profileShown: false,
            alternative_site: 'robosats...',
            node_id: '00000000',
        };
        this.getInfo();
      }

    handleClickSuppport = () => {
        window.open("https://t.me/robosats");
    };

    getInfo() {
        this.setState(null)
        fetch('/api/info/')
          .then((response) => response.json())
          .then((data) => this.setState(data) &
          this.props.setAppState({nickname:data.nickname, loading:false}));
      }

    handleClickOpenStatsForNerds = () => {
        this.setState({openStatsForNerds: true});
    };

    handleClickCloseStatsForNerds = () => {
        this.setState({openStatsForNerds: false});
    };

    StatsDialog =() =>{

    return(
        <Dialog
        open={this.state.openStatsForNerds}
        onClose={this.handleClickCloseStatsForNerds}
        aria-labelledby="stats-for-nerds-dialog-title"
        aria-describedby="stats-for-nerds-description"
        >
        <DialogContent>
            <Typography component="h5" variant="h5">Stats For Nerds</Typography>
            <List dense>
                <Divider/>
                <ListItem>
                    <ListItemIcon><BoltIcon/></ListItemIcon>
                    <ListItemText primary={this.state.lnd_version} secondary="LND version"/>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><DnsIcon/></ListItemIcon>
                    {this.state.network == 'testnet'? 
                    <ListItemText secondary={this.state.node_alias}>
                         <a target="_blank" href={"https://1ml.com/testnet/node/" 
                        + this.state.node_id}>{this.state.node_id.slice(0, 12)+"... (1ML)"}
                        </a>
                    </ListItemText>
                    :
                    <ListItemText secondary={this.state.node_alias}>
                         <a target="_blank" href={"https://1ml.com/node/" 
                        + this.state.node_id}>{this.state.node_id.slice(0, 12)+"... (1ML)"}
                        </a>
                    </ListItemText>
                    }
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><WebIcon/></ListItemIcon>
                    <ListItemText secondary={this.state.alternative_name}>
                        <a target="_blank" href={"http://"+this.state.alternative_site}>{this.state.alternative_site.slice(0, 12)+"...onion"}
                        </a>
                    </ListItemText>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><GitHubIcon/></ListItemIcon>
                    <ListItemText secondary="Currently running commit hash">
                        <a target="_blank" href={"https://github.com/Reckless-Satoshi/robosats/tree/" 
                        + this.state.robosats_running_commit_hash}>{this.state.robosats_running_commit_hash.slice(0, 12)+"..."}
                        </a>
                    </ListItemText>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><EqualizerIcon/></ListItemIcon>
                    <ListItemText primary={pn(this.state.today_volume)+" Sats"} secondary="Today contracted volume"/>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><EqualizerIcon/></ListItemIcon>
                    <ListItemText primary={pn(this.state.lifetime_volume)+" BTC"} secondary="Lifetime contracted volume"/>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><PublicIcon/></ListItemIcon>
                    <ListItemText primary="Made with ❤️ and ⚡" secondary="... somewhere on Earth!"/>
                </ListItem>
            </List>

            </DialogContent>
        </Dialog>
    )
    }

    handleClickOpenCommunity = () => {
        this.setState({openCommuniy: true});
    };
    handleClickCloseCommunity = () => {
        this.setState({openCommuniy: false});
    };

    CommunityDialog =() =>{

        return(
        <Dialog
        open={this.state.openCommuniy}
        onClose={this.handleClickCloseCommunity}
        aria-labelledby="community-dialog-title"
        aria-describedby="community-description"
        >
        <DialogContent>
            <Typography component="h5" variant="h5">Community</Typography>
            <Typography component="body2" variant="body2">
                <p> Support is only offered via public channels.
                    Join our Telegram community if you have
                    questions or want to hang out with other cool robots.
                    Please, use our Github Issues if you find a bug or want 
                    to see new features!
                </p>
            </Typography>
            <List> 
                <Divider/>

                <ListItemButton component="a" target="_blank" href="https://t.me/robosats">
                    <ListItemIcon><SendIcon/></ListItemIcon>
                    <ListItemText primary="Join the RoboSats group"
                    secondary="Telegram (English / Main)"/>
                </ListItemButton>
                <Divider/>

                <ListItemButton component="a" target="_blank" href="https://t.me/robosats_es">
                    <ListItemIcon><SendIcon/></ListItemIcon>
                    <ListItemText primary="Unase al grupo RoboSats"
                    secondary="Telegram (Español)"/>
                </ListItemButton>
                <Divider/>

                <ListItemButton component="a" target="_blank" href="https://github.com/Reckless-Satoshi/robosats/issues">
                    <ListItemIcon><GitHubIcon/></ListItemIcon>
                    <ListItemText primary="Tell us about a new feature or a bug" 
                    secondary="Github Issues - The Robotic Satoshis Open Source Project"/>
                </ListItemButton>

            </List>
            </DialogContent>
        </Dialog>
    )
    }

    handleClickOpenProfile = () => {
        this.getInfo();
        this.setState({openProfile: true, profileShown: true});
    };
    handleClickCloseProfile = () => {
        this.setState({openProfile: false});
    };

    dialogProfile =() =>{
        return(
        <Dialog
        open={this.state.openProfile}
        onClose={this.handleClickCloseProfile}
        aria-labelledby="profile-title"
        aria-describedby="profile-description"
        >
            <DialogContent>
            <Typography component="h5" variant="h5">Your Profile</Typography>
            <List>
                <Divider/>
                <ListItem className="profileNickname">
                    <ListItemText secondary="Your robot">
                    <Typography component="h6" variant="h6">
                    {this.props.nickname ? "⚡"+this.props.nickname+"⚡" : ""}
                    </Typography>
                    </ListItemText>
                    <ListItemAvatar>
                    <Avatar className='profileAvatar' 
                        sx={{ width: 65, height:65 }}
                        alt={this.props.nickname}
                        src={this.props.nickname ? window.location.origin +'/static/assets/avatars/' + this.props.nickname + '.png' : null} 
                        />
                    </ListItemAvatar>
                </ListItem>
                <Divider/>
                {this.state.active_order_id ? 
                // TODO Link to router and do this.props.history.push
                <ListItemButton onClick={this.handleClickCloseProfile} to={'/order/'+this.state.active_order_id} component={Link}>
                    <ListItemIcon>
                        <Badge badgeContent="" color="primary"> 
                            <NumbersIcon color="primary"/>
                        </Badge>
                    </ListItemIcon>
                    <ListItemText primary={'One active order #'+this.state.active_order_id} secondary="Your current order"/>
                </ListItemButton>
                :
                <ListItem>
                    <ListItemIcon><NumbersIcon/></ListItemIcon>
                    <ListItemText primary="No active orders" secondary="Your current order"/>
                </ListItem>
                }
                <ListItem>
                    <ListItemIcon>
                        <PasswordIcon/>
                    </ListItemIcon>
                    <ListItemText secondary="Your token">
                    {this.props.token ?  
                    <TextField
                        disabled
                        label='Store safely'
                        value={this.props.token }
                        variant='filled'
                        size='small'
                        InputProps={{
                            endAdornment:
                            <IconButton onClick= {()=>navigator.clipboard.writeText(this.props.token)}>
                                <ContentCopy />
                            </IconButton>,
                            }}
                        />
                    : 
                    'Cannot remember'}
              </ListItemText>
                </ListItem>

            </List>
            </DialogContent>
            
        </Dialog>
    )
    }

bottomBarDesktop =()=>{
    return(
        <Paper elevation={6} style={{height:40}}>
                <this.StatsDialog/>
                <this.CommunityDialog/>
                <this.dialogProfile/>
                <this.exchangeSummaryDialog/>
                <Grid container xs={12}>

                    <Grid item xs={1.9}>
                        <div style={{display: this.props.avatarLoaded ? '':'none'}}>                     
                        <ListItemButton onClick={this.handleClickOpenProfile} >
                            <Tooltip open={(this.state.active_order_id > 0 & !this.state.profileShown & this.props.avatarLoaded) ? true: false}
                                        title="You have an active order">
                                <ListItemAvatar sx={{ width: 30, height: 30 }} >
                                    <Badge badgeContent={(this.state.active_order_id > 0 & !this.state.profileShown) ? "": null} color="primary">
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
                                <IconButton onClick={this.handleClickOpenExchangeSummary}><InventoryIcon/></IconButton>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.num_public_buy_orders} 
                                secondary="Public Buy Orders" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                            <IconButton onClick={this.handleClickOpenExchangeSummary}><SellIcon/></IconButton>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.num_public_sell_orders} 
                                secondary="Public Sell Orders" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                            <IconButton onClick={this.handleClickOpenExchangeSummary}><SmartToyIcon/></IconButton>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.active_robots_today} 
                                secondary="Today Active Robots" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.9}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <IconButton onClick={this.handleClickOpenExchangeSummary}><PriceChangeIcon/></IconButton>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.today_avg_nonkyc_btc_premium+"%"} 
                                secondary="Today Avg Premium" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={1.5}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                            <   IconButton onClick={this.handleClickOpenExchangeSummary}><PercentIcon/></IconButton>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={(this.state.maker_fee + this.state.taker_fee)*100} 
                                secondary="Trade Fee" />
                        </ListItem>
                    </Grid>

                    <Grid container item xs={1}>
                        <Grid item xs={6}>
                            <Select 
                            size = 'small'
                            defaultValue={1}
                            inputProps={{
                                style: {textAlign:"center"}
                            }}>
                                <MenuItem value={1}>EN</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={3}>
                        <Tooltip enterTouchDelay="250" title="Show community and support links">
                            <IconButton 
                            color="primary" 
                            aria-label="Community" 
                            onClick={this.handleClickOpenCommunity} >
                                <PeopleIcon />
                            </IconButton>
                        </Tooltip>
                        </Grid>
                        <Grid item xs={3}> 
                            <Tooltip enterTouchDelay="250" title="Show stats for nerds">
                                <IconButton color="primary" 
                                    aria-label="Stats for Nerds" 
                                    onClick={this.handleClickOpenStatsForNerds} >
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>

                    </Grid>
                </Grid>
            </Paper>
    )
}

    handleClickOpenExchangeSummary = () => {
        this.getInfo();
        this.setState({openExchangeSummary: true});
    };
    handleClickCloseExchangeSummary = () => {
        this.setState({openExchangeSummary: false});
    };

    exchangeSummaryDialog =() =>{
        return(
        <Dialog
        open={this.state.openExchangeSummary}
        onClose={this.handleClickCloseExchangeSummary}
        aria-labelledby="exchange-summary-title"
        aria-describedby="exchange-summary-description"
        >
        <DialogContent>
            <Typography component="h5" variant="h5">Exchange Summary</Typography>
            <List dense>
                <ListItem >
                    <ListItemIcon size="small">
                        <InventoryIcon/>
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{fontSize: '14px'}} 
                        secondaryTypographyProps={{fontSize: '12px'}} 
                        primary={this.state.num_public_buy_orders} 
                        secondary="Public buy orders" />
                </ListItem>
                <Divider/>

                <ListItem >
                    <ListItemIcon size="small">
                        <SellIcon/>
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{fontSize: '14px'}} 
                        secondaryTypographyProps={{fontSize: '12px'}} 
                        primary={this.state.num_public_sell_orders} 
                        secondary="Public sell orders" />
                </ListItem>
                <Divider/>

                <ListItem >
                    <ListItemIcon size="small">
                        <SmartToyIcon/>
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{fontSize: '14px'}} 
                        secondaryTypographyProps={{fontSize: '12px'}} 
                        primary={this.state.active_robots_today} 
                        secondary="Today active robots" />
                </ListItem>
                <Divider/>

                <ListItem >
                    <ListItemIcon size="small">
                        <PriceChangeIcon/>
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{fontSize: '14px'}} 
                        secondaryTypographyProps={{fontSize: '12px'}} 
                        primary={this.state.today_avg_nonkyc_btc_premium+"%"} 
                        secondary="Today non-KYC average premium" />
                </ListItem>
                <Divider/>

                <ListItem >
                    <ListItemIcon size="small">
                        <PercentIcon/>
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{fontSize: '14px'}} 
                        secondaryTypographyProps={{fontSize: '12px'}} 
                        secondary="Trading fees">
                        {(this.state.maker_fee*100).toFixed(3)}% <small>(maker)</small> | {(this.state.taker_fee*100).toFixed(3)}% <small>(taker)</small>
                    </ListItemText>
                </ListItem>
                </List>
                
            </DialogContent>
        </Dialog>
    )
    }

bottomBarPhone =()=>{
    return(
        <Paper elevation={6} style={{height:40}}>
                <this.StatsDialog/>
                <this.CommunityDialog/>
                <this.exchangeSummaryDialog/>
                <this.dialogProfile/>
                <Grid container xs={12}>

                    <Grid item xs={1.6}>
                    <div style={{display: this.props.avatarLoaded ? '':'none'}}>
                    <Tooltip open={(this.state.active_order_id > 0 & !this.state.profileShown & this.props.avatarLoaded) ? true: false}
                        title="You have an active order">
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
                        <Tooltip enterTouchDelay="300" title="Number of public BUY orders"> 
                            <IconButton onClick={this.handleClickOpenExchangeSummary} >
                            <Badge badgeContent={this.state.num_public_buy_orders}  color="action">
                                <InventoryIcon />
                            </Badge>
                            </IconButton>
                        </Tooltip> 
                    </Grid>

                    <Grid item xs={1.6} align="center">
                        <Tooltip enterTouchDelay="300" title="Number of public SELL orders">
                            <IconButton onClick={this.handleClickOpenExchangeSummary} >
                            <Badge badgeContent={this.state.num_public_sell_orders}  color="action">
                                <SellIcon />
                            </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid item xs={1.6} align="center">
                        <Tooltip enterTouchDelay="300" title="Today active robots">
                            <IconButton onClick={this.handleClickOpenExchangeSummary} >
                            <Badge badgeContent={this.state.active_robots_today}  color="action">
                                <SmartToyIcon />
                            </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid item xs={1.8} align="center">
                        <Tooltip enterTouchDelay="300" title="Today non-KYC bitcoin premium"> 
                            <IconButton onClick={this.handleClickOpenExchangeSummary} >
                            <Badge badgeContent={this.state.today_avg_nonkyc_btc_premium+"%"}  color="action">
                                <PriceChangeIcon />
                            </Badge>
                            </IconButton>
                        </Tooltip>
                    </Grid>

                    <Grid container item xs={3.8}>
                        <Grid item xs={6}>
                            <Select 
                            size = 'small'
                            defaultValue={1}
                            inputProps={{
                                style: {textAlign:"center"}
                            }}>
                                <MenuItem value={1}>EN</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={3}>
                        <Tooltip enterTouchDelay="250" title="Show community and support links">
                            <IconButton 
                            color="primary" 
                            aria-label="Community" 
                            onClick={this.handleClickOpenCommunity} >
                                <PeopleIcon />
                            </IconButton>
                        </Tooltip>
                        </Grid>
                        <Grid item xs={3}>
                        <Tooltip enterTouchDelay="250" title="Show stats for nerds">
                            <IconButton color="primary" 
                                aria-label="Stats for Nerds" 
                                onClick={this.handleClickOpenStatsForNerds} >
                                <SettingsIcon />
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
                <MediaQuery minWidth={1200}>
                    <this.bottomBarDesktop/>
                </MediaQuery>

                <MediaQuery maxWidth={1199}>
                    <this.bottomBarPhone/>
                </MediaQuery>
            </div>
        )
    }
}
