import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
} from '@mui/material';

interface ClaimRewardDialogProps {
  open: boolean;
  onClose: () => void;
}

const ClaimRewardDialog = ({ open, onClose }: ClaimRewardDialogProps): JSX.Element => {
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState<string>('');

  const handleSubmit = (): void => {
    // Handle the reward claiming process here
    console.log('Invoice submitted:', invoice);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Claim Reward')}</DialogTitle>
      <DialogContent>
        <Grid container direction='column' spacing={2}>
          <Grid item>
            <Typography>
              {t(
                'If you did not receive the payment, please contact your coordinator or the last order if known.',
              )}
            </Typography>
          </Grid>
          <Grid item>
            <TextField
              label={t('Reward Invoice')}
              fullWidth
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button onClick={handleSubmit} color='primary' variant='contained'>
          {t('Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClaimRewardDialog;
