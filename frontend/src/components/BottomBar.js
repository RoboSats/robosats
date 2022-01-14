import React, { Component } from 'react'
import {Paper, Grid, IconButton, Select, MenuItem, List, ListItemText, ListItem, ListItemIcon} from "@mui/material";

// Icons
import SettingsIcon from '@mui/icons-material/Settings';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

export default class BottomBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            num_public_buy_orders: null,
            num_active_robotsats: null,
            num_public_sell_orders: null,
            fee: null,
            today_avg_nonkyc_btc_premium: null,
            today_volume: null,
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

    render() {
        return (
            <Paper elevation={6} style={{height:40}}>
                <Grid container xs={12}>

                    <Grid item xs={1}>
                        <IconButton color="primary" aria-label="Stats for Nerds" component="span">
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
                                primary={this.state.today_avg_nonkyc_btc_premium} 
                                secondary="Today Avg Premium" />
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
                            <IconButton color="primary" aria-label="Telegram" onClick={this.handleClickSuppport}>
                                <SupportAgentIcon />
                            </IconButton>
                        </Grid>

                    </Grid>
                </Grid>
            </Paper>
        )
    }
}
