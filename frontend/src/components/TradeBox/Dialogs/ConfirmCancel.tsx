import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';

interface ConfirmCancelDialogProps {
  open: boolean;
  onClose: () => void;
  onCancelClick: () => void;
}

export const ConfirmCancelDialog = ({
  open,
  onClose,
  onCancelClick,
}: ConfirmCancelDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Cancel the order?')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('If the order is cancelled now you will lose your bond.')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <Button onClick={onCancelClick}>{t('Confirm Cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmCancelDialog;
