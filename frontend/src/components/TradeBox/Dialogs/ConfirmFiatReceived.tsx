import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Typography,
  Box,
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
        {t('✅ Confirm you received {{amount}} {{currencyCode}}?', { currencyCode, amount })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component='div'>
          <Typography variant='body1' gutterBottom>
            {t('Confirming will finalize the trade.', { currencyCode, amount })}
          </Typography>

          <Typography variant='body2' color='warning.main' sx={{ mt: 2, fontWeight: 'bold' }}>
            {t('⚠️ This action cannot be undone!')}
          </Typography>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t('The satoshis in the escrow will be released to the buyer:')}
          </Typography>
          <Box component='ul' sx={{ mt: 1, pl: 2 }}>
            <Typography component='li' variant='body2'>
              {t('Only confirm after {{amount}} {{currencyCode}} have arrived to your account.', {
                currencyCode,
                amount,
              })}
            </Typography>
            <Typography component='li' variant='body2'>
              {t(
                'If you have received the payment and do not click confirm, you risk losing your bond.',
              )}
            </Typography>
            <Typography component='li' variant='body2'>
              {t(
                'Some fiat payment methods might reverse their transactions up to 2 weeks after they are completed. Please keep this token and your order data in case you need to use them as proof.',
              )}
            </Typography>
          </Box>
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
