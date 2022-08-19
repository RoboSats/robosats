import React, { Component , Suspense } from "react";
import ReactDOM from 'react-dom/client';
import HomePage from "./HomePage";
import { CssBaseline, IconButton , Link} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from "./UnsafeAlert";
import { LearnDialog } from "./Dialogs";

import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

//Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SchoolIcon from '@mui/icons-material/School';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dark: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      openLearn: false,
      theme: {typography: { fontSize: 14 }},
    }
  }

  lightTheme = createTheme ({});

  darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: "#070707"
      },
    },
  });

  onZoomOutClick = () => {
    this.setState(({theme}) => ({
      theme: { 
        ...theme,
        typography: {
          fontSize: this.state.theme.typography.fontSize - 1,
        },
      }
    }));
  }

  render() {
    return (
      <Suspense fallback="loading language">
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={this.state.dark ? this.darkTheme : createTheme(this.state.theme)}>
          <CssBaseline/>
          <LearnDialog open={this.state.openLearn} onClose={()=> this.setState({openLearn:false})}/>
          <IconButton sx={{position:'fixed',right:'68px'}} onClick={this.onZoomOutClick}><ZoomOutIcon/></IconButton>
          <IconButton sx={{position:'fixed',right:'34px'}} onClick={()=> this.setState({openLearn:true})}><SchoolIcon/></IconButton>
          <IconButton sx={{position:'fixed',right:'0px'}} onClick={()=>this.setState({dark:!this.state.dark})}>
            {this.state.dark ? <LightModeIcon/>:<DarkModeIcon/>}
          </IconButton>
          <UnsafeAlert className="unsafeAlert"/>
          <HomePage {...this.state}/>
        </ThemeProvider>
      </I18nextProvider>
      </Suspense>
    );
  }
}

const root = ReactDOM.createRoot(
  document.getElementById("app")
);

root.render(<App />);
