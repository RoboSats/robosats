import React, { useEffect, useState } from 'react';
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

interface ConfirmUndoFiatSentDialogProps {
  open: boolean;
  loadingButton: boolean;
  onClose: () => void;
  onConfirmClick: () => void;
}

export const ConfirmUndoFiatSentDialog = ({
  open,
  loadingButton,
  onClose,
  onConfirmClick,
}: ConfirmUndoFiatSentDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [time, setTime] = useState<number>(60);

  useEffect(() => {
    if (time > 0 && open) {
      setTimeout(() => {
        setTime(time - 1);
      }, 1000);
    }
  }, [time, open]);

  const onClick = (): void => {
    onConfirmClick();
    setTime(300);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Revert the confirmation of fiat sent?')}</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          {t(
            'READ. In case your payment to the seller has been blocked and it is absolutely impossible to finish the trade, you can revert your confirmation of "Fiat sent". Do so only if you and the seller have ALREADY AGREED in the chat to proceed to a collaborative cancellation. After confirming, the "Collaborative cancel" button will be visible again. Only click this button if you know what you are doing. First time users of RoboSats are highly discouraged from performing this action! Make 100% sure your payment has failed and the amount is in your account.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <LoadingButton disabled={time > 0} loading={loadingButton} onClick={onClick}>
          {time > 0 ? t('Wait ({{time}})', { time }) : t('Confirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmUndoFiatSentDialog;
