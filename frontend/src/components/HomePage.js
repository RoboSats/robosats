import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";

import UserGenPage from "./UserGenPage";
import MakerPage from "./MakerPage";
import BookPage from "./BookPage";
import OrderPage from "./OrderPage";
import InfoPage from "./InfoPage";

export default class HomePage extends Component {
    constructor(props) {
      super(props);
    }

    render() {
        return (
              <Router >
                  <Switch>
                      <Route exact path='/' component={UserGenPage}/>
                      <Route path='/home'><p>You are at the start page</p></Route>
                      <Route path='/info' component={InfoPage}/>
                      <Route path='/make' component={MakerPage}/>
                      <Route path='/book' component={BookPage}/>
                      <Route path="/order/:orderId" component={OrderPage}/>
                  </Switch>
              </Router>
          );
    }
}