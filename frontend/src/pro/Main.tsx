import React, { useContext, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { Grid, styled, useTheme } from '@mui/material';

import {
  PlaceholderWidget,
  MakerWidget,
  BookWidget,
  DepthChartWidget,
  SettingsWidget,
  FederationWidget,
} from '../pro/Widgets';
import ToolBar from '../pro/ToolBar';
import LandingDialog from '../pro/LandingDialog';

import { AppContext, type UseAppStoreType } from '../contexts/AppContext';

// To Do. Add dotted grid when layout is not frozen
// ${freeze ?
//   `background: radial-gradient(${theme.palette.text.disabled} 1px, transparent 0px);
//   background-size: ${gridCellSize}em ${gridCellSize}em;
//   background-position: left 1em bottom 1.5em;`
// :''}

const StyledRGL = styled(GridLayout)(
  ({ height, width }) => `
  height: ${Number(height)}em;
  width: ${Number(width)}px;
  max-height: ${Number(height)}em;
  `,
);

const defaultLayout: Layout = [
  { i: 'Maker', w: 10, h: 16, x: 67, y: 0, minW: 8, maxW: 22, minH: 10, maxH: 28 },
  { i: 'Book', w: 43, h: 15, x: 34, y: 16, minW: 6, maxW: 70, minH: 9, maxH: 25 },
  { i: 'DepthChart', w: 15, h: 10, x: 19, y: 16, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  { i: 'Garage', w: 52, h: 16, x: 0, y: 0, minW: 15, maxW: 78, minH: 8, maxH: 30 },
  { i: 'History', w: 8, h: 10, x: 11, y: 16, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  { i: 'Trade', w: 15, h: 16, x: 52, y: 0, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  { i: 'Settings', w: 11, h: 15, x: 0, y: 16, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  { i: 'Other', w: 23, h: 5, x: 11, y: 26, minW: 2, maxW: 50, minH: 4, maxH: 25 },
];

const Main = (): React.JSX.Element => {
  const { settings, windowSize } = useContext<UseAppStoreType>(AppContext);

  const theme = useTheme();
  const em: number = theme.typography.fontSize;
  const toolbarHeight: number = 3;
  const gridCellSize: number = 2;

  const [openLanding, setOpenLanding] = useState<boolean>(true);
  const [layout, setLayout] = useState<Layout>(defaultLayout);

  return (
    <Grid container direction='column' sx={{ width: `${windowSize.width}em` }}>
      <Grid item>
        <ToolBar height={`${toolbarHeight}em`} />
        <LandingDialog
          open={openLanding}
          onClose={() => {
            setOpenLanding(!openLanding);
          }}
        />
      </Grid>

      <Grid item>
        <StyledRGL
          height={windowSize.height - toolbarHeight}
          width={Number((windowSize.width / gridCellSize).toFixed()) * gridCellSize * em}
          theme={theme}
          freeze={!settings.freezeViewports}
          gridCellSize={gridCellSize}
          className='layout'
          layout={layout}
          cols={Number((windowSize.width / gridCellSize).toFixed())} // cols are 2em wide
          margin={[0.5 * em, 0.5 * em]}
          isDraggable={!settings.freezeViewports}
          isResizable={!settings.freezeViewports}
          rowHeight={gridCellSize * em} // rows are 2em high
          autoSize={true}
          onLayoutChange={(layout: Layout) => {
            setLayout(layout);
          }}
        >
          <div key='Maker'>
            <MakerWidget />
          </div>
          <div key='Book'>
            <BookWidget layout={layout[1]} gridCellSize={gridCellSize} />
          </div>
          <div key='DepthChart'>
            <DepthChartWidget gridCellSize={gridCellSize} layout={layout[2]} />
          </div>
          <div key='Settings'>
            <SettingsWidget />
          </div>
          <div key='Garage'>
            <PlaceholderWidget label='Robot Garage' />
          </div>
          <div key='History'>
            <PlaceholderWidget label='Garage History' />
          </div>
          <div key='Trade'>
            <PlaceholderWidget label='Trade Box' />
          </div>
          <div key='Federation'>
            <FederationWidget layout={layout[7]} gridCellSize={gridCellSize} />
          </div>
        </StyledRGL>
      </Grid>
    </Grid>
  );
};

export default Main;
