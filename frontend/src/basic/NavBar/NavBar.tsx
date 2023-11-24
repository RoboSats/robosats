import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Paper, useTheme } from '@mui/material';
import MoreTooltip from './MoreTooltip';

import { type Page, isPage } from '.';

import {
  SettingsApplications,
  SmartToy,
  Storefront,
  AddBox,
  Assignment,
  MoreHoriz,
} from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import { AppContext, type UseAppStoreType, closeAll } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const NavBar = (): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    page,
    setPage,
    settings,
    setSlideDirection,
    open,
    setOpen,
    windowSize,
    navbarHeight,
    hostUrl,
  } = useContext<UseAppStoreType>(AppContext);
  const { garage, orderUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);

  const navigate = useNavigate();
  const location = useLocation();
  const smallBar = windowSize?.width < 50;
  const color = settings.network === 'mainnet' ? 'primary' : 'secondary';

  const tabSx = smallBar
    ? {
        position: 'relative',
        bottom: garage.getSlot()?.avatarLoaded ? '0.9em' : '0.13em',
        minWidth: '1em',
      }
    : { position: 'relative', bottom: '1em', minWidth: '2em' };

  const pagesPosition = {
    robot: 1,
    offers: 2,
    create: 3,
    order: 4,
    settings: 5,
  };

  useEffect(() => {
    // change tab (page) into the current route
    const pathPage: Page | string = location.pathname.split('/')[1];
    if (pathPage === 'index.html') {
      navigate('/robot');
      setPage('robot');
    }
    if (isPage(pathPage)) {
      setPage(pathPage);
    }
  }, [location, navigate, setPage, orderUpdatedAt]);

  const handleSlideDirection = function (oldPage: Page, newPage: Page): void {
    const oldPos: number = pagesPosition[oldPage];
    const newPos: number = pagesPosition[newPage];
    setSlideDirection(
      newPos > oldPos ? { in: 'left', out: 'right' } : { in: 'right', out: 'left' },
    );
  };

  const changePage = function (mouseEvent: any, newPage: Page): void {
    if (newPage !== 'none') {
      const slot = garage.getSlot();
      handleSlideDirection(page, newPage);
      setPage(newPage);
      const param =
        newPage === 'order'
          ? `${String(slot?.activeShortAlias)}/${String(
              slot?.getRobot(slot?.activeShortAlias ?? '')?.activeOrderId ??
                slot?.getRobot(slot?.lastShortAlias ?? '')?.lastOrderId,
            )}`
          : '';
      setTimeout(() => {
        navigate(`/${newPage}/${param}`);
      }, theme.transitions.duration.leavingScreen * 3);
    }
  };

  useEffect(() => {
    setOpen(closeAll);
  }, [page, setOpen]);

  const slot = garage.getSlot();

  return (
    <Paper
      elevation={6}
      sx={{
        height: `${navbarHeight}em`,
        width: `100%`,
        position: 'fixed',
        bottom: 0,
        borderRadius: 0,
      }}
    >
      <Tabs
        TabIndicatorProps={{ sx: { height: '0.3em', position: 'absolute', top: 0 } }}
        variant='fullWidth'
        value={page}
        indicatorColor={color}
        textColor={color}
        onChange={changePage}
      >
        <Tab
          sx={{ ...tabSx, minWidth: '2.5em', width: '2.5em', maxWidth: '4em' }}
          value='none'
          disabled={slot?.getRobot()?.nickname === null}
          onClick={() => {
            setOpen({ ...closeAll, profile: !open.profile });
          }}
          icon={
            slot?.getRobot()?.nickname != null && slot?.avatarLoaded ? (
              <RobotAvatar
                style={{ width: '2.3em', height: '2.3em', position: 'relative', top: '0.2em' }}
                avatarClass={theme.palette.mode === 'dark' ? 'navBarAvatarDark' : 'navBarAvatar'}
                nickname={slot?.getRobot()?.nickname}
                baseUrl={hostUrl}
              />
            ) : (
              <></>
            )
          }
        />

        <Tab
          label={smallBar ? undefined : t('Robot')}
          sx={{ ...tabSx, minWidth: '1em' }}
          value='robot'
          icon={<SmartToy />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Offers')}
          value='offers'
          icon={<Storefront />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Create')}
          value='create'
          icon={<AddBox />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Order')}
          value='order'
          disabled={
            !slot?.avatarLoaded || !slot?.getRobot(slot?.activeShortAlias ?? '')?.activeOrderId
          }
          icon={<Assignment />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('Settings')}
          value='settings'
          icon={<SettingsApplications />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={smallBar ? undefined : t('More')}
          value='none'
          onClick={() => {
            setOpen((open) => {
              return { ...open, more: !open.more };
            });
          }}
          icon={
            <MoreTooltip>
              <MoreHoriz />
            </MoreTooltip>
          }
          iconPosition='start'
        />
      </Tabs>
    </Paper>
  );
};

export default NavBar;
