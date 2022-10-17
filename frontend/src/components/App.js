import React, { Component, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './HomePage';
import { CssBaseline, IconButton } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from './UnsafeAlert';
import { LearnDialog } from './Dialogs';
import TorConnection from './TorConnection';

import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/Web';

// Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SchoolIcon from '@mui/icons-material/School';
import { systemClient } from '../services/System';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedSettings: false,
      openLearn: false,
      theme: createTheme({
        palette: {
          mode:
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light',
          background: {
            default:
              window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                ? '#070707'
                : '#fff',
          },
        },
      }),
    };
  }

  handleThemeChange = () => {
    if (this.state.theme.palette.mode === 'light') {
      this.setState(({ theme }) => ({
        theme: createTheme({
          typography: {
            fontSize: theme.typography.fontSize,
          },
          palette: {
            mode: 'dark',
            background: {
              default: '#070707',
            },
          },
        }),
      }));
    }
    if (this.state.theme.palette.mode === 'dark') {
      this.setState(({ theme }) => ({
        theme: createTheme({
          typography: {
            fontSize: theme.typography.fontSize,
          },
          palette: {
            mode: 'light',
            background: {
              default: '#fff',
            },
          },
        }),
      }));
    }
  };

  onSettingsClick = () => {
    this.setState({
      expandedSettings: !this.state.expandedSettings,
    });
  };

  onZoomClick = (direction) => {
    let zoomChange;
    direction === 'out' ? (zoomChange = -1) : (zoomChange = 1);
    this.setState(({ theme }) => ({
      theme: {
        ...theme,
        typography: {
          fontSize: this.state.theme.typography.fontSize + zoomChange,
        },
      },
    }));
  };

  render() {
    return (
      <Suspense fallback='loading language'>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={this.state.theme}>
            <CssBaseline />
            <LearnDialog
              open={this.state.openLearn}
              onClose={() => this.setState({ openLearn: false })}
            />
            <TorConnection />
            <IconButton
              color='inherit'
              sx={{ position: 'fixed', right: '34px', color: 'text.secondary' }}
              onClick={() => this.setState({ openLearn: true })}
            >
              <SchoolIcon />
            </IconButton>
            <IconButton
              color='inherit'
              sx={{ position: 'fixed', right: '0px', color: 'text.secondary' }}
              onClick={() => this.handleThemeChange()}
            >
              {this.state.theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <UnsafeAlert className='unsafeAlert' />
            <HomePage {...this.state} />
          </ThemeProvider>
        </I18nextProvider>
      </Suspense>
    );
  }
}

const loadApp = () => {
  if (systemClient.loading) {
    setTimeout(loadApp, 200);
  } else {
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<App />);
  }
};

loadApp();
