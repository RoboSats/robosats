import React, { Component } from 'react';
import { HashRouter, BrowserRouter, Switch, Route } from 'react-router-dom';

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
      bookRefreshing: false,
      activeOrderId: null,
      lastOrderId: null,
      earnedRewards: 0,
      referralCode: '',
      lastDayPremium: 0,
      limits: {},
      loadingLimits: true,
      maker: {},
    };
  }

  componentDidMount = () => {
    if (typeof window !== undefined) {
      this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
      window.addEventListener('resize', this.onResize);
    }
  };

  componentWillUnmount = () => {
    if (typeof window !== undefined) {
      window.removeEventListener('resize', this.onResize);
    }
  };

  onResize = () => {
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
  };

  setAppState = (newState) => {
    this.setState(newState);
  };

  setMaker = (newMaker) => {
    this.setState({
      ...this.state,
      maker: {
        ...this.state.maker,
        ...newMaker,
      },
    });
  };

  redirectTo(location) {
    this.props.history.push(location);
  }

  getBasename() {
    if (window.NativeRobosats) {
      // Only for Android
      return window.location.pathname;
    }

    return '';
  }

  render() {
    const fontSize = this.props.theme.typography.fontSize;
    const fontSizeFactor = fontSize / 14; // default fontSize is 14
    const Router = window.NativeRobosats ? HashRouter : BrowserRouter;

    return (
      <Router basename={this.getBasename()}>
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
                  setMaker={this.setMaker}
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
          style={{ height: `${40 * fontSizeFactor}px`, width: this.state.windowWidth }}
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
