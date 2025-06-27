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

interface DeleteRobotConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  robotName?: string;
}

const DeleteRobotConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  robotName,
}: DeleteRobotConfirmationDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <Warning color='warning' />
          {t('Delete Robot?')}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component='div'>
          <Typography variant='body1' gutterBottom>
            {robotName
              ? t('Are you sure you want to permanently delete "{{robotName}}"?', {
                  robotName,
                })
              : t('Are you sure you want to permanently delete this robot?')}
          </Typography>

          <Typography variant='body2' color='warning.main' sx={{ mt: 2, fontWeight: 'bold' }}>
            {t('⚠️ This action cannot be undone!')}
          </Typography>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t('Before deleting, make sure you have:')}
          </Typography>

          <Box component='ul' sx={{ mt: 1, pl: 2 }}>
            <Typography component='li' variant='body2'>
              {t('Stored your robot token safely')}
            </Typography>
            <Typography component='li' variant='body2'>
              {t('No active or pending orders')}
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
          {t('Delete Robot')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteRobotConfirmationDialog;
