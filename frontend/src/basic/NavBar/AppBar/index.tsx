import React, { useContext, useState } from 'react';
import {
  AppBar as Bar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  Fab,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Add,
  Assignment,
  BubbleChart,
  Info,
  Menu as MenuIcon,
  People,
  PriceChange,
  School,
  SettingsApplications,
  SmartToy,
  Storefront,
} from '@mui/icons-material';
import { UseGarageStoreType, GarageContext } from '../../../contexts/GarageContext';
import { Page } from '..';
import RobotAvatar from '../../../components/RobotAvatar';
import { AppContext, closeAll, UseAppStoreType } from '../../../contexts/AppContext';
import { RoboSatsTextIcon } from '../../../components/Icons';

interface AppBarProps {
  changePage: (newPage: Page) => void;
}

const AppBar = ({ changePage }: AppBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { open, setOpen, page } = useContext<UseAppStoreType>(AppContext);
  const [show, setShow] = useState<boolean>(false);

  const slot = garage.getSlot();

  const onSectionClick = (newPage: Page) => {
    setShow(false);
    changePage(newPage);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Bar position='fixed' sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <Button
            size='large'
            color='inherit'
            sx={{ mr: 2 }}
            aria-label='open drawer'
            onClick={() => setShow(true)}
          >
            <MenuIcon />
          </Button>
          <Button
            size='large'
            color={page == 'settings' ? 'primary' : 'inherit'}
            aria-label='open drawer'
            onClick={() => onSectionClick('settings')}
          >
            <SettingsApplications />
          </Button>
          <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }} />
          <Fab
            color='secondary'
            aria-label='add'
            onClick={() => {
              if (slot?.activeOrder) onSectionClick('order');
              else onSectionClick('create');
            }}
            style={{
              position: 'absolute',
              zIndex: 1,
              left: 0,
              right: 0,
              margin: '0 auto',
            }}
          >
            {slot?.activeOrder ? <Assignment /> : <Add />}
          </Fab>
          <Button
            size='large'
            color={page == 'offers' ? 'primary' : 'inherit'}
            aria-label='open drawer'
            onClick={() => onSectionClick('offers')}
          >
            <Storefront />
          </Button>
          <Button
            size='large'
            color={page == 'garage' ? 'primary' : 'inherit'}
            aria-label='open drawer'
            sx={{ ml: 2 }}
            onClick={() => onSectionClick('garage')}
          >
            <SmartToy />
          </Button>
        </Toolbar>
      </Bar>
      <Drawer anchor='left' open={show} onClose={() => setShow(false)}>
        <Box sx={{ width: 250, height: '100%' }} role='presentation'>
          <List sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {slot?.hashId ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setOpen({ ...closeAll, profile: !open.profile });
                    }}
                  >
                    <RobotAvatar style={{ width: '2em', height: '2em' }} hashId={slot?.hashId} />
                    <Typography align='center' sx={{ ml: 1 }}>
                      <b>{slot?.nickname}</b>
                    </Typography>
                  </ListItemButton>
                </ListItem>
                <Divider sx={{ mt: 1 }} />
              </>
            ) : (
              <></>
            )}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setOpen({ ...closeAll, info: !open.info });
                }}
              >
                <ListItemIcon>
                  <Info />
                </ListItemIcon>
                <ListItemText primary={t('RoboSats')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setOpen({ ...closeAll, learn: !open.learn });
                }}
              >
                <ListItemIcon>
                  <School />
                </ListItemIcon>
                <ListItemText primary={t('Learn RoboSats')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setOpen({ ...closeAll, community: !open.community });
                }}
              >
                <ListItemIcon>
                  <People />
                </ListItemIcon>
                <ListItemText primary={t('Community')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setOpen({ ...closeAll, exchange: !open.exchange });
                }}
              >
                <ListItemIcon>
                  <PriceChange />
                </ListItemIcon>
                <ListItemText primary={t('Exchange summary')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setOpen({ ...closeAll, client: !open.client });
                }}
              >
                <ListItemIcon>
                  <BubbleChart />
                </ListItemIcon>
                <ListItemText primary={t('Client info')} />
              </ListItemButton>
            </ListItem>
            <div style={{ flexGrow: 1 }} />
            <ListItem disablePadding sx={{ display: 'flex', flexDirection: 'column' }}>
              <svg width={0} height={0}>
                <linearGradient id='linearColors' x1={1} y1={0} x2={1} y2={1}>
                  <stop offset={0} stopColor={theme.palette.primary.main} />
                  <stop offset={1} stopColor={theme.palette.secondary.main} />
                </linearGradient>
              </svg>
              <RoboSatsTextIcon
                sx={{
                  fill: 'url(#linearColors)',
                  height: `3.5em`,
                  width: `10em`,
                }}
              />
              <Typography
                lineHeight={0.82}
                sx={{ position: 'relative', bottom: '0.3em' }}
                color='secondary'
                align='center'
              >
                {t('A Simple and Private LN P2P Exchange')}
              </Typography>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AppBar;
