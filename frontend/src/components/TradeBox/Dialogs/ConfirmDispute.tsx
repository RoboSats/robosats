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

interface ConfirmDisputeDialogProps {
  open: boolean;
  onClose: () => void;
  onAgreeClick: () => void;
}

export const ConfirmDisputeDialog = ({
  open,
  onClose,
  onAgreeClick,
}: ConfirmDisputeDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Do you want to open a dispute?')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            'The RoboSats staff will examine the statements and evidence provided. You need to build a complete case, as the staff cannot read the chat. It is best to provide a burner contact method with your statement. The satoshis in the trade escrow will be sent to the dispute winner, while the dispute loser will lose the bond.',
          )}
        </DialogContentText>
        <br />
        <DialogContentText>
          {t(
            'Make sure to EXPORT the chat log. The staff might request your exported chat log JSON in order to solve discrepancies. It is your responsibility to store it.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Disagree')}
        </Button>
        <Button onClick={onAgreeClick}>{t('Agree and open dispute')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDisputeDialog;
