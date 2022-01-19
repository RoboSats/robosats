import React, { Component } from "react";
import { render } from "react-dom";

import HomePage from "./HomePage";
import BottomBar from "./BottomBar";

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <div className='appCenter'>
          <HomePage />
        </div>
        <div className='bottomBar'>
          <BottomBar />
        </div>
      </>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);