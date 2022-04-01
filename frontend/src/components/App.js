import React, { Component } from "react";
import { render } from "react-dom";
import HomePage from "./HomePage";
import { CssBaseline, IconButton} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from "./UnsafeAlert";

import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dark: false,
      lang: 'en',
    }
  }

  setLang=(newLang)=>{
    this.setState({lang:newLang})
  }

  lightTheme = createTheme({});

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
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={this.state.dark ? this.darkTheme : this.lightTheme}>
          <CssBaseline/>
          <IconButton sx={{position:'fixed',right:'0px'}} onClick={()=>this.setState({dark:!this.state.dark})}>
            {this.state.dark ? <LightModeIcon/>:<DarkModeIcon/>}
          </IconButton>
          <UnsafeAlert className="unsafeAlert"/>
          <HomePage changeLang={i18n.changeLanguage}/>
        </ThemeProvider>
      </I18nextProvider>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);