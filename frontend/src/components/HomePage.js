import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import BottomBar from './BottomBar';

export default class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: null,
      token: null,
      copiedToken: false,
      avatarLoaded: false,
      buyChecked: false,
      sellChecked: false,
      type: null,
      currency: 0,
      bookCurrencyCode: 'ANY',
      bookOrders: new Array(),
      bookLoading: true,
      activeOrderId: null,
      lastOrderId: null,
      earnedRewards: 0,
      referralCode: '',
      lastDayPremium: 0,
      limits: {},
    };
  }

  setAppState = (newState) => {
    this.setState(newState);
  };

  redirectTo(location) {
    this.props.history.push(location);
  }

  render() {
    const fontSize = this.props.theme.typography.fontSize;
    const fontSizeFactor = fontSize / 14; // default fontSize is 14
    return (
      <Router>
        <div className='appCenter'>
          <Switch>
            <Route
              exact
              path='/'
              render={(props) => (
                <UserGenPage
                  {...props}
                  {...this.state}
                  {...this.props}
                  setAppState={this.setAppState}
                />
              )}
            />
            <Route
              path='/ref/:refCode'
              render={(props) => (
                <UserGenPage
                  {...props}
                  {...this.state}
                  {...this.props}
                  setAppState={this.setAppState}
                />
              )}
            />
            <Route
              path='/make'
              render={(props) => (
                <MakerPage
                  {...props}
                  {...this.state}
                  {...this.props}
                  setAppState={this.setAppState}
                />
              )}
            />
            <Route
              path='/book'
              render={(props) => (
                <BookPage
                  {...props}
                  {...this.state}
                  {...this.props}
                  setAppState={this.setAppState}
                />
              )}
            />
            <Route
              path='/order/:orderId'
              render={(props) => (
                <OrderPage
                  {...props}
                  {...this.state}
                  {...this.props}
                  setAppState={this.setAppState}
                />
              )}
            />
          </Switch>
        </div>
        <div
          className='bottomBar'
          style={{ height: `${40 * fontSizeFactor}px`, width: window.innerWidth }}
        >
          <BottomBar
            redirectTo={this.redirectTo}
            {...this.state}
            {...this.props}
            setAppState={this.setAppState}
          />
        </div>
      </Router>
    );
  }
}
