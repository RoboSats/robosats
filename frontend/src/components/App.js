import React, { Component } from "react";
import { render } from "react-dom";
import HomePage from "./HomePage";
import { ThemeProvider, createTheme } from '@mui/material/styles';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: null,
      token: null,
      dark: false,
    }
  }

  setAppState=(newState)=>{
    this.setState(newState)
  }

  lightTheme = createTheme({
  });

  darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: "#222222"
      },
    },
  });

  render() {
    return (
      <ThemeProvider theme={this.state.dark ? this.darkTheme : this.lightTheme}>
        <HomePage setAppState={this.setAppState}/>
      </ThemeProvider>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);