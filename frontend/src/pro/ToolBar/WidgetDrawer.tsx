import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
  alpha,
  Checkbox,
} from '@mui/material';
import {
  Close,
  Dashboard,
  ShowChart,
  MenuBook,
  Settings,
  Groups,
  History,
  SwapHoriz,
  Widgets,
  SmartToy,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface WidgetInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number; minW: number; minH: number; maxW: number; maxH: number };
}

const AVAILABLE_WIDGETS: WidgetInfo[] = [
  {
    id: 'Maker',
    label: 'Order Maker',
    description: 'Create buy/sell orders',
    icon: <Dashboard />,
    defaultSize: { w: 10, h: 16, minW: 8, maxW: 22, minH: 10, maxH: 28 },
  },
  {
    id: 'Book',
    label: 'Order Book',
    description: 'View all open orders',
    icon: <MenuBook />,
    defaultSize: { w: 43, h: 15, minW: 6, maxW: 70, minH: 9, maxH: 25 },
  },
  {
    id: 'DepthChart',
    label: 'Depth Chart',
    description: 'Visualize market depth',
    icon: <ShowChart />,
    defaultSize: { w: 15, h: 10, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  },
  {
    id: 'Settings',
    label: 'Settings',
    description: 'App configuration',
    icon: <Settings />,
    defaultSize: { w: 11, h: 15, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  },
  {
    id: 'Garage',
    label: 'Robot Garage',
    description: 'Manage your robots',
    icon: <SmartToy />,
    defaultSize: { w: 52, h: 16, minW: 15, maxW: 78, minH: 8, maxH: 30 },
  },
  {
    id: 'History',
    label: 'Trade History',
    description: 'Past transactions',
    icon: <History />,
    defaultSize: { w: 8, h: 10, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  },
  {
    id: 'Trade',
    label: 'Trade Box',
    description: 'Active trade details',
    icon: <SwapHoriz />,
    defaultSize: { w: 15, h: 16, minW: 6, maxW: 22, minH: 9, maxH: 25 },
  },
  {
    id: 'Federation',
    label: 'Federation',
    description: 'Coordinator network',
    icon: <Groups />,
    defaultSize: { w: 23, h: 10, minW: 12, maxW: 50, minH: 8, maxH: 25 },
  },
];

interface WidgetDrawerProps {
  open: boolean;
  onClose: () => void;
  currentWidgets: string[];
  onAddWidget: (widget: WidgetInfo) => void;
  onRemoveWidget: (widgetId: string) => void;
}

const WidgetDrawer: React.FC<WidgetDrawerProps> = ({
  open,
  onClose,
  currentWidgets,
  onAddWidget,
  onRemoveWidget,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const isWidgetActive = (widgetId: string): boolean => {
    return currentWidgets.includes(widgetId);
  };

  const allWidgetsActive = AVAILABLE_WIDGETS.every((widget) => isWidgetActive(widget.id));

  const handleToggleAll = () => {
    if (allWidgetsActive) {
      AVAILABLE_WIDGETS.forEach((widget) => {
        if (isWidgetActive(widget.id)) {
          onRemoveWidget(widget.id);
        }
      });
    } else {
      AVAILABLE_WIDGETS.forEach((widget) => {
        if (!isWidgetActive(widget.id)) {
          onAddWidget(widget);
        }
      });
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Widgets sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Typography variant='h6' fontWeight={600}>
            {t('Widgets')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant='body2' color='text.secondary'>
          {t('Click to add or remove widgets from your workspace')}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1.5 }}>
        <Paper
          onClick={handleToggleAll}
          sx={{
            p: 1,
            px: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            background: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.08),
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Checkbox checked={allWidgetsActive} size='small' sx={{ p: 0.5 }} />
          <Typography variant='body2' fontWeight={500}>
            {t('Select All')}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {AVAILABLE_WIDGETS.map((widget) => {
            const isActive = isWidgetActive(widget.id);
            return (
              <Box key={widget.id}>
                <Paper
                  elevation={isActive ? 0 : 2}
                  onClick={() => {
                    if (isActive) {
                      onRemoveWidget(widget.id);
                    } else {
                      onAddWidget(widget);
                    }
                  }}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease-in-out',
                    border: isActive
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: isActive
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.background.paper, 0.6),
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: theme.palette.primary.main,
                      background: isActive
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.background.paper, 0.9),
                    },
                    '&:active': {
                      transform: 'translateX(2px) scale(0.98)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, 0.1),
                      color: isActive
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {widget.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant='subtitle2'
                      fontWeight={600}
                      sx={{ color: isActive ? theme.palette.primary.main : 'text.primary' }}
                    >
                      {t(widget.label)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {t(widget.description)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isActive
                        ? theme.palette.success.main
                        : alpha(theme.palette.text.disabled, 0.3),
                      boxShadow: isActive ? `0 0 8px ${theme.palette.success.main}` : 'none',
                    }}
                  />
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.default, 0.5),
        }}
      >
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', textAlign: 'center' }}
        >
          {currentWidgets.length} {t('widgets active')}
        </Typography>
      </Box>
    </Drawer>
  );
};

export { AVAILABLE_WIDGETS, type WidgetInfo };
export default React.memo(WidgetDrawer);
