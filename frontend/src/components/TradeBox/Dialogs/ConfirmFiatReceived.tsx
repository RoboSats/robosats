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
import { type Order } from '../../../models';
import currencies from '../../../../static/assets/currencies.json';
import { pn } from '../../../utils';
import { LoadingButton } from '@mui/lab';

interface ConfirmFiatReceivedDialogProps {
  open: boolean;
  loadingButton: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirmClick: () => void;
}

export const ConfirmFiatReceivedDialog = ({
  open,
  loadingButton,
  onClose,
  order,
  onConfirmClick,
}: ConfirmFiatReceivedDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const currencyCode = currencies[order?.currency.toString()];
  const amount = pn(
    parseFloat(parseFloat(order?.amount).toFixed(order?.currency === 1000 ? 8 : 4)),
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {t('Confirm you received {{amount}} {{currencyCode}}?', { currencyCode, amount })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          {t(
            'Confirming that you received {{amount}} {{currencyCode}} will finalize the trade. The satoshis in the escrow will be released to the buyer. Only confirm after {{amount}} {{currencyCode}} have arrived to your account. Note that if you have received the payment and do not click confirm, you risk losing your bond.',
            { currencyCode, amount },
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <LoadingButton loading={loadingButton} onClick={onConfirmClick}>
          {t('Confirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmFiatReceivedDialog;
