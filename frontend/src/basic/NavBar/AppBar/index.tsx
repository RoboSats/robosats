import React, { useContext } from 'react';
import { AppBar as Bar, Toolbar, Box, useTheme, Fab, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Add, Assignment, SmartToy, Storefront } from '@mui/icons-material';
import { UseGarageStoreType, GarageContext } from '../../../contexts/GarageContext';
import { AppContext, Page, UseAppStoreType } from '../../../contexts/AppContext';

interface AppBarProps {
  changePage: (newPage: Page) => void;
}

const AppBar = ({ changePage }: AppBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { page } = useContext<UseAppStoreType>(AppContext);

  const slot = garage.getSlot();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Bar
        position='fixed'
        sx={{ top: 'auto', bottom: 0 }}
        color={theme.palette.mode === 'dark' ? 'default' : 'white'}
      >
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between', flexGrow: 1 }}>
          <Button
            size='large'
            color={page == 'offers' ? 'primary' : 'inherit'}
            aria-label='open drawer'
            onClick={() => changePage('offers')}
            startIcon={<Storefront />}
          >
            {t('Offers')}
          </Button>
          <div style={{ width: '64px' }} />
          <Fab
            color='secondary'
            aria-label='add'
            onClick={() => {
              if (slot?.activeOrder) changePage('order');
              else changePage('create');
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
            color={page == 'garage' ? 'primary' : 'inherit'}
            aria-label='open drawer'
            sx={{ ml: 2 }}
            onClick={() => changePage('garage')}
            endIcon={<SmartToy />}
          >
            {t('Garage')}
          </Button>
        </Toolbar>
      </Bar>
    </Box>
  );
};

export default AppBar;
