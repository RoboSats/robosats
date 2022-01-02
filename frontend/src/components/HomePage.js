import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";

import NickGenPage from "./NickGenPage";
import LoginPage from "./LoginPage.js";
import MakerPage from "./MakerPage";
import BookPage from "./BookPage";
import OrderPage from "./OrderPage";
import WaitingRoomPage from "./WaitingRoomPage";

export default class HomePage extends Component {
    constructor(props) {
      super(props);
    }

    render() {
        return (
              <Router >
                  <Switch>
                      <Route exact path='/' component={NickGenPage}/>
                      <Route path='/home'><p>You are at the start page</p></Route>
                      <Route path='/login'component={LoginPage}/>
                      <Route path='/make' component={MakerPage}/>
                      <Route path='/book' component={BookPage}/>
                      <Route path="/order/:orderId" component={OrderPage}/>
                      <Route path='/wait' component={WaitingRoomPage}/>
                  </Switch>
              </Router>
          );
    }
}