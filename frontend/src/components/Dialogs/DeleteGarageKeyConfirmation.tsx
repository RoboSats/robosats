import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface DeleteGarageKeyConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteGarageKeyConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
}: DeleteGarageKeyConfirmationDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <Warning color='warning' />
          {t('Delete Garage Key?')}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component='div'>
          <Typography variant='body1' gutterBottom>
            {t('Are you sure you want to permanently delete this Garage Key and ALL associated robots?')}
          </Typography>

          <Typography variant='body2' color='warning.main' sx={{ mt: 2, fontWeight: 'bold' }}>
            {t('⚠️ This action cannot be undone!')}
          </Typography>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t('Before deleting, make sure you have:')}
          </Typography>

          <Box component='ul' sx={{ mt: 1, pl: 2 }}>
            <Typography component='li' variant='body2'>
              {t('Stored your Garage Key safely')}
            </Typography>
            <Typography component='li' variant='body2'>
              {t('No active or pending orders in ANY robot')}
            </Typography>
            <Typography component='li' variant='body2'>
              {t('Exported any important data')}
            </Typography>
          </Box>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='primary'>
          {t('Cancel')}
        </Button>
        <Button onClick={onConfirm} color='error' variant='contained'>
          {t('Delete Garage Key')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteGarageKeyConfirmationDialog;
