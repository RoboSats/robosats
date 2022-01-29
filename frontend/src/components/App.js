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
        <div className='appCenter'>
          <HomePage setAppState={this.setAppState}/>
        </div>
        <div className='bottomBar'>
          <BottomBar {...this.state} setAppState={this.setAppState} />
        </div>
      </>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);