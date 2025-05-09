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
import { LoadingButton } from '@mui/lab';

interface ConfirmCollabCancelDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCollabCancelClick: () => void;
  peerAskedCancel: boolean;
}

export const ConfirmCollabCancelDialog = ({
  open,
  loading,
  onClose,
  onCollabCancelClick,
  peerAskedCancel,
}: ConfirmCollabCancelDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle id='cancel-dialog-title'>{t('Collaborative cancel the order?')}</DialogTitle>
      <DialogContent>
        <DialogContentText id='cancel-dialog-description'>
          {t(
            'The trade escrow has been posted. The order can be cancelled only if both, maker and taker, agree to cancel.',
          )}
          {peerAskedCancel ? ` ${t('Your peer has asked for cancellation')}` : ''}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <LoadingButton loading={loading} onClick={onCollabCancelClick}>
          {peerAskedCancel ? t('Accept Cancelation') : t('Ask for Cancel')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmCollabCancelDialog;
