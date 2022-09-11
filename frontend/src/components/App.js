import React, { Component, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './HomePage';
import { CssBaseline, IconButton, Link } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnsafeAlert from './UnsafeAlert';
import { LearnDialog } from './Dialogs';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SchoolIcon from '@mui/icons-material/School';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SettingsIcon from '@mui/icons-material/Settings';

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
            <IconButton
              color='inherit'
              sx={{ position: 'fixed', right: '34px' }}
              onClick={() => this.setState({ openLearn: true })}
            >
              <SchoolIcon />
            </IconButton>
            <IconButton
              color='inherit'
              sx={{ position: 'fixed', right: '0px' }}
              onClick={() => this.handleThemeChange()}
            >
              {this.state.theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton
              sx={{ position: 'fixed', right: '34px' }}
              onClick={() => this.setState({ openLearn: true })}
            >
              <SchoolIcon />
            </IconButton>
            <UnsafeAlert className='unsafeAlert' />
            <HomePage {...this.state} />
          </ThemeProvider>
        </I18nextProvider>
      </Suspense>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(<App />);
