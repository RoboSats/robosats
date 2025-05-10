import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import QRCode from 'react-qr-code';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Grid,
} from '@mui/material';
import { NewTabIcon } from '../Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
  tgBotName: string;
  tgToken: string;
}

const EnableTelegramDialog = ({ open, onClose, tgBotName, tgToken }: Props): React.JSX.Element => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const theme = useTheme();

  const handleClickOpenBrowser = (): void => {
    window.open(`https://t.me/${tgBotName}?start=${tgToken}`, '_blank').focus();
    setOpenEnableTelegram(false);
  };

  const handleOpenTG = (): void => {
    window.open(`tg://resolve?domain=${tgBotName}&start=${tgToken}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='enable-telegram-dialog-title'
      aria-describedby='enable-telegram-dialog-description'
    >
      <DialogTitle id='open-dispute-dialog-title'>{t('Enable TG Notifications')}</DialogTitle>
      <DialogContent>
        <Grid container justifyContent='center'>
          <Grid item>
            <Box
              sx={{
                width: 290,
                display: 'flex',
                backgroundColor: settings.lightQRs ? '#fff' : theme.palette.background.paper,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5em',
                borderRadius: '0.3em',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
                },
              }}
            >
              <QRCode
                bgColor={'rgba(255, 255, 255, 0)'}
                fgColor={settings.lightQRs ? '#000000' : theme.palette.text.primary}
                value={'tg://resolve?domain=' + tgBotName + '&start=' + tgToken}
                size={275}
                onClick={handleOpenTG}
              />
            </Box>
          </Grid>
        </Grid>
        <DialogContentText id='alert-dialog-description'>
          {t(
            'You will be taken to a conversation with RoboSats telegram bot. Simply open the chat and press Start. Note that by enabling telegram notifications you might lower your level of anonymity.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}> {t('Go back')} </Button>
        <Button onClick={handleClickOpenBrowser} autoFocus>
          {t('Browser')}
          <NewTabIcon sx={{ width: '0.7em', height: '0.7em' }} />
        </Button>
        <Button onClick={handleOpenTG}>{t('Enable')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnableTelegramDialog;
