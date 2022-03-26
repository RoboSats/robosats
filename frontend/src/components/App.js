import React, { Component } from "react";
import { render } from "react-dom";
import HomePage from "./HomePage";
import { CssBaseline, IconButton} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from "./UnsafeAlert";

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

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
        default: "#070707"
      },
    },
  });

  render() {
    return (
      <ThemeProvider theme={this.state.dark ? this.darkTheme : this.lightTheme}>
        <CssBaseline/>
        <IconButton sx={{position:'fixed',right:'0px'}} onClick={()=>this.setState({dark:!this.state.dark})}>
          {this.state.dark ? <LightModeIcon/>:<DarkModeIcon/>}
        </IconButton>
        <UnsafeAlert className="unsafeAlert"/>
        <HomePage setAppState={this.setAppState}/>
      </ThemeProvider>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);