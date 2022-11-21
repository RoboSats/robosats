import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Tabs, Tab, Paper, useTheme } from '@mui/material';
import MoreTooltip from './MoreTooltip';

import { OpenDialogs } from '../MainDialogs';

import { Page } from '.';

import {
  SettingsApplications,
  SmartToy,
  Storefront,
  AddBox,
  Assignment,
  MoreHoriz,
} from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';

type Direction = 'left' | 'right' | undefined;

interface NavBarProps {
  page: Page;
  nickname?: string | null;
  setPage: (state: Page) => void;
  setSlideDirection: (state: { in: Direction; out: Direction }) => void;
  width: number;
  height: number;
  open: OpenDialogs;
  setOpen: (state: OpenDialogs) => void;
  closeAll: OpenDialogs;
  currentOrder: number | undefined;
  hasRobot: boolean;
  baseUrl: string;
  color: 'primary' | 'secondary';
}

const NavBar = ({
  page,
  setPage,
  setSlideDirection,
  open,
  nickname = null,
  setOpen,
  closeAll,
  width,
  height,
  currentOrder,
  hasRobot = false,
  baseUrl,
  color,
}: NavBarProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();
  const history = useHistory();
  const smallBar = width < 50;

  const tabSx = smallBar
    ? { position: 'relative', bottom: nickname ? '1em' : '0em', minWidth: '1em' }
    : { position: 'relative', bottom: '1em', minWidth: '2em' };
  const pagesPosition = {
    robot: 1,
    offers: 2,
    create: 3,
    order: 4,
    settings: 5,
  };

  const handleSlideDirection = function (oldPage: Page, newPage: Page) {
    const oldPos: number = pagesPosition[oldPage];
    const newPos: number = pagesPosition[newPage];
    setSlideDirection(
      newPos > oldPos ? { in: 'left', out: 'right' } : { in: 'right', out: 'left' },
    );
  };

  const changePage = function (mouseEvent: any, newPage: Page) {
    if (newPage === 'none') {
      return null;
    } else {
      handleSlideDirection(page, newPage);
      setPage(newPage);
      const param = newPage === 'order' ? currentOrder ?? '' : '';
      setTimeout(
        () => history.push(`/${newPage}/${param}`),
        theme.transitions.duration.leavingScreen * 3,
      );
    }
  };

  useEffect(() => {
    setOpen(closeAll);
  }, [page]);

  return (
    <Paper
      elevation={6}
      sx={{ height: `${height}em`, width: `100%`, position: 'fixed', bottom: 0, borderRadius: 0 }}
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
          disabled={nickname === null}
          onClick={() => setOpen({ ...closeAll, profile: !open.profile })}
          icon={
            nickname ? (
              <RobotAvatar
                style={{ width: '2.3em', height: '2.3em', position: 'relative', top: '0.2em' }}
                avatarClass={theme.palette.mode === 'dark' ? 'navBarAvatarDark' : 'navBarAvatar'}
                nickname={nickname}
                baseUrl={baseUrl}
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
          disabled={!hasRobot || currentOrder == undefined}
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
          onClick={(e) => {
            open.more ? null : setOpen({ ...open, more: true });
          }}
          icon={
            <MoreTooltip open={open} nickname={nickname} setOpen={setOpen} closeAll={closeAll}>
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
