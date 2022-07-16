import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Avatar,
    Badge,
    ToggleButton,
    ToggleButtonGroup,
    List,
    Chip,
    ListItem,
    ListItemText,
    ListItemIcon,
    Grid,
    Divider,
    Typography,
} from "@mui/material"
import { pn } from "../utils/prettyNumbers";

// Icons
import FlagWithProps from "./FlagWithProps";
import PercentIcon from '@mui/icons-material/Percent';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RouteIcon from '@mui/icons-material/Route';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LinkIcon from '@mui/icons-material/Link';
import { RoboSatsNoTextIcon , SendReceiveIcon , BitcoinIcon} from "./Icons";

interface Item {
  id: string;
  name: string;
}

type Props = {
  isMaker: boolean;
  makerNick: string;
  takerNick: string;
  currencyCode: string;
  makerSummary: Record<string, Item>;
  takerSummary: Record<string, Item>;
  platformSummary: Record<string, Item>;
  bondPercent: number;
}

const TradeSummary = ({
  isMaker,
  makerNick,
  takerNick,
  currencyCode,
  makerSummary,
  takerSummary,
  platformSummary,
  bondPercent,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [buttonValue, setButtonValue] = useState<number>(isMaker ? 0 : 2);
  var userSummary = buttonValue == 0 ? makerSummary : takerSummary;

  return (
    <Grid item xs={12} align="center">
      <List>
        <Divider>
          <Chip label={t("Trade Summary")}/>
        </Divider>
      </List>
      <ToggleButtonGroup
        size="small" 
        value={buttonValue} 
        exclusive>
          <ToggleButton value={0} disableRipple={true} onClick={() => setButtonValue(0)}>
            <Avatar 
              className="flippedSmallAvatar"
              sx={{height:24,width:24}}
              alt={makerNick}
              src={window.location.origin +'/static/assets/avatars/' + makerNick + '.png'}
                />
            &nbsp;
            {t("Maker")}
          </ToggleButton>
          <ToggleButton value={1} disableRipple={true} onClick={() => setButtonValue(1)}>
            <RoboSatsNoTextIcon/>
          </ToggleButton>
          <ToggleButton value={2} disableRipple={true} onClick={() => setButtonValue(2)}>
            {t("Taker")}
            &nbsp;
            <Avatar 
              className="smallAvatar"
              sx={{height:24,width:24}}
              alt={takerNick}
              src={window.location.origin +'/static/assets/avatars/' + takerNick + '.png'}
                />
          </ToggleButton>
      </ToggleButtonGroup>
    
    {/* Maker/Taker Summary */}
      <div style={{display: [0,2].includes(buttonValue) ? '':'none'}}>
        <List dense={true}>
          <ListItem>
            <ListItemIcon>
              <Badge 
                overlap="circular" 
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}} 
                badgeContent={<div 
                                style={{position:"relative", left:"3px", top:"2px"}}> 
                                {userSummary.is_buyer ? 
                                  <SendReceiveIcon 
                                    sx={{transform: "scaleX(-1)",height:"18px",width:"18px"}} 
                                    color="secondary"/> 
                                  : <SendReceiveIcon 
                                    sx={{height:"18px",width:"18px"}} 
                                    color="primary"/>
                                }
                              </div>}>
                <AccountBoxIcon sx={{position:'relative',left:-2,width:28,height:28}}/>
              </Badge>
            </ListItemIcon>
            <ListItemText 
              primary={userSummary.is_buyer ? t("Buyer") : t("Seller")}
              secondary={t("User role")}/>

            <ListItemIcon>
              <div style={{position:'relative',left:15,zoom:1.25,opacity: 0.7,msZoom:1.25,WebkitZoom:1.25,MozTransform:'scale(1.25,1.25)',MozTransformOrigin:'left center'}}>
                <FlagWithProps code={currencyCode}/>
              </div>
            </ListItemIcon>
            <ListItemText 
              primary={(userSummary.is_buyer ? pn(userSummary.sent_fiat) : pn(userSummary.received_fiat))+" "+currencyCode}
              secondary={userSummary.is_buyer ? t("Sent") : t("Received")}/>
          </ListItem>
        
          <ListItem>
            <ListItemIcon>
              <BitcoinIcon/>
            </ListItemIcon>
            <ListItemText 
              primary={pn(userSummary.is_buyer ? userSummary.received_sats : userSummary.sent_sats)+" Sats"}
              secondary={userSummary.is_buyer ? "BTC received" : "BTC sent"}/>

          <ListItemText 
              primary={t("{{tradeFeeSats}} Sats ({{tradeFeePercent}}%)",{tradeFeeSats:userSummary.trade_fee_sats,tradeFeePercent:parseFloat((userSummary.trade_fee_percent*100).toPrecision(3))})}
              secondary={"Trade fee"}/>
          </ListItem>
          
          {userSummary.is_swap ? 
          <ListItem>
            <ListItemIcon>
              <LinkIcon/>
            </ListItemIcon>
            <ListItemText 
              primary={t("{{swapFeeSats}} Sats ({{swapFeePercent}}%)" , {swapFeeSats:pn(userSummary.swap_fee_sats), swapFeePercent:userSummary.swap_fee_percent})}
              secondary={t("Onchain swap fee")}/>
            <ListItemText 
              primary={t("{{miningFeeSats}} Sats",{miningFeeSats:userSummary.mining_fee_sats})}
              secondary={t("Mining fee")}/>
          </ListItem>
          : null}

          <ListItem>
            <ListItemIcon>
              <LockOpenIcon color="success"/>
            </ListItemIcon>
            <ListItemText 
              primary={t("{{bondSats}} Sats ({{bondPercent}}%)" , {bondSats:pn(userSummary.bond_size_sats), bondPercent:userSummary.bond_size_percent})}
              secondary={buttonValue === 0 ? t("Maker bond") : t("Taker bond") }/>
            <ListItemText 
              sx={{color:'#2e7d32'}}
              primary={<b>{t("Unlocked")}</b>}/>
          </ListItem>
        </List>
      </div>
    {/* Platform Summary */}
      <div style={{display: buttonValue == 1 ? '':'none'}}>
        <List dense={true}>
          <ListItem>
            <ListItemIcon>
              <AccountBalanceIcon/>
            </ListItemIcon>
            <ListItemText 
              primary={t("{{revenueSats}} Sats",{revenueSats:platformSummary.trade_revenue_sats})}
              secondary={t("Platform trade revenue")}/>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <RouteIcon/>
            </ListItemIcon>
            <ListItemText 
              primary={t("{{routingFeeSats}} MiliSats",{routingFeeSats:platformSummary.routing_fee_sats})}
              secondary={t("Platform covered routing fee")}/>
          </ListItem>
        </List>
      </div>
    </Grid>
  );
};
  
export default TradeSummary;
  