import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route, Link, Redirect,useHistory } from "react-router-dom";

import UserGenPage from "./UserGenPage";
import MakerPage from "./MakerPage";
import BookPage from "./BookPage";
import OrderPage from "./OrderPage";
import BottomBar from "./BottomBar";

export default class HomePage extends Component {
    constructor(props) {
      super(props);
      this.state = {
        nickname: null,
        token: null,
        avatarLoaded: false,
        bookType:2,
        bookCurrency:0,
        bookCurrencyCode:'ANY',
      }
    }
  
    setAppState=(newState)=>{
      this.setState(newState)
    }

    redirectTo(location) {
    this.props.history.push(location);
    }

    render() {
        return (
              <Router >
                  <div className='appCenter'>
                    <Switch>
                        <Route exact path='/' render={(props) => <UserGenPage {...props} {...this.state} setAppState={this.setAppState}/>}/>
                        <Route path='/ref/:refCode' render={(props) => <UserGenPage {...props} {...this.state} setAppState={this.setAppState}/>}/>
                        <Route path='/make' component={MakerPage}/>
                        <Route path='/book' render={(props) => <BookPage {...props} type={this.state.bookType} currencyCode={this.state.bookCurrencyCode} currency={this.state.bookCurrency} setAppState={this.setAppState} />}/>
                        <Route path="/order/:orderId" component={OrderPage}/>
                    </Switch>
                  </div>
                  <div className='bottomBar'>
                    <BottomBar changeLang={this.props.changeLang} redirectTo={this.redirectTo} {...this.state} setAppState={this.setAppState} />
                  </div>
              </Router>
          );
    }
}