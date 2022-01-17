import React, { Component } from 'react'
import {Paper, Grid, IconButton, Typography, Select, MenuItem, List, ListItemText, ListItem, ListItemIcon, ListItemButton, Divider, Dialog, DialogContent} from "@mui/material";

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

export default class BottomBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openStatsForNerds: false,
            openCommuniy: false,
            num_public_buy_orders: null,
            num_active_robotsats: null,
            num_public_sell_orders: null,
            fee: null,
            today_avg_nonkyc_btc_premium: null,
            today_total_volume: null,
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
          .then((data) => {console.log(data) &
            this.setState(data)
          });
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
            <List>
                <Divider/>
                <ListItem>
                    <ListItemIcon><BoltIcon/></ListItemIcon>
                    <ListItemText primary={this.state.lnd_version} secondary="LND version"/>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><GitHubIcon/></ListItemIcon>
                    <ListItemText secondary="Currently running commit height">
                        <a href={"https://github.com/Reckless-Satoshi/robosats/tree/" 
                        + this.state.robosats_running_commit_hash}>{this.state.robosats_running_commit_hash}
                        </a>
                    </ListItemText>
                </ListItem>

                <Divider/>
                <ListItem>
                    <ListItemIcon><EqualizerIcon/></ListItemIcon>
                    <ListItemText primary={this.state.today_total_volume+" BTC"} secondary="Today traded volume"/>
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

                <ListItemButton component="a" href="https://t.me/robosats">
                    <ListItemIcon><SendIcon/></ListItemIcon>
                    <ListItemText primary="Join the RoboSats group"
                    secondary="Telegram (English / Main)"/>
                </ListItemButton>
                <Divider/>

                <ListItemButton component="a" href="https://t.me/robosats_es">
                    <ListItemIcon><SendIcon/></ListItemIcon>
                    <ListItemText primary="Unase al grupo RoboSats"
                    secondary="Telegram (Español)"/>
                </ListItemButton>
                <Divider/>

                <ListItemButton component="a" href="https://github.com/Reckless-Satoshi/robosats/issues">
                    <ListItemIcon><GitHubIcon/></ListItemIcon>
                    <ListItemText primary="Tell us about a new feature or a bug" 
                    secondary="Github Issues - The Robotic Satoshis Open Source Project"/>
                </ListItemButton>

            </List>
            </DialogContent>
        </Dialog>
    )
    }


    render() {
        return (
            <Paper elevation={6} style={{height:40}}>
                <this.StatsDialog/>
                <this.CommunityDialog/>
                <Grid container xs={12}>

                    <Grid item xs={1}>
                        <IconButton color="primary" 
                            aria-label="Stats for Nerds" 
                            onClick={this.handleClickOpenStatsForNerds} >
                            <SettingsIcon />
                        </IconButton>
                    </Grid>

                    <Grid item xs={2}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <InventoryIcon/>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.num_public_buy_orders} 
                                secondary="Public Buy Orders" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={2}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <SellIcon/>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.num_public_sell_orders} 
                                secondary="Public Sell Orders" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={2}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <SmartToyIcon/>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.num_active_robotsats} 
                                secondary="Num Active RoboSats" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={2}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <PriceChangeIcon/>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.today_avg_nonkyc_btc_premium+"%"} 
                                secondary="Today Non-KYC Avg Premium" />
                        </ListItem>
                    </Grid>

                    <Grid item xs={2}>
                        <ListItem className="bottomItem">
                            <ListItemIcon size="small">
                                <PercentIcon/>
                            </ListItemIcon>
                            <ListItemText 
                                primaryTypographyProps={{fontSize: '14px'}} 
                                secondaryTypographyProps={{fontSize: '12px'}} 
                                primary={this.state.fee*100} 
                                secondary="Trading Fee" />
                        </ListItem>
                    </Grid>

                    <Grid container item xs={1}>
                        <Grid item xs={2}/>
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
                        <Grid item xs={4}>
                            <IconButton 
                            color="primary" 
                            aria-label="Telegram" 
                            onClick={this.handleClickOpenCommunity} >
                                <PeopleIcon />
                            </IconButton>
                        </Grid>

                    </Grid>
                </Grid>
            </Paper>
        )
    }
}
