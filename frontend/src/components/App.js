import React, { Component } from "react";
import { render } from "react-dom";

import HomePage from "./HomePage";
import BottomBar from "./BottomBar";

export default class App extends Component {
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

  render() {
    return (
      <>
          <HomePage setAppState={this.setAppState}/>
      </>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);