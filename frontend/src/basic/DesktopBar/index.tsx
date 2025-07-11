import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Tab, Paper } from '@mui/material';
import MoreTooltip from '../NavBar/DesktopBar/MoreTooltip';

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
import { Page } from '../NavBar';

interface DesktopBarProps {
  changePage: (newPage: Page) => void;
}

const DesktopBar = ({ changePage }: DesktopBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { page, settings, open, setOpen, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const color = settings.network === 'mainnet' ? 'primary' : 'secondary';

  const tabSx = { position: 'relative', bottom: '1em', minWidth: '2em' };

  const slot = garage.getSlot();

  const onChange = function (_mouseEvent: React.MouseEvent, newPage: Page): void {
    changePage(newPage);
  };

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
        onChange={onChange}
      >
        <Tab
          sx={{ ...tabSx, minWidth: '2.5em', width: '2.5em', maxWidth: '4em' }}
          value='none'
          disabled={!slot?.nickname}
          onClick={() => {
            setOpen({ ...closeAll, profile: !open.profile });
          }}
          icon={
            slot?.hashId ? (
              <RobotAvatar
                style={{ width: '2.3em', height: '2.3em', position: 'relative', top: '0.2em' }}
                hashId={slot?.hashId}
              />
            ) : (
              <></>
            )
          }
        />

        <Tab
          label={t('Garage')}
          sx={{ ...tabSx, minWidth: '1em' }}
          value='garage'
          icon={<SmartToy />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={t('Offers')}
          value='offers'
          icon={<Storefront />}
          iconPosition='start'
        />
        <Tab sx={tabSx} label={t('Create')} value='create' icon={<AddBox />} iconPosition='start' />
        <Tab
          sx={tabSx}
          label={t('Order')}
          value='order'
          disabled={!slot?.activeOrder}
          icon={<Assignment />}
          iconPosition='start'
        />
        <Tab
          sx={tabSx}
          label={t('Settings')}
          value='settings'
          icon={<SettingsApplications />}
          iconPosition='start'
        />

        <Tab
          sx={tabSx}
          label={t('More')}
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

export default DesktopBar;
