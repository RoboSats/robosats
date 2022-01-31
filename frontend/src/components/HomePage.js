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
                        <Route exact path='/' render={(props) => <UserGenPage setAppState={this.setAppState}/>}/>
                        <Route path='/make' component={MakerPage}/>
                        <Route path='/book' component={BookPage}/>
                        <Route path="/order/:orderId" component={OrderPage}/>
                    </Switch>
                  </div>
                  <div className='bottomBar'>
                    <BottomBar redirectTo={this.redirectTo} {...this.state} setAppState={this.setAppState} />
                  </div>
              </Router>
          );
    }
}