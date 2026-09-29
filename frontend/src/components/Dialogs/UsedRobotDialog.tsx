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
import { SmartToy } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

interface UsedRobotDialogProps {
  open: boolean;
  onClose: () => void;
  onChangeRobot: () => void;
  loading?: boolean;
}

const UsedRobotDialog = ({
  open,
  onClose,
  onChangeRobot,
  loading = false,
}: UsedRobotDialogProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy color='warning' />
          {t('Robot has completed a trade')}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component='div'>
          <Typography variant='body1' gutterBottom>
            {t(
              'Each robot is a one-time identity. This robot has already completed a trade and cannot be used to create new orders.',
            )}
          </Typography>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t(
              'You can switch to your next unused robot and create the order immediately, or go back to the form.',
            )}
          </Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='primary'>
          {t('Cancel')}
        </Button>
        <LoadingButton
          loading={loading}
          onClick={onChangeRobot}
          color='primary'
          variant='contained'
        >
          {t('Change Robot & Create Order')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UsedRobotDialog;
