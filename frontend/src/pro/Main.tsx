import React, { useEffect, useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { Grid, useTheme } from '@mui/material';

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

import { PlaceholderWidget, MakerWidget } from '../pro/Widgets';
import ToolBar from '../pro/ToolBar';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

const Main = (): JSX.Element => {
  const theme = useTheme();

  const defaultLayout: Layout = [
    { i: 'robots', w: 30, h: 12, x: 0, y: 0, minW: 15, maxW: 48, minH: 8, maxH: 20 },
    { i: 'maker', w: 9, h: 12, x: 39, y: 0, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'book', w: 27, h: 11, x: 21, y: 12, minW: 6, maxW: 40, minH: 9, maxH: 15 },
    { i: 'history', w: 7, h: 11, x: 6, y: 12, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'trade', w: 9, h: 12, x: 30, y: 0, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'depth', w: 8, h: 11, x: 13, y: 12, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'settings', w: 6, h: 11, x: 0, y: 12, minW: 6, maxW: 12, minH: 9, maxH: 15 },
  ];

  // All app data structured
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<{ list: LimitList; loading: boolean }>({
    list: [],
    loading: true,
  });
  const [robot, setRobot] = useState<Robot>(defaultRobot);
  const [maker, setMaker] = useState<Maker>(defaultMaker);
  const [info, setInfo] = useState<Info>(defaultInfo);
  const [fav, setFav] = useState<Favorites>({ type: null, currency: 0 });
  const [layout, setLayout] = useState<Layout>(defaultLayout);

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }
    fetchLimits();
    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  const fetchLimits = async () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get('/api/limits/').then((data) => {
      setLimits({ list: data ?? [], loading: false });
      return data;
    });
    return await data;
  };

  console.log(layout);

  return (
    <Grid container direction='column' sx={{ width: `${(windowSize.width / 16) * 14}em` }}>
      <Grid item>
        <ToolBar width={windowSize.width} />
      </Grid>

      <Grid item sx={{ height: `${(windowSize.height / 16) * 14 - 3}em` }}>
        <GridLayout
          className='layout'
          layout={layout}
          cols={48}
          rowHeight={30}
          width={windowSize.width * theme.typography.fontSize}
          autoSize={true}
          onLayoutChange={(layout: Layout) => setLayout(layout)}
        >
          <div key='maker'>
            <MakerWidget
              limits={limits}
              fetchLimits={fetchLimits}
              fav={fav}
              setFav={setFav}
              maker={maker}
              setMaker={setMaker}
            />
          </div>
          <PlaceholderWidget key='book'>Book Table</PlaceholderWidget>
          <PlaceholderWidget key='robots'>Robot Table</PlaceholderWidget>
          <PlaceholderWidget key='history'>Workspace History</PlaceholderWidget>
          <PlaceholderWidget key='trade'>
            Trade Box (for selected order in Robot Table)
          </PlaceholderWidget>
          <PlaceholderWidget key='depth'>Depth Chart</PlaceholderWidget>
          <PlaceholderWidget key='settings'>Settings</PlaceholderWidget>
        </GridLayout>
      </Grid>
    </Grid>
  );
};

export default Main;
