import React, { useEffect, useRef, useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { Grid, useTheme } from '@mui/material';

import { apiClient } from '../services/api';

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
} from '../models';

import { PlaceholderWidget, MakerWidget, BookWidget } from '../pro/Widgets';
import ToolBar from '../pro/ToolBar';
import LandingDialog from '../pro/LandingDialog';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

interface MainProps {
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const Main = ({ settings, setSettings }: MainProps): JSX.Element => {
  const theme = useTheme();

  const defaultLayout: Layout = [
    { i: 'MakerWidget', w: 6, h: 13, x: 42, y: 0, minW: 6, maxW: 12, minH: 9, maxH: 18 },
    { i: 'BookWidget', w: 27, h: 13, x: 21, y: 13, minW: 6, maxW: 40, minH: 9, maxH: 15 },
    { i: 'robots', w: 33, h: 13, x: 0, y: 0, minW: 15, maxW: 48, minH: 8, maxH: 20 },
    { i: 'history', w: 7, h: 9, x: 6, y: 13, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'trade', w: 9, h: 13, x: 33, y: 0, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'depth', w: 8, h: 9, x: 13, y: 13, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'settings', w: 6, h: 13, x: 0, y: 13, minW: 6, maxW: 12, minH: 9, maxH: 15 },
    { i: 'other', w: 15, h: 4, x: 6, y: 22, minW: 2, maxW: 30, minH: 4, maxH: 15 },
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

  const [openLanding, setOpenLanding] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }
    fetchLimits();
    fetchBook();
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

  const fetchBook = function () {
    setBook({ ...book, loading: true });
    apiClient.get('/api/book/').then((data: any) =>
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      }),
    );
  };

  const bookRef = useRef<HTMLInputElement>(null);
  console.log(bookRef);

  return (
    <Grid
      container
      direction='column'
      sx={{ width: `${windowSize.width * theme.typography.fontSize}px` }}
    >
      <Grid item>
        <ToolBar settings={settings} setSettings={setSettings} />
        <LandingDialog open={openLanding} onClose={() => setOpenLanding(!openLanding)} />
      </Grid>

      <Grid item sx={{ height: `${(windowSize.height / 16) * 14 - 3}em` }}>
        <GridLayout
          className='layout'
          layout={layout}
          cols={48}
          margin={[theme.typography.fontSize / 2, theme.typography.fontSize / 2]}
          isDraggable={!settings.freezeViewports}
          isResizable={!settings.freezeViewports}
          rowHeight={theme.typography.fontSize * 2.4}
          width={windowSize.width * theme.typography.fontSize}
          autoSize={true}
          onLayoutChange={(layout: Layout) => setLayout(layout)}
        >
          <div key='MakerWidget'>
            <MakerWidget
              ref={bookRef}
              limits={limits}
              fetchLimits={fetchLimits}
              fav={fav}
              setFav={setFav}
              maker={maker}
              setMaker={setMaker}
            />
          </div>
          <div key='BookWidget'>
            <BookWidget
              book={book}
              layoutBook={layout[1]}
              fetchBook={fetchBook}
              fav={fav}
              setFav={setFav}
              windowSize={windowSize}
            />
          </div>
          <PlaceholderWidget key='robots'>Robot Table</PlaceholderWidget>
          <PlaceholderWidget key='history'>Workspace History</PlaceholderWidget>
          <PlaceholderWidget key='trade'>
            Trade Box (for selected order in Robot Table)
          </PlaceholderWidget>
          <PlaceholderWidget key='depth'>Depth Chart</PlaceholderWidget>
          <PlaceholderWidget key='settings'>Settings</PlaceholderWidget>
          <PlaceholderWidget key='other'>Other</PlaceholderWidget>
        </GridLayout>
      </Grid>
    </Grid>
  );
};

export default Main;
