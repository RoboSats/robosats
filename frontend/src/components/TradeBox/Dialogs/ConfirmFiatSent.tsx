import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  Typography,
} from '@mui/material';
import { type Order } from '../../../models';
import currencies from '../../../../static/assets/currencies.json';
import { pn } from '../../../utils';
import { LoadingButton } from '@mui/lab';

interface ConfirmFiatSentDialogProps {
  open: boolean;
  loadingButton: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirmClick: () => void;
}

export const ConfirmFiatSentDialog = ({
  open,
  loadingButton,
  onClose,
  order,
  onConfirmClick,
}: ConfirmFiatSentDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const currencyCode = currencies[order?.currency.toString()];
  const amount = pn(
    parseFloat(parseFloat(order?.amount).toFixed(order?.currency === 1000 ? 8 : 4)),
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {t('✅ Confirm you sent {{amount}} {{currencyCode}}?', { currencyCode, amount })}
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' gutterBottom>
          {t('Confirming will allow your peer to finalize the trade.', { currencyCode, amount })}
        </Typography>

        <Typography variant='body2' color='warning.main' sx={{ mt: 2, fontWeight: 'bold' }}>
          {t('⚠️ This action cannot be undone!')}
        </Typography>

        <Typography variant='body2' sx={{ mt: 2 }}>
          {t(
            'If you have not yet sent it and you still proceed to falsely confirm, you risk losing your bond.',
          )}
        </Typography>
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

export default ConfirmFiatSentDialog;
