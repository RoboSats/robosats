import React, { useContext, useState, useCallback, useMemo, useEffect } from 'react';
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
import ToolBar, { type WidgetInfo } from '../pro/ToolBar';
import WidgetDrawer from '../pro/ToolBar/WidgetDrawer';
import LandingDialog from '../pro/LandingDialog';

import { AppContext, type UseAppStoreType } from '../contexts/AppContext';
import { type Settings } from '../models';
import { getRouter } from '../utils';

const Router = getRouter();

interface StyledRGLProps {
  gridHeight: number;
  isDragging?: boolean;
}

const StyledRGL = styled(GridLayout, {
  shouldForwardProp: (prop) => prop !== 'gridHeight' && prop !== 'isDragging',
})<StyledRGLProps>(
  ({ gridHeight, width, isDragging }) => `
  min-height: ${gridHeight}em;
  width: ${Number(width)}px;
  ${isDragging ? 'pointer-events: auto; user-select: none;' : ''}
  `,
);

const defaultLayout: Layout = [];

const Main = (): React.JSX.Element => {
  const { settings, setSettings, windowSize } = useContext<UseAppStoreType>(AppContext);

  const theme = useTheme();
  const em: number = theme.typography.fontSize;
  const toolbarHeight: number = 3;
  const gridCellSize: number = 2;

  const [openLanding, setOpenLanding] = useState<boolean>(true);
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(settings.freezeViewports);

  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  useEffect(() => {
    setIsLocked(settings.freezeViewports);
  }, [settings.freezeViewports]);

  const handleToggleLock = useCallback(() => {
    setIsLocked((prevLocked) => {
      const newLocked = !prevLocked;
      setSettings((prev: Settings) => ({
        ...prev,
        freezeViewports: newLocked,
      }));
      setLayout((prevLayout) =>
        prevLayout.map((item) => ({
          ...item,
          static: newLocked,
          isDraggable: !newLocked,
          isResizable: !newLocked,
        })),
      );

      return newLocked;
    });
  }, [setSettings]);

  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleDragStop = useCallback(
    (newLayout: Layout) => {
      setLayout(newLayout);
      setIsDragging(false);
    },
    [setLayout],
  );

  const handleResizeStop = useCallback(
    (newLayout: Layout) => {
      setLayout(newLayout);
      setIsDragging(false);
    },
    [setLayout],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const findNextPosition = useCallback(
    (_w: number, _h: number): { x: number; y: number } => {
      let y = 0;

      layout.forEach((item) => {
        const itemBottom = item.y + item.h;
        if (itemBottom > y) y = itemBottom;
      });

      return { x: 0, y };
    },
    [layout, windowSize.width, gridCellSize],
  );

  const handleAddWidget = useCallback(
    (widget: WidgetInfo) => {
      if (layout.some((item) => item.i === widget.id)) return;

      const pos = findNextPosition(widget.defaultSize.w, widget.defaultSize.h);
      const newItem = {
        i: widget.id,
        x: pos.x,
        y: pos.y,
        w: widget.defaultSize.w,
        h: widget.defaultSize.h,
        minW: widget.defaultSize.minW,
        minH: widget.defaultSize.minH,
        maxW: widget.defaultSize.maxW,
        maxH: widget.defaultSize.maxH,
        static: isLocked,
        isDraggable: !isLocked,
        isResizable: !isLocked,
      };

      setLayout((prev) => [...prev, newItem]);
    },
    [layout, findNextPosition, isLocked],
  );

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLayout((prev) => prev.filter((item) => item.i !== widgetId));
  }, []);

  const renderedWidgets = useMemo(() => {
    const widgetMap: Record<string, React.ReactNode> = {
      Maker: <MakerWidget />,
      Book: <BookWidget layout={layout.find((l) => l.i === 'Book')} gridCellSize={gridCellSize} />,
      DepthChart: (
        <DepthChartWidget
          gridCellSize={gridCellSize}
          layout={layout.find((l) => l.i === 'DepthChart')}
        />
      ),
      Settings: <SettingsWidget />,
      Garage: <PlaceholderWidget label='Robot Garage' />,
      History: <PlaceholderWidget label='Garage History' />,
      Trade: <PlaceholderWidget label='Trade Box' />,
      Federation: (
        <FederationWidget
          layout={layout.find((l) => l.i === 'Federation')}
          gridCellSize={gridCellSize}
        />
      ),
    };

    return layout.map((item) => (
      <div key={item.i}>{widgetMap[item.i] ?? <PlaceholderWidget label={item.i} />}</div>
    ));
  }, [layout, gridCellSize]);

  const currentWidgets = useMemo(() => layout.map((item) => item.i), [layout]);

  return (
    <Router>
      <Grid container direction='column' sx={{ width: `${windowSize.width}em` }}>
        <WidgetDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currentWidgets={currentWidgets}
          onAddWidget={handleAddWidget}
          onRemoveWidget={handleRemoveWidget}
        />
        <Grid item>
          <ToolBar
            height={`${toolbarHeight}em`}
            layout={layout}
            setLayout={setLayout}
            defaultLayout={defaultLayout}
            isLocked={isLocked}
            onToggleLock={handleToggleLock}
            onToggleDrawer={handleToggleDrawer}
          />
          <LandingDialog
            open={openLanding}
            onClose={() => {
              setOpenLanding(!openLanding);
            }}
          />
        </Grid>

        <Grid item>
          <StyledRGL
            gridHeight={windowSize.height - toolbarHeight}
            width={Number((windowSize.width / gridCellSize).toFixed()) * gridCellSize * em}
            className='layout'
            useCSSTransforms={true}
            transformScale={1}
            layout={layout}
            cols={Number((windowSize.width / gridCellSize).toFixed())}
            margin={[0.5 * em, 0.5 * em]}
            isDraggable={!isLocked}
            isResizable={!isLocked}
            isDragging={isDragging}
            rowHeight={gridCellSize * em}
            autoSize={true}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            draggableCancel='.noDrag'
          >
            {renderedWidgets}
          </StyledRGL>
        </Grid>
      </Grid>
    </Router>
  );
};

export default Main;
