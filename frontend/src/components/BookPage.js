import React, { Component } from "react";
import { Badge, Tooltip, Paper, Button , CircularProgress, ListItemButton, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, List, ListItem, ListItemText, Avatar, RouterLink, ListItemAvatar, IconButton} from "@mui/material";
import { Link } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid';
import MediaQuery from 'react-responsive'
import Image from 'material-ui-image'
import getFlags from './getFlags'
import PaymentText from './PaymentText'

export default class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: new Array({id:0,}),
      currency: 0,
      type: 2,
      currencies_dict: {"0":"ANY"},
      loading: true,
      pageSize: 6,
    };
    this.getCurrencyDict()
    this.getOrderDetails(this.state.type, this.state.currency)
    this.state.currencyCode = this.getCurrencyCode(this.state.currency)
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
        type: e.target.value,
        loading: true,     
    });
    this.getOrderDetails(e.target.value,this.state.currency);
  }
  handleCurrencyChange=(e)=>{
    this.setState({
        currency: e.target.value,
        currencyCode: this.getCurrencyCode(e.target.value),
        loading: true,
    })
    this.getOrderDetails(this.state.type, e.target.value);
  }
  
  getCurrencyDict() {
    fetch('/static/assets/currencies.json')
      .then((response) => response.json())
      .then((data) => 
      this.setState({
        currencies_dict: data
      }));
  }

  getCurrencyCode(val){
    if (val){
      return this.state.currencies_dict[val.toString()]
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
    return (
      <div style={{ height: 422, width: '100%' }}>
      <DataGrid
        rows={
            this.state.orders.map((order) =>
            ({id: order.id,
              avatar: window.location.origin +'/static/assets/avatars/' + order.maker_nick + '.png',
              robot: order.maker_nick, 
              robot_status: order.maker_status,
              type: order.type ? "Seller": "Buyer",
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
          { field: 'robot', headerName: 'Robot', width: 240, 
            renderCell: (params) => {return (
              <ListItemButton style={{ cursor: "pointer" }}>
                <ListItemAvatar>
                <Tooltip placement="right" enterTouchDelay="0" title={params.row.robot_status}>
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
          { field: 'type', headerName: 'Is', width: 60 },
          { field: 'amount', headerName: 'Amount', type: 'number', width: 90,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.amountToString(params.row.amount,params.row.has_range, params.row.min_amount, params.row.max_amount)}</div>
          )}},
          { field: 'currency', headerName: 'Currency', width: 100, 
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>{params.row.currency+" "}{getFlags(params.row.currency)}</div>)
          }},
          { field: 'payment_method', headerName: 'Payment Method', width: 180 ,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}><PaymentText verbose={true} size={20} text={params.row.payment_method}/></div>
          )} },
          { field: 'price', headerName: 'Price', type: 'number', width: 140,
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.pn(params.row.price) + " " +params.row.currency+ "/BTC" }</div>
          )} },
          { field: 'premium', headerName: 'Premium', type: 'number', width: 100,
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
              type: order.type ? "Seller": "Buyer",
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
          { field: 'robot', headerName: 'Robot', width: 64, 
            renderCell: (params) => {return (
              <Tooltip placement="right" enterTouchDelay="0" title={params.row.robot+" ("+params.row.robot_status+")"}>
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
          { field: 'type', headerName: 'Is', width: 60, hide:'true'},
          { field: 'amount', headerName: 'Amount', type: 'number', width: 84, 
          renderCell: (params) => {return (
            <Tooltip placement="right" enterTouchDelay="0" title={params.row.type}>
              <div style={{ cursor: "pointer" }}>{this.amountToString(params.row.amount,params.row.has_range, params.row.min_amount, params.row.max_amount)}</div>
            </Tooltip>
          )} },
          { field: 'currency', headerName: 'Currency', width: 85, 
          renderCell: (params) => {return (
            // <Tooltip placement="left" enterTouchDelay="0" title={params.row.payment_method}>
              <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>{params.row.currency+" "}{getFlags(params.row.currency)}</div>
            // </Tooltip>
          )} },
          { field: 'payment_method', headerName: 'Payment Method', width: 180, hide:'true'},
          { field: 'payment_icons', headerName: 'Pay', width: 75 ,
          renderCell: (params) => {return (
            <div style={{position:'relative', left:'-4px', cursor: "pointer", align:"center"}}><PaymentText size={16} text={params.row.payment_method}/></div>
          )} },
          { field: 'price', headerName: 'Price', type: 'number', width: 140, hide:'true',
          renderCell: (params) => {return (
            <div style={{ cursor: "pointer" }}>{this.pn(params.row.price) + " " +params.row.currency+ "/BTC" }</div>
          )} },
          { field: 'premium', headerName: 'Premium', type: 'number', width: 85,
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
      return (
        <Grid className='orderBook' container spacing={1} sx={{minWidth:400}}>
          {/* <Grid item xs={12} align="center">
            <Typography component="h4" variant="h4">ORDER BOOK</Typography>
          </Grid> */}

          <Grid item xs={6} align="right">
            <FormControl align="center">
              <FormHelperText align="center">
                I want to 
              </FormHelperText>
              <Select
                  sx={{width:90}}
                  autoWidth={true}
                  label="Select Order Type"
                  required="true" 
                  value={this.state.type} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleTypeChange}
              >   <MenuItem value={2}>ANY</MenuItem>
                  <MenuItem value={1}>BUY</MenuItem>
                  <MenuItem value={0}>SELL</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} align="left">
            <FormControl align="center">
              <FormHelperText align="center">
                and {this.state.type == 0 ? ' receive' : (this.state.type == 1 ? ' pay with' : ' use' )} 
              </FormHelperText>
              <Select
                  //autoWidth={true}
                  sx={{width:110}}
                  label="Select Payment Currency"
                  required="true" 
                  value={this.state.currency} 
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleCurrencyChange}
              >     <MenuItem value={0}>🌍 ANY</MenuItem>
                    {
                      Object.entries(this.state.currencies_dict)
                      .map( ([key, value]) => <MenuItem value={parseInt(key)}><div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>{getFlags(value)}{" "+value}</div></MenuItem> )
                    }
              </Select>
            </FormControl>
          </Grid>
        { this.state.not_found ? "" :
          <Grid item xs={12} align="center">
            <Typography component="h5" variant="h5">
              You are {this.state.type == 0 ? <b> selling </b> : (this.state.type == 1 ? <b> buying </b> :" looking at all ")} BTC for {this.state.currencyCode ? this.state.currencyCode : 'ANY'}
            </Typography>
          </Grid>
          }

        { this.state.not_found ?
          (<Grid item xs={12} align="center">
            <Grid item xs={12} align="center">
              <Typography component="h5" variant="h5">
                No orders found to {this.state.type == 0 ? ' sell ' :' buy ' } BTC for {this.state.currencyCode}
              </Typography>
            </Grid>
            <br/>
            <Grid item>
              <Button variant="contained" color='primary' to='/make/' component={Link}>Make Order</Button>
            </Grid>
              <Typography component="body1" variant="body1">
                Be the first one to create an order
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
                  Back
              </Button>
          </Grid>
        </Grid>
    );
  };
}