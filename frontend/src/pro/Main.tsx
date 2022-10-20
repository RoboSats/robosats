import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme } from '@mui/material';

import { apiClient } from '../services/api';
import checkVer from '../utils/checkVer';

import {
  Book,
  LimitList,
  Maker,
  Robot,
  Info,
  Settings,
  Favorites,
  defaultMaker,
  defaultRobot,
  defaultInfo,
  defaultSettings,
} from '../models';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

const Main = (): JSX.Element => {
  return <span> "Robosats PRO" </span>;
};

export default Main;
