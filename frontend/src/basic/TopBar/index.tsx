import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { AppContext, closeAll, Page, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import {
  Add,
  BubbleChart,
  ExpandLess,
  ExpandMore,
  Info,
  Menu as MenuIcon,
  People,
  PriceChange,
  School,
  SettingsApplications,
} from '@mui/icons-material';
import { TorIcon, RoboSatsTextIcon } from '../../components/Icons';
import RobotAvatar from '../../components/RobotAvatar';
import { useTranslation } from 'react-i18next';
import { UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { genBase62Token } from '../../utils';
import { useNavigate } from 'react-router-dom';

const TopBar = (): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { open, setOpen, client, torStatus, page, navigateToPage } =
    useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [show, setShow] = useState<boolean>(false);
  const [openGarage, setOpenGarage] = useState<boolean>(false);

  const [torColor, setTorColor] = useState<
    'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit'
  >('error');
  const [torProgress, setTorProgress] = useState<boolean>(true);
  const [torTitle, setTorTitle] = useState<string>(t('Connection error'));

  const slot = garage.getSlot();

  useEffect(() => {
    if (!show) setOpenGarage(false);
  }, [show]);

  useEffect(() => {
    setShow(false);
  }, [page]);

  useEffect(() => {
    if (torStatus === 'OFF' || torStatus === 'STOPPING') {
      setTorColor('primary');
      setTorProgress(true);
      setTorTitle(t('Initializing Tor daemon'));
    } else if (torStatus === 'STARTING') {
      setTorColor('warning');
      setTorProgress(true);
      setTorTitle(t('Connecting to Tor network'));
    } else if (torStatus === 'ON') {
      setTorColor('success');
      setTorProgress(false);
      setTorTitle(t('Connected to Tor network'));
    }
  }, [torStatus]);

  const handleAddRobot = (): void => {
    const token = genBase62Token(36);
    void garage.createRobot(federation, token, Object.keys(garage.slots).length > 0);
  };

  const changePage = (newPage: Page) => {
    navigateToPage(newPage, navigate);
    setShow(false);
  };

  return (
    <Grid container direction='row' alignItems='space-arround' spacing={1}>
      <Button
        size='large'
        color='inherit'
        aria-label='open drawer'
        onClick={() => setShow((s) => !s)}
      >
        <MenuIcon />
      </Button>
      <Drawer anchor='left' open={show} onClose={() => setShow(false)}>
        <Box sx={{ width: 270, height: '100%' }} role='presentation'>
          <List sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {slot?.hashId ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{ pr: 0 }}
                    onClick={() => {
                      setOpen({ ...closeAll, profile: !open.profile });
                    }}
                  >
                    <ListItemIcon>
                      <RobotAvatar
                        style={{ width: '1.5em', height: '1.5em' }}
                        hashId={slot?.hashId}
                      />
                    </ListItemIcon>
                  </ListItemButton>
                  <ListItemButton
                    onClick={() => setOpenGarage((op) => !op)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pl: 0,
                    }}
                  >
                    <Typography align='center' sx={{ ml: 1 }}>
                      <b>{slot?.nickname}</b>
                    </Typography>
                    {openGarage ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={openGarage} timeout='auto' unmountOnExit>
                  <List component='div' disablePadding>
                    {Object.values(garage.slots).map((garageSlot, index) => {
                      if (garageSlot.token === slot.token) return <div key={index}></div>;

                      return (
                        <ListItem disablePadding key={index}>
                          <ListItemButton
                            sx={{ pr: 0 }}
                            onClick={() => {
                              garage.setCurrentSlot(garageSlot.token ?? '');
                              setOpenGarage(false);
                              setTimeout(() => setShow(false), 300);
                            }}
                          >
                            <ListItemIcon>
                              <RobotAvatar
                                style={{ width: '1.5em', height: '1.5em' }}
                                hashId={garageSlot.hashId ?? ''}
                              />
                            </ListItemIcon>
                            <Typography align='center' sx={{ ml: 1 }}>
                              <b>{garageSlot?.nickname}</b>
                            </Typography>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                    <ListItemButton sx={{ pr: 0 }} onClick={handleAddRobot} key='add_robot'>
                      <ListItemIcon>
                        <Add /> <div style={{ width: '0.5em' }} />
                        {t('Add Robot')}
                      </ListItemIcon>
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding sx={{ height: '30px', mt: '8px', mb: '8px' }}>
                <ListItemButton sx={{ pr: 0 }} onClick={handleAddRobot}>
                  <ListItemIcon>
                    <Add /> <div style={{ width: '0.5em' }} />
                    {t('Add Robot')}
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            )}
            <Divider sx={{ mt: 1 }} />
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
            <ListItem disablePadding>
              <ListItemButton onClick={() => changePage('settings')}>
                <ListItemIcon>
                  <SettingsApplications />
                </ListItemIcon>
                <ListItemText primary={t('Settings')} />
              </ListItemButton>
            </ListItem>
            <div style={{ flexGrow: 1 }} />
            {client === 'mobile' && (
              <ListItem disablePadding sx={{ display: 'flex', flexDirection: 'column' }}>
                <ListItemButton selected>
                  <ListItemIcon>
                    {torProgress ? (
                      <>
                        <CircularProgress color={torColor} thickness={6} size={22} />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TorIcon color={torColor} sx={{ width: 20, height: 20 }} />
                        </Box>
                      </>
                    ) : (
                      <Box>
                        <TorIcon color={torColor} sx={{ width: 20, height: 20 }} />
                      </Box>
                    )}
                  </ListItemIcon>
                  <ListItemText primary={torTitle} />
                </ListItemButton>
              </ListItem>
            )}
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
    </Grid>
  );
};

export default TopBar;
