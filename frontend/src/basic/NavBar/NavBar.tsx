import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { AppContext, type UseAppStoreType, closeAll } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { type Page, isPage } from '.';

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  padding: theme.spacing(0.5, 0),
  borderRadius: 'inherit',
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(0.5, 0),
  '& .MuiBottomNavigationAction-label': {
    fontSize: '0.75rem',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
  },
}));

const NavBar = (): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { page, setPage, setSlideDirection, open, setOpen } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { setCurrentOrderId } = useContext<UseFederationStoreType>(FederationContext);

  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(page);

  const pagesPosition = {
    robot: 1,
    offers: 2,
    create: 3,
    order: 4,
    settings: 5,
  };

  useEffect(() => {
    const pathPage: Page | string = location.pathname.split('/')[1];
    if (pathPage === 'index.html') {
      navigate('/robot');
      setPage('robot');
    }
    if (isPage(pathPage)) {
      setPage(pathPage);
    }
    setValue(pathPage as Page);
  }, [location, navigate, setPage]);

  const handleSlideDirection = (oldPage: Page, newPage: Page): void => {
    const oldPos: number = pagesPosition[oldPage];
    const newPos: number = pagesPosition[newPage];
    setSlideDirection(
      newPos > oldPos ? { in: 'left', out: 'right' } : { in: 'right', out: 'left' },
    );
  };

  const changePage = (event: React.SyntheticEvent, newPage: Page): void => {
    if (newPage !== 'none') {
      const slot = garage.getSlot();
      handleSlideDirection(page, newPage);
      setPage(newPage);
      const shortAlias = String(slot?.activeShortAlias);
      const activeOrderId = slot?.getRobot(slot?.activeShortAlias ?? '')?.activeOrderId;
      const lastOrderId = slot?.getRobot(slot?.lastShortAlias ?? '')?.lastOrderId;
      const param =
        newPage === 'order' ? `${shortAlias}/${String(activeOrderId ?? lastOrderId)}` : '';
      if (newPage === 'order') {
        setCurrentOrderId({ id: activeOrderId ?? lastOrderId, shortAlias });
      }
      setTimeout(() => {
        navigate(`/${newPage}/${param}`);
      }, theme.transitions.duration.leavingScreen * 3);
    }
  };

  useEffect(() => {
    setOpen(closeAll);
  }, [page, setOpen]);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        ...(isMobile
          ? {
              boxShadow: 'none',
              backgroundColor: theme.palette.background.paper,
              borderTop: `2px solid black`,
              borderRadius: '0',
            }
          : {
              bottom: theme.spacing(2),
              left: '50%',
              transform: 'translateX(-50%)',
              width: '95%',
              maxWidth: 600,
              borderRadius: '8px',
              boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
              border: `2px solid black`,
              backgroundColor: theme.palette.background.paper,
              overflow: 'hidden',
            }),
      }}
      elevation={isMobile ? 0 : 3}
    >
      <StyledBottomNavigation value={value} onChange={changePage} showLabels>
        <StyledBottomNavigationAction
          label={t('Robot')}
          value='robot'
          icon={<SmartToyOutlinedIcon />}
        />
        <StyledBottomNavigationAction
          label={t('Offers')}
          value='offers'
          icon={<StorefrontOutlinedIcon />}
        />
        <StyledBottomNavigationAction
          label={t('Create')}
          value='create'
          icon={<AddBoxOutlinedIcon />}
        />
        <StyledBottomNavigationAction
          label={t('Orders')}
          value='order'
          icon={<AssignmentOutlinedIcon />}
          disabled={!garage.getSlot()?.getRobot()?.activeOrderId}
        />
        <StyledBottomNavigationAction
          label={t('Settings')}
          value='settings'
          icon={<SettingsOutlinedIcon />}
        />
      </StyledBottomNavigation>
    </Paper>
  );
};

export default NavBar;
