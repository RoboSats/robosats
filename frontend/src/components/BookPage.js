import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  IconButton,
  ButtonGroup,
} from '@mui/material';
import { Link } from 'react-router-dom';
import currencyDict from '../../static/assets/currencies.json';
import FlagWithProps from './FlagWithProps';
import DepthChart from './Charts/DepthChart';
import { apiClient } from '../services/api/index';

// Icons
import { BarChart, FormatListBulleted, Refresh } from '@mui/icons-material';
import BookTable from './BookTable';

class BookPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: 6,
      view: 'list',
    };
  }

  componentDidMount = () => {
    if (this.props.bookOrders.length < 1) {
      this.getOrderDetails(true, false);
    } else {
      this.getOrderDetails(false, true);
    }
  };

  getOrderDetails(loading, refreshing) {
    this.props.setAppState({ bookLoading: loading, bookRefreshing: refreshing });
    apiClient.get('/api/book/').then((data) =>
      this.props.setAppState({
        bookNotFound: data.not_found,
        bookLoading: false,
        bookRefreshing: false,
        bookOrders: data,
      }),
    );
  }

  handleRowClick = (e) => {
    this.props.history.push('/order/' + e);
  };

  handleCurrencyChange = (e) => {
    const currency = e.target.value;
    this.props.setAppState({
      currency,
      bookCurrencyCode: this.getCurrencyCode(currency),
    });
  };

  getCurrencyCode(val) {
    const { t } = this.props;
    if (val) {
      return val == 0 ? t('ANY_currency') : currencyDict[val.toString()];
    } else {
      return t('ANY_currency');
    }
  }

  handleTypeChange = (mouseEvent, val) => {
    this.props.setAppState({ type: val });
  };

  handleClickView = () => {
    this.setState({ view: this.state.view == 'depth' ? 'list' : 'depth' });
  };

  NoOrdersFound = () => {
    const { t } = this.props;

    return (
      <Grid item xs={12} align='center'>
        <Grid item xs={12} align='center'>
          <Typography component='h5' variant='h5'>
            {this.props.type == 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode: this.props.bookCurrencyCode,
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode: this.props.bookCurrencyCode,
                })}
          </Typography>
        </Grid>
        <br />
        <Grid item>
          <Button size='large' variant='contained' color='primary' to='/make/' component={Link}>
            {t('Make Order')}
          </Button>
        </Grid>
        <Typography color='primary' variant='body1'>
          <b>{t('Be the first one to create an order')}</b>
          <br />
          <br />
        </Typography>
      </Grid>
    );
  };

  mainView = (doubleView, widthEm, heightEm) => {
    if (this.props.bookNotFound) {
      return this.NoOrdersFound();
    }

    if (doubleView) {
      const width = widthEm * 0.9;
      const bookTableWidth = 85;
      const chartWidthEm = width - bookTableWidth;
      const tableWidthXS = (bookTableWidth / width) * 12;
      const chartWidthXS = (chartWidthEm / width) * 12;

      return (
        <Grid
          container
          alignItems='center'
          justifyContent='flex-start'
          spacing={1}
          direction='row'
          style={{ width: `${widthEm}em`, position: 'relative', left: `${widthEm / 140}em` }}
        >
          <Grid item xs={tableWidthXS} style={{ width: `${bookTableWidth}em` }}>
            <BookTable
              loading={this.props.bookLoading}
              refreshing={this.props.bookRefreshing}
              clickRefresh={() => this.getOrderDetails(false, true)}
              orders={this.props.bookOrders}
              type={this.props.type}
              currency={this.props.currency}
              maxWidth={bookTableWidth} // EM units
              maxHeight={heightEm * 0.8 - 11} // EM units
              fullWidth={widthEm} // EM units
              fullHeight={heightEm} // EM units
              defaultFullscreen={false}
            />
          </Grid>
          <Grid
            item
            xs={chartWidthXS}
            style={{ width: `${chartWidthEm}em`, position: 'relative', left: '-10em' }}
          >
            <DepthChart
              bookLoading={this.props.bookLoading}
              orders={this.props.bookOrders}
              lastDayPremium={this.props.lastDayPremium}
              currency={this.props.currency}
              compact={true}
              setAppState={this.props.setAppState}
              limits={this.props.limits}
              maxWidth={chartWidthEm} // EM units
              maxHeight={heightEm * 0.8 - 11} // EM units
            />
          </Grid>
        </Grid>
      );
    } else {
      if (this.state.view === 'depth') {
        return (
          <DepthChart
            bookLoading={this.props.bookLoading}
            orders={this.props.bookOrders}
            lastDayPremium={this.props.lastDayPremium}
            currency={this.props.currency}
            compact={true}
            setAppState={this.props.setAppState}
            limits={this.props.limits}
            maxWidth={widthEm * 0.8} // EM units
            maxHeight={heightEm * 0.8 - 11} // EM units
          />
        );
      } else {
        return (
          <BookTable
            loading={this.props.bookLoading}
            refreshing={this.props.bookRefreshing}
            clickRefresh={() => this.getOrderDetails(false, true)}
            orders={this.props.bookOrders}
            type={this.props.type}
            currency={this.props.currency}
            maxWidth={widthEm * 0.97} // EM units
            maxHeight={heightEm * 0.8 - 11} // EM units
            fullWidth={widthEm} // EM units
            fullHeight={heightEm} // EM units
            defaultFullscreen={false}
          />
        );
      }
    }
  };

  getTitle = (doubleView) => {
    const { t } = this.props;

    if (this.state.view == 'list' || doubleView) {
      if (this.props.type == 0) {
        return t('You are SELLING BTC for {{currencyCode}}', {
          currencyCode: this.props.bookCurrencyCode,
        });
      } else if (this.props.type == 1) {
        return t('You are BUYING BTC for {{currencyCode}}', {
          currencyCode: this.props.bookCurrencyCode,
        });
      } else {
        return t('You are looking at all');
      }
    } else if (this.state.view == 'depth') {
      return t('Depth chart');
    }
  };

  mainFilters = () => {
    const { t } = this.props;
    return (
      <>
        <Grid item xs={6} align='right'>
          <FormControl align='center'>
            <FormHelperText align='center' sx={{ textAlign: 'center' }}>
              {t('I want to')}
            </FormHelperText>
            <div style={{ textAlign: 'center' }}>
              <ToggleButtonGroup
                sx={{ height: '3.52em' }}
                size='large'
                exclusive={true}
                value={this.props.type}
                onChange={this.handleTypeChange}
              >
                <ToggleButton value={1} color={'primary'}>
                  {t('Buy')}
                </ToggleButton>
                <ToggleButton value={0} color={'secondary'}>
                  {t('Sell')}
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </FormControl>
        </Grid>

        <Grid item xs={6} align='left'>
          <FormControl align='center'>
            <FormHelperText
              align='center'
              sx={{ textAlign: 'center', position: 'relative', left: '-5px' }}
            >
              {this.props.type == 0
                ? t('and receive')
                : this.props.type == 1
                ? t('and pay with')
                : t('and use')}
            </FormHelperText>
            <Select
              // autoWidth={true}
              sx={{ width: 120 }}
              label={t('Select Payment Currency')}
              required={true}
              value={this.props.currency}
              inputProps={{
                style: { textAlign: 'center' },
              }}
              onChange={this.handleCurrencyChange}
            >
              <MenuItem value={0}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <FlagWithProps code='ANY' />
                  {' ' + t('ANY_currency')}
                </div>
              </MenuItem>
              {Object.entries(currencyDict).map(([key, value]) => (
                <MenuItem key={key} value={parseInt(key)}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <FlagWithProps code={value} />
                    {' ' + value}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </>
    );
  };

  render() {
    const { t } = this.props;
    const widthEm = this.props.windowWidth / this.props.theme.typography.fontSize;
    const heightEm = this.props.windowHeight / this.props.theme.typography.fontSize;
    const doubleView = widthEm > 115;

    return (
      <Grid className='orderBook' container spacing={1} sx={{ minWidth: 400 }}>
        {this.mainFilters()}
        <Grid item xs={12} align='center'>
          <Typography component='h5' variant='h5'>
            {this.getTitle(doubleView)}
          </Typography>
        </Grid>
        <Grid item xs={12} align='center'>
          {this.mainView(doubleView, widthEm, heightEm)}
        </Grid>
        <Grid item xs={12} align='center'>
          <ButtonGroup variant='contained' aria-label='outlined primary button group'>
            {!this.props.bookNotFound ? (
              <>
                <Button variant='contained' color='primary' to='/make/' component={Link}>
                  {t('Make Order')}
                </Button>
                {doubleView ? null : (
                  <Button
                    color='inherit'
                    style={{ color: '#111111' }}
                    onClick={this.handleClickView}
                  >
                    {this.state.view == 'depth' ? (
                      <>
                        <FormatListBulleted /> {t('List')}
                      </>
                    ) : (
                      <>
                        <BarChart /> {t('Chart')}
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : null}
            <Button color='secondary' variant='contained' to='/' component={Link}>
              {t('Back')}
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(BookPage);
