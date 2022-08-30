import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { Badge, Tooltip, Stack, Paper, Button, FormControlLabel, Checkbox, RadioGroup, ListItemButton, Typography, Grid, Select, MenuItem, FormControl, FormHelperText, ListItemText, ListItemAvatar, IconButton, ButtonGroup} from "@mui/material";
import { Link } from 'react-router-dom'
import { DataGrid } from '@mui/x-data-grid';
import currencyDict from '../../static/assets/currencies.json';

import MediaQuery from 'react-responsive'
import FlagWithProps from './FlagWithProps'
import { pn, amountToString } from "../utils/prettyNumbers";
import PaymentText from './PaymentText'
import DepthChart from './Charts/DepthChart'
import RobotAvatar from './Robots/RobotAvatar'

// Icons
import { BarChart, FormatListBulleted, Refresh } from '@mui/icons-material';
import { BuySatsCheckedIcon, BuySatsIcon, SellSatsCheckedIcon, SellSatsIcon} from "./Icons";

class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: 6,
      view: 'list'
    };
  }

  componentDidMount() {
    this.getOrderDetails(2, 0)
  }

  getOrderDetails(type, currency) {
    this.props.setAppState({bookLoading: true});
    fetch('/api/book' + '?currency=' + currency + "&type=" + type)
      .then((response) => response.json())
      .then((data) => (this.props.setAppState({
        bookNotFound: data.not_found,
        bookLoading: false,
        bookOrders: data,
      })));
  }

  handleRowClick=(e)=>{
    this.props.history.push('/order/' + e);
  }

  handleCurrencyChange=(e)=>{
    var currency = e.target.value;
    this.props.setAppState({
      currency: currency,
      bookCurrencyCode: this.getCurrencyCode(currency),
    })
  }

  getCurrencyCode(val){
    const { t } = this.props;
    if (val){
      return val == 0 ? t('ANY_currency') : currencyDict[val.toString()]
    }else{
      return t('ANY_currency')
    }
  }


  // Colors for the status badges
  statusBadgeColor(status){
    if(status=='Active'){return("success")}
    if(status=='Seen recently'){return("warning")}
    if(status=='Inactive'){return('error')}
  }

  dataGridLocaleText=()=> {
    const { t } = this.props;
    return {
      MuiTablePagination:{labelRowsPerPage:t('Orders per page:')},
      noRowsLabel:t('No rows'),
      noResultsOverlayLabel:t('No results found.'),
      errorOverlayDefaultLabel:t('An error occurred.'),
      toolbarColumns:t('Columns'),
      toolbarColumnsLabel:t('Select columns'),
      columnsPanelTextFieldLabel:t('Find column'),
      columnsPanelTextFieldPlaceholder:t('Column title'),
      columnsPanelDragIconLabel:t('Reorder column'),
      columnsPanelShowAllButton:t('Show all'),
      columnsPanelHideAllButton:t('Hide all'),
      filterPanelAddFilter:t('Add filter'),
      filterPanelDeleteIconLabel:t('Delete'),
      filterPanelLinkOperator:t('Logic operator'),
      filterPanelOperators:t('Operator'), // TODO v6: rename to filterPanelOperator
      filterPanelOperatorAnd:t('And'),
      filterPanelOperatorOr:t('Or'),
      filterPanelColumns:t('Columns'),
      filterPanelInputLabel:t('Value'),
      filterPanelInputPlaceholder:t('Filter value'),
      filterOperatorContains:t('contains'),
      filterOperatorEquals:t('equals'),
      filterOperatorStartsWith:t('starts with'),
      filterOperatorEndsWith:t('ends with'),
      filterOperatorIs:t('is'),
      filterOperatorNot:t('is not'),
      filterOperatorAfter:t('is after'),
      filterOperatorOnOrAfter:t('is on or after'),
      filterOperatorBefore:t('is before'),
      filterOperatorOnOrBefore:t('is on or before'),
      filterOperatorIsEmpty:t('is empty'),
      filterOperatorIsNotEmpty:t('is not empty'),
      filterOperatorIsAnyOf:t('is any of'),
      filterValueAny:t('any'),
      filterValueTrue:t('true'),
      filterValueFalse:t('false'),
      columnMenuLabel:t('Menu'),
      columnMenuShowColumns:t('Show columns'),
      columnMenuFilter:t('Filter'),
      columnMenuHideColumn:t('Hide'),
      columnMenuUnsort:t('Unsort'),
      columnMenuSortAsc:t('Sort by ASC'),
      columnMenuSortDesc:t('Sort by DESC'),
      columnHeaderFiltersLabel:t('Show filters'),
      columnHeaderSortIconLabel:t('Sort'),
      booleanCellTrueLabel:t('yes'),
      booleanCellFalseLabel:t('no'),
    }
  }

  bookListTableDesktop=()=>{
    const { t } = this.props;
    return (
      <div style={{ height: 422, width:'100%'}}>
      <DataGrid
        localeText={this.dataGridLocaleText()}
        rows={
          this.props.bookOrders
              .filter(order => 
                (order.type == this.props.type || this.props.type == 2) && 
                (order.currency == this.props.currency || this.props.currency == 0)
              )
        }
        loading={this.props.bookLoading}
        columns={[
          // { field: 'id', headerName: 'ID', width: 40 },
          { 
            field: 'maker_nick', headerName: t("Robot"), width: 240,
            renderCell: (params) => {
              return (
                <ListItemButton style={{ cursor: "pointer" }}>
                  <ListItemAvatar>
                    <RobotAvatar order={params.row} />
                  </ListItemAvatar>
                  <ListItemText primary={params.row.maker_nick}/>
                </ListItemButton>
              );
            }
          },
          { field: 'type', headerName: t("Is"), width: 60, renderCell: (params) => params.row.type ? t("Seller"): t("Buyer") },
          { field: 'amount', headerName: t("Amount"), type: 'number', width: 90,
            renderCell: (params) => {
              return (
                <div style={{ cursor: "pointer" }}>
                  {amountToString(params.row.amount,params.row.has_range, params.row.min_amount, params.row.max_amount)}
                </div>
              )
            }
          },
          { field: 'currency', headerName: t("Currency"), width: 100,
            renderCell: (params) => {
              const currencyCode = this.getCurrencyCode(params.row.currency)
              return (
                <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                  {currencyCode + " "}
                  <FlagWithProps code={currencyCode} />
                </div>
              )
            }
          },
          { field: 'payment_method', headerName: t("Payment Method"), width: 180 ,
            renderCell: (params) => {
              return (
              <div style={{ cursor: "pointer" }}><PaymentText othersText={t("Others")} verbose={true} size={24} text={params.row.payment_method}/></div>
            )} 
          },
          { field: 'price', headerName: t("Price"), type: 'number', width: 140,
            renderCell: (params) => {return (
              <div style={{ cursor: "pointer" }}>{pn(params.row.price) + " " + params.row.currency + "/BTC" }</div>
            )} 
          },
          { field: 'premium', headerName: t("Premium"), type: 'number', width: 100,
            renderCell: (params) => {return (
              <div style={{ cursor: "pointer" }}>{parseFloat(parseFloat(params.row.premium).toFixed(4))+"%" }</div>
            )} 
          }]}

        components={{
          NoRowsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              <div style={{ height:"220px"}}/>
              {this.NoOrdersFound()}
            </Stack>
          ),
          NoResultsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              {t("Filter has no results")}
            </Stack>
          )
        }}
        pageSize={this.props.bookLoading ? 0 : this.state.pageSize}
        rowsPerPageOptions={[0,6,20,50]}
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
        localeText={this.dataGridLocaleText()}
        loading={this.props.bookLoading}
        rows={
          this.props.bookOrders.filter(order => 
            (order.type == this.props.type || this.props.type == 2) && 
            (order.currency == this.props.currency || this.props.currency == 0)
          )
        }
        columns={[
          // { field: 'id', headerName: 'ID', width: 40 },
          { field: 'maker_nick', headerName: t("Robot"), width: 64,
            renderCell: (params) => {
              return (
                <div style={{ position: "relative", left: "-5px" }}>
                  <RobotAvatar order={params.row} />
                </div>
              )
            }
          },
          { field: 'amount', headerName: t("Amount"), type: 'number', width: 84,
            renderCell: (params) => {return (
              <Tooltip placement="right" enterTouchDelay={0} title={t(params.row.type)}>
                <div style={{ cursor: "pointer" }}>
                  {amountToString(params.row.amount, params.row.has_range, params.row.min_amount, params.row.max_amount)}
                </div>
              </Tooltip>
            )} 
          },
          { field: 'currency', headerName: t("Currency"), width: 85,
            renderCell: (params) => { 
              const currencyCode = this.getCurrencyCode(params.row.currency)
              return (
                <div style={{ cursor: "pointer", display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                  {currencyCode + " "}
                  <FlagWithProps code={currencyCode} />
                </div>
              )
            } 
          },
          { field: 'payment_method', headerName: t("Payment Method"), width: 180, hide:'true'},
          { field: 'payment_icons', headerName: t("Pay"), width: 75 ,
            renderCell: (params) => {return (
              <div style={{position:'relative', left:'-4px', cursor: "pointer", align:"center"}}><PaymentText othersText={t("Others")} size={16} text={params.row.payment_method}/></div>
            )} 
          },
          { field: 'price', headerName: t("Price"), type: 'number', width: 140, hide:'true',
            renderCell: (params) => {return (
              <div style={{ cursor: "pointer" }}>{pn(params.row.price) + " " + params.row.currency+ "/BTC" }</div>
            )} 
          },
          { field: 'premium', headerName: t("Premium"), type: 'number', width: 85,
            renderCell: (params) => {return (
              <Tooltip placement="left" enterTouchDelay={0} title={pn(params.row.price) + " " + params.row.currency + "/BTC" }>
              <div style={{ cursor: "pointer" }}>{parseFloat(parseFloat(params.row.premium).toFixed(4))+"%" }</div>
              </Tooltip>
            )} 
          }]}

        components={{
          NoRowsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              <div style={{ height:"220px"}}/>
              {this.NoOrdersFound()}
            </Stack>
          ),
          NoResultsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              {t("Local filter returns no result")}
            </Stack>
          )
        }}
        pageSize={this.props.bookLoading ? 0 : this.state.pageSize}
        rowsPerPageOptions={[0,6,20,50]}
        onPageSizeChange={(newPageSize) => this.setState({pageSize:newPageSize})}
        onRowClick={(params) => this.handleRowClick(params.row.id)} // Whole row is clickable, but the mouse only looks clickly in some places.

      />
    </div>
    );
  }

  handleTypeChange=(buyChecked, sellChecked)=>{
    this.props.setAppState({buyChecked: buyChecked, sellChecked: sellChecked})

    if (buyChecked & sellChecked || !buyChecked & !sellChecked) {
      var type = 2
    } else if (buyChecked) {
      var type = 1
    } else if (sellChecked) {
      var type = 0
    }
    this.props.setAppState({type: type})
  }

  handleClickBuy=(e)=>{
    var buyChecked = e.target.checked
    var sellChecked =  this.props.sellChecked
    this.handleTypeChange(buyChecked, sellChecked);
  }

  handleClickView=()=>{
    this.setState({ view: this.state.view == 'depth' ? 'list' : 'depth' })
  }

  handleClickSell=(e)=>{
    var buyChecked = this.props.buyChecked
    var sellChecked = e.target.checked
    this.handleTypeChange(buyChecked, sellChecked);
  }

  NoOrdersFound=()=>{
    const { t } = this.props;

    return(
      <Grid item xs={12} align="center">
        <Grid item xs={12} align="center">
          <Typography component="h5" variant="h5">
            {this.props.type == 0 ?
              t("No orders found to sell BTC for {{currencyCode}}",{currencyCode:this.props.bookCurrencyCode})
            :
              t("No orders found to buy BTC for {{currencyCode}}",{currencyCode:this.props.bookCurrencyCode})
            }
          </Typography>
        </Grid>
        <br/>
        <Grid item>
          <Button size="large" variant="contained" color='primary' to='/make/' component={Link}>{t("Make Order")}</Button>
        </Grid>
          <Typography color="primary" variant="body1">
            <b>{t("Be the first one to create an order")}</b>
            <br/>
            <br/>
          </Typography>
      </Grid>
    )
  }

  mainView = () => {
    if (this.props.bookNotFound) { return this.NoOrdersFound() }

    const components = this.state.view == 'depth' ? [
        <DepthChart 
          bookLoading={this.props.bookLoading} 
          orders={this.props.bookOrders}
          lastDayPremium={this.props.lastDayPremium}
          currency={this.props.currency}
          setAppState={this.props.setAppState}
          limits={this.props.limits}
        />,
        <DepthChart 
          bookLoading={this.props.bookLoading} 
          orders={this.props.bookOrders}
          lastDayPremium={this.props.lastDayPremium}
          currency={this.props.currency}
          compact={true}
          setAppState={this.props.setAppState}
          limits={this.props.limits}
        />
    ] : [
      this.bookListTableDesktop(),
      this.bookListTablePhone()
    ]

    return (
      <>
        {/* Desktop */}
        <MediaQuery minWidth={930}>
          <Paper elevation={0} style={{width: 925, maxHeight: 500, overflow: 'auto'}}>
              <div style={{ height: 422, width:'100%'}}>
                {components[0]}
              </div>
          </Paper>
        </MediaQuery>
        {/* Smartphone */}
        <MediaQuery maxWidth={929}>
          <Paper elevation={0} style={{width: 395, maxHeight: 450, overflow: 'auto'}}>
              <div style={{ height: 422, width:'100%'}}>
                {components[1]}
              </div>
          </Paper>
        </MediaQuery>
      </>
    )
  }

  getTitle = () => {
    const { t } = this.props;

    if (this.state.view == 'list') {
      if (this.props.type == 0) { 
        return t("You are SELLING BTC for {{currencyCode}}",{currencyCode:this.props.bookCurrencyCode}) }
      else if (this.props.type == 1) {
        return t("You are BUYING BTC for {{currencyCode}}",{currencyCode:this.props.bookCurrencyCode}) }
      else {
        return t("You are looking at all")
      }
    } else if (this.state.view == 'depth') {
      return t("Depth chart")
    }
  }

  render() {
    const { t } = this.props;
      return (
        <Grid className='orderBook' container spacing={1} sx={{minWidth:400}}>

          <IconButton sx={{position:'fixed',right:'0px', top:'30px'}} onClick={()=>this.setState({loading: true}) & this.getOrderDetails(2, 0)}>
            <Refresh/>
          </IconButton>

          <Grid item xs={6} align="right">
            <FormControl align="center">
              <FormHelperText align="center" sx={{position:"relative", left:"10px", textAlign:"center"}}>
                {t("I want to")}
              </FormHelperText>
              <RadioGroup row>
                <div style={{position:"relative", left:"20px"}}>
                  <FormControlLabel
                      control={<Checkbox icon={<BuySatsIcon sx={{width:"30px",height:"30px"}} color="inherit"/>} checkedIcon={<BuySatsCheckedIcon sx={{width:"30px",height:"30px"}} color="primary"/>}/>}
                      label={
                        <div style={{position:"relative",top:"-13px"}}>
                          {this.props.buyChecked ?
                            <Typography variant="caption" color="primary"><b>{t("Buy")}</b></Typography>
                            :
                            <Typography variant="caption" color="text.secondary">{t("Buy")}</Typography>
                          }
                        </div>
                        }
                      labelPlacement="bottom"
                      checked={this.props.buyChecked}
                      onChange={this.handleClickBuy}
                  />
                </div>
                  <FormControlLabel
                      control={<Checkbox icon={<SellSatsIcon sx={{width:"30px",height:"30px"}} color="inherit"/>} checkedIcon={<SellSatsCheckedIcon sx={{width:"30px",height:"30px"}} color="secondary"/>}/>}
                      label={
                        <div style={{position:"relative",top:"-13px"}}>
                          {this.props.sellChecked ?
                            <Typography variant="caption" color="secondary"><b>{t("Sell")}</b></Typography>
                            :
                            <Typography variant="caption" color="text.secondary">{t("Sell")}</Typography>
                          }
                        </div>
                        }
                      labelPlacement="bottom"
                      checked={this.props.sellChecked}
                      onChange={this.handleClickSell}
                  />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={6} align="left">
            <FormControl align="center">
              <FormHelperText align="center" sx={{textAlign:"center", position:"relative", left:"-5px"}}>
                  {this.props.type == 0 ? t("and receive") : (this.props.type == 1 ? t("and pay with") : t("and use") )}
              </FormHelperText>
              <Select
                  //autoWidth={true}
                  sx={{width:120}}
                  label={t("Select Payment Currency")}
                  required={true}
                  value={this.props.currency}
                  inputProps={{
                      style: {textAlign:"center"}
                  }}
                  onChange={this.handleCurrencyChange}> 
                  <MenuItem value={0}><div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}><FlagWithProps code="ANY" />{" "+t("ANY_currency")}</div></MenuItem>
                  {Object.entries(currencyDict)
                    .map( ([key, value]) => <MenuItem key={key} value={parseInt(key)}>
                        <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}><FlagWithProps code={value}/>{" "+value}</div>
                        </MenuItem> )}
              </Select>
            </FormControl>
          </Grid>
          { this.props.bookNotFound ? <></> :
            <Grid item xs={12} align="center">
              <Typography component="h5" variant="h5">
                {this.getTitle()}
              </Typography>
            </Grid>
          }
          <Grid item xs={12} align="center">
            {this.mainView()}
          </Grid>
          <Grid item xs={12} align="center">
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
              { !this.props.bookNotFound ?
                <>
                  <Button variant="contained" color='primary' to='/make/' component={Link}>{t("Make Order")}</Button>
                  <Button color='inherit' style={{color: '#111111'}} onClick={this.handleClickView}>
                    { this.state.view == 'depth' ? 
                      <><FormatListBulleted /> {t("List")}</> : 
                      <><BarChart /> {t("Chart")}</>
                    }
                  </Button>
                </>
                : null
              }
              <Button color="secondary" variant="contained" to="/" component={Link}>
                  {t("Back")}
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
    );
  }
}

export default withTranslation()(BookPage);
