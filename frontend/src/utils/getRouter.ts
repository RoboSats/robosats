import React from 'react';
import { MemoryRouter, HashRouter, BrowserRouter, BrowserRouterProps } from 'react-router-dom';

const getRouter = (): (({
  basename,
  children,
  window,
}: BrowserRouterProps) => React.JSX.Element) => {
  const [client] = window.RobosatsSettings.split('-');
  if (client === 'web') {
    return BrowserRouter;
  } else if (client === 'desktop') {
    return HashRouter;
  } else {
    return MemoryRouter;
  }
};

export default getRouter;
