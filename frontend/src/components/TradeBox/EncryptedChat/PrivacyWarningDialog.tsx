import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: (confirmed: boolean) => void;
}

const PrivacyWarningDialog: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby='privacy-dialog-title'
      aria-describedby='privacy-dialog-description'
    >
      <DialogTitle id='privacy-dialog-title'>{t('Sensitive Data')}</DialogTitle>
      <DialogContent>
        <DialogContentText id='privacy-dialog-description'>
          {t(
            'Images are end-to-end encrypted, but they retain their original metadata (like GPS location). The recipient will be able to see this information. Please remove any sensitive data before uploading.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color='primary'>
          {t('Cancel')}
        </Button>
        <Button onClick={() => onClose(true)} color='primary' autoFocus>
          {t('Acknowledged')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyWarningDialog;
