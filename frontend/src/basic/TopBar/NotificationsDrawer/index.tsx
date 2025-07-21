import React, { useContext, useEffect } from 'react';
import { Box, Drawer, List, ListItem, Typography, useTheme } from '@mui/material';
import { AppContext, type UseAppStoreType } from '../../../contexts/AppContext';
import { RoboSatsTextIcon } from '../../../components/Icons';
import { useTranslation } from 'react-i18next';

interface NotificationsDrawerProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

const NotificationsDrawer = ({ show, setShow }: NotificationsDrawerProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { page } = useContext<UseAppStoreType>(AppContext);
  useEffect(() => {
    setShow(false);
  }, [page]);

  return (
    <Drawer anchor='right' open={show} onClose={() => setShow(false)}>
      <Box sx={{ width: 270, height: '100%' }} role='presentation'>
        <List sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
  );
};

export default NotificationsDrawer;
