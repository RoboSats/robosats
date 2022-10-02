import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  tgBotName: string;
  tgToken: string;
  onClickEnable: () => void;
}

const EnableTelegramDialog = ({
  open,
  onClose,
  tgBotName,
  tgToken,
  onClickEnable,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='enable-telegram-dialog-title'
      aria-describedby='enable-telegram-dialog-description'
    >
      <DialogTitle id='open-dispute-dialog-title'>{t('Enable TG Notifications')}</DialogTitle>
      <DialogContent>
        <div style={{ textAlign: 'center' }}>
          <QRCode
            bgColor={'rgba(255, 255, 255, 0)'}
            fgColor={theme.palette.text.primary}
            value={'tg://resolve?domain=' + tgBotName + '&start=' + tgToken}
            size={275}
          />
        </div>
        <DialogContentText id='alert-dialog-description'>
          {t(
            'You will be taken to a conversation with RoboSats telegram bot. Simply open the chat and press Start. Note that by enabling telegram notifications you might lower your level of anonymity.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}> {t('Go back')} </Button>
        <Button onClick={onClickEnable} autoFocus>
          {' '}
          {t('Enable')}{' '}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnableTelegramDialog;
