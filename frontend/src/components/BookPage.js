import React, { Component } from "react";
import { withTranslation, Trans} from "react-i18next";
import { Badge, Tooltip, Paper, Button, ListItemButton, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, ListItemText, ListItemAvatar, IconButton} from "@mui/material";
import { Link } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid';
import currencyDict from '../../static/assets/currencies.json';

import MediaQuery from 'react-responsive'
import Image from 'material-ui-image'
import getFlags from './getFlags'
import PaymentText from './PaymentText'

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';

class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: new Array({id:0,}),
      loading: true,
      pageSize: 6,
    };
    this.getOrderDetails(this.props.type, this.props.currency)
  }

  getOrderDetails(type, currency) {
    fetch('/api/book' + '?currency=' + currency + "&type=" + type)
      .then((response) => response.json())
      .then((data) => this.setState({
        orders: data,
        not_found: data.not_found,
        loading: false,
      }));
  }

  handleRowClick=(e)=>{
    this.props.history.push('/order/' + e);
  }

  handleTypeChange=(e)=>{
    this.setState({
        loading: true,     
    });
    this.props.setAppState({bookType: e.target.value})
    this.getOrderDetails(e.target.value,this.props.currency);
  }
  handleCurrencyChange=(e)=>{
    var currency = e.target.value;
    this.setState({loading: true})
    this.props.setAppState({
      bookCurrency: currency,
      bookCurrencyCode: this.getCurrencyCode(currency),
    })
    this.getOrderDetails(this.props.type, currency);
  }

  getCurrencyCode(val){
    const { t } = this.props;
    if (val){
      return val == 0 ? t('ANY_currency') : currencyDict[val.toString()]
    }else{
      return t('ANY_currency')
    }
  }

  // pretty numbers
  pn(x) {
    if(x == null){
        return 'null'
    }else{
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
  }
  
  // Colors for the status badges
  statusBadgeColor(status){
    if(status=='Active'){return("success")}
    if(status=='Seen recently'){return("warning")}
    if(status=='Inactive'){return('error')}
  }
  amountToString = (amount,has_range,min_amount,max_amount) => {
    if (has_range){
      return this.pn(parseFloat(Number(min_amount).toPrecision(2)))+'-'+this.pn(parseFloat(Number(max_amount).toPrecision(2)))
    }else{
      return this.pn(parseFloat(Number(amount).toPrecision(3)))
    }
  }

  bookListTableDesktop=()=>{
    const { t } = this.props;
    return (
      <div style={{ height: 422, width: '100%' }}>
      <DataGrid
        rows={
            this.state.orders.map((order) =>
            ({id: order.id,
              avatar: window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png',
              robot: order.maker_nick, 
              robot_status: order.maker_status,
              type: order.type ? t("Seller"): t("Buyer"),
              amount: order.amount,
              has_range: order.has_range,
              min_amount: order.min_amount,
              max_amount: order.max_amount,
              currency: this.getCurrencyCode(order.currency),
              payment_method: order.payment_method,
              price: order.price,
              premium: order.premium,
            })
          )}
        loading={this.state.loading}
        columns={[
          // { field: 'id', headerName: 'ID', width: 40 },
          { field: 'robot', headerName: t("Robot"), width: 240, 
            renderCell: (params) => {return (
              <ListItemButton style={{ cursor: "pointer" }}>
                <ListItemAvatar>
                <Tooltip placement="right" enterTouchDelay="0" title={t(params.row.robot_status)}>
                  <Badge variant="dot" overlap="circular" badgeContent="" color={this.statusBadgeColor(params.row.robot_status)}>
                    <div style={{ width: 45, height: 45 }}>
                      <Image className='bookAvatar' 
                          disableError='true'
                          disableSpinner='true'
                          color='null'
                          alt={params.row.robot}
                          src={params.row.avatar}
                      />
                    </div>
                  </Badge>
                </Tooltip>
                </ListItemAvatar>
                <ListItemText primary={params.row.robot}/>
              </ListItemButton>
            );
          } },
          { field: 'type', headerName: t("Is"), width: 60 },
          { field: 'amount', headerName: t("Amount"), type: 'number', width: 90,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.amountToString(params.row.amount,params.row.has_range, params.row.min_amount, params.row.max_amount)}</div>
          )}},
          { field: 'currency', headerName: t("Currency"), width: 100, 
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>{params.row.currency+" "}{getFlags(params.row.currency)}</div>)
          }},
          { field: 'payment_method', headerName: t("Payment Method"), width: 180 ,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}><PaymentText othersText={t("Others")} verbose={true} size={20} text={params.row.payment_method}/></div>
          )} },
          { field: 'price', headerName: t("Price"), type: 'number', width: 140,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.pn(params.row.price) + " " +params.row.currency+ "/BTC" }</div>
          )} },
          { field: 'premium', headerName: t("Premium"), type: 'number', width: 100,
            renderCell: (params) => {return (
              <div style={{ cursor: "pointer" }}>{parseFloat(parseFloat(params.row.premium).toFixed(4))+"%" }</div>
            )} },
          ]}

        pageSize={this.state.loading ? 0 : this.state.pageSize}
        rowsPerPageOptions={[6,20,50]}
        onPageSizeChange={(newPageSize) => this.setState({pageSize:newPageSize})}
        onRowClick={(params) => this.handleRowClick(params.row.id)} // Whole row is clickable, but the mouse only looks clickly in some places.
      />
    </div>
    );
  }

  bookListTablePhone=()=>{
    const { t } = this.props;
    return (
      <div style={{ height: 422, width: '100%' }}>
      <DataGrid
        loading={this.state.loading}
        rows={
            this.state.orders.map((order) =>
            ({id: order.id,
              avatar: window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png',
              robot: order.maker_nick, 
              robot_status: order.maker_status,
              type: order.type ? t("Seller"): t("Buyer"),
              amount: order.amount,
              has_range: order.has_range,
              min_amount: order.min_amount,
              max_amount: order.max_amount,
              currency: this.getCurrencyCode(order.currency),
              payment_method: order.payment_method,
              price: order.price,
              premium: order.premium,
            })
          )}

        columns={[
          // { field: 'id', headerName: 'ID', width: 40 },
          { field: 'robot', headerName: t("Robot"), width: 64, 
            renderCell: (params) => {return (
              <Tooltip placement="right" enterTouchDelay="0" title={params.row.robot+" ("+t(params.row.robot_status)+")"}>
                <Badge variant="dot" overlap="circular" badgeContent="" color={this.statusBadgeColor(params.row.robot_status)}>
                  <div style={{ width: 45, height: 45 }}>
                    <Image className='bookAvatar' 
                        disableError='true'
                        disableSpinner='true'
                        color='null'
                        alt={params.row.robot}
                        src={params.row.avatar}
                    />
                  </div>
                </Badge>
              </Tooltip>
            );
          } },
          { field: 'type', headerName: t("Is"), width: 60, hide:'true'},
          { field: 'amount', headerName: t("Amount"), type: 'number', width: 84, 
          renderCell: (params) => {return (
            <Tooltip placement="right" enterTouchDelay="0" title={t(params.row.type)}>
              <div style={{ cursor: "pointer" }}>{this.amountToString(params.row.amount,params.row.has_range, params.row.min_amount, params.row.max_amount)}</div>
            </Tooltip>
          )} },
          { field: 'currency', headerName: t("Currency"), width: 85, 
          renderCell: (params) => {return (
            // <Tooltip placement="left" enterTouchDelay="0" title={params.row.payment_method}>
              <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>{params.row.currency+" "}{getFlags(params.row.currency)}</div>
            // </Tooltip>
          )} },
          { field: 'payment_method', headerName: t("Payment Method"), width: 180, hide:'true'},
          { field: 'payment_icons', headerName: t("Pay"), width: 75 ,
          renderCell: (params) => {return (
            <div style={{position:'relative', left:'-4px', cursor: "pointer", align:"center"}}><PaymentText othersText={t("Others")} size={16} text={params.row.payment_method}/></div>
          )} },
          { field: 'price', headerName: t("Price"), type: 'number', width: 140, hide:'true',
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.pn(params.row.price) + " " +params.row.currency+ "/BTC" }</div>
          )} },
          { field: 'premium', headerName: t("Premium"), type: 'number', width: 85,
            renderCell: (params) => {return (
              <Tooltip placement="left" enterTouchDelay="0" title={this.pn(params.row.price) + " " +params.row.currency+ "/BTC" }>
              <div style={{ cursor: "pointer" }}>{parseFloat(parseFloat(params.row.premium).toFixed(4))+"%" }</div>
              </Tooltip>
            )} },
          ]}

        pageSize={this.state.loading ? 0 : this.state.pageSize}
        rowsPerPageOptions={[6,20,50]}
        onPageSizeChange={(newPageSize) => this.setState({pageSize:newPageSize})}
        onRowClick={(params) => this.handleRowClick(params.row.id)} // Whole row is clickable, but the mouse only looks clickly in some places.

      />
    </div>
    );
  }

  render() {
    const { t } = this.props;
      return (
        <Grid className='orderBook' container spacing={1} sx={{minWidth:400}}>

          <IconButton sx={{position:'fixed',right:'0px', top:'30px'}} onClick={()=>this.setState({loading: true}) & this.getOrderDetails(this.props.type, this.props.currency)}>
            <RefreshIcon/>
          </IconButton>

          <Grid item xs={6} align="right">
            <FormControl align="center">
              <FormHelperText align="center">
                {t("I want to")} 
              </FormHelperText>
              <Select
                  sx={{width:110}}
                  autoWidth={true}
                  label={t("Select Order Type")}
                  required="true" 
                  value={this.props.type} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleTypeChange}
              >   <MenuItem value={2}>{t("ANY_type")}</MenuItem>
                  <MenuItem value={1}>{t("BUY")}</MenuItem>
                  <MenuItem value={0}>{t("SELL")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} align="left">
            <FormControl align="center">
              <FormHelperText align="center">
                {this.props.type == 0 ? t("and receive") : (this.props.type == 1 ? t("and pay with") : t("and use") )} 
              </FormHelperText>
              <Select
                  //autoWidth={true}
                  sx={{width:120}}
                  label={t("Select Payment Currency")}
                  required="true" 
                  value={this.props.currency} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleCurrencyChange}
              >     <MenuItem value={0}><div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>{getFlags('ANY')}{" "+t("ANY_currency")}</div></MenuItem>
                    {
                      Object.entries(currencyDict)
                      .map( ([key, value]) => <MenuItem value={parseInt(key)}><div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>{getFlags(value)}{" "+value}</div></MenuItem> )
                    }
              </Select>
            </FormControl>
          </Grid>
        { this.state.not_found ? "" :
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
               {this.props.type == 0 ? 
                t("You are SELLING BTC for {{currencyCode}}",{currencyCode:this.props.currencyCode}) 
               : 
                (this.props.type == 1 ? 
                  t("You are BUYING BTC for {{currencyCode}}",{currencyCode:this.props.currencyCode})
                :
                  t("You are looking at all")
                )
               } 
            </Typography>
          </Grid>
          }

        { this.state.not_found ?
          (<Grid item xs={12} align="center">
            <Grid item xs={12} align="center">
              <Typography component="h5" variant="h5">
                {this.props.type == 0 ?
                  t("No orders found to sell BTC for {{currencyCode}}",{currencyCode:this.props.currencyCode})
                :
                  t("No orders found to buy BTC for {{currencyCode}}",{currencyCode:this.props.currencyCode})
                }
              </Typography>
            </Grid>
            <br/>
            <Grid item>
              <Button size="large" variant="contained" color='primary' to='/make/' component={Link}>{t("Make Order")}</Button>
            </Grid>
              <Typography color="primary" component="body1" variant="body1">
                {t("Be the first one to create an order")}
                <br/>
                <br/>
              </Typography>
          </Grid>)
          : 
          <Grid item xs={12} align="center">
            {/* Desktop Book */}
            <MediaQuery minWidth={930}>
              <Paper elevation={0} style={{width: 925, maxHeight: 500, overflow: 'auto'}}>
                  <this.bookListTableDesktop/>
              </Paper>
            </MediaQuery>

            {/* Smartphone Book */}
            <MediaQuery maxWidth={929}>
              <Paper elevation={0} style={{width: 395, maxHeight: 450, overflow: 'auto'}}>
                  <this.bookListTablePhone/>
              </Paper>
            </MediaQuery>
           </Grid>
          }
          <Grid item xs={12} align="center">
              <Button color="secondary" variant="contained" to="/" component={Link}>
                  {t("Back")}
              </Button>
          </Grid>
        </Grid>
    );
  };
}

export default withTranslation()(BookPage);