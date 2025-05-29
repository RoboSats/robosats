import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  TextField,
} from '@mui/material';
import RedeemIcon from '@mui/icons-material/Redeem';

interface Props {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string; // Pass the translation function
}

const ClaimRewardDialog = ({ open, onClose, t }: Props): JSX.Element => {
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [showFailedClaimInfo, setShowFailedClaimInfo] = useState<boolean>(false);
  const [claimLoading, setClaimLoading] = useState<boolean>(false);

  const handleClaimSubmit = () => {
    setClaimLoading(true);
    setShowFailedClaimInfo(false); // Reset alert
    // Simulate an API call for claiming rewards
    setTimeout(() => {
      setClaimLoading(false);
      // In a real scenario, this would depend on the API response
      const success = Math.random() > 0.5; // Simulate success/failure
      if (!success) {
        setShowFailedClaimInfo(true);
      } else {
        // Handle successful claim (e.g., show a success message, close dialog)
        alert(t('Reward claimed successfully!'));
        onClose();
      }
    }, 1500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="claim-reward-title"
      sx={{ '& .MuiDialog-paper': { minWidth: '300px', maxWidth: '400px', borderRadius: '8px' } }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: '#333', paddingBottom: '10px' }}>
        {t('Claim Your Rewards')}
      </DialogTitle>
      <DialogContent sx={{ padding: '0 20px 20px 20px' }}>
        <Typography variant="body1" sx={{ marginBottom: '16px' }}>
          {t('You have 0 Sats in compensations.')} {/* Placeholder for actual sats */}
        </Typography>

        {/* This would be a more complex form for invoice submission */}
        <TextField
          label={t('Invoice amount (Sats)')}
          type="number"
          fullWidth
          value={invoiceAmount}
          onChange={(e) => setInvoiceAmount(e.target.value)}
          sx={{ marginBottom: '16px' }}
        />

        {showFailedClaimInfo && (
          <Alert
            severity="info"
            sx={{
              marginBottom: '16px',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd',
              color: '#0d47a1',
            }}
          >
            {t(
              'To claim your rewards, please contact the coordinator of your last order. If the payment fails, you must contact the coordinator - do not generate a new invoice.',
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: '10px 20px 20px 20px' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleClaimSubmit}
          variant="contained"
          startIcon={<RedeemIcon />}
          disabled={claimLoading || !invoiceAmount}
          sx={{ textTransform: 'none', backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          {claimLoading ? t('Claiming...') : t('Claim')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClaimRewardDialog;
