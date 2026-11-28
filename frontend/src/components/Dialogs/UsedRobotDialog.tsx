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
  Tooltip,
} from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

interface UsedRobotDialogProps {
  open: boolean;
  action: 'make' | 'take';
  hasActiveOrder: boolean;
  isRangeOrder?: boolean;
  isLegacyMode?: boolean;
  onClose: () => void;
  onChangeRobot: () => void;
  loading?: boolean;
}

const UsedRobotDialog = ({
  open,
  action,
  hasActiveOrder,
  isRangeOrder = false,
  isLegacyMode = false,
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
          {hasActiveOrder ? t('Robot has an active order') : t('Robot has completed a trade')}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component='div'>
          {hasActiveOrder ? (
            <>
              <Typography variant='body1' gutterBottom>
                {t('This robot already has an active order in progress.')}
              </Typography>
              <Typography variant='body2' sx={{ mt: 2 }}>
                {action === 'make'
                  ? t(
                      'Each robot can only handle one order at a time. Switch to your next unused robot to create a new order, or go back to manage the current one.',
                    )
                  : t(
                      'Each robot can only handle one order at a time. Switch to your next unused robot to take this order, or go back to manage the current one.',
                    )}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant='body1' gutterBottom>
                {action === 'make'
                  ? t(
                      'Each robot is a one-time identity. This robot has already completed a trade and cannot be used to create new orders.',
                    )
                  : t(
                      'Each robot is a one-time identity. This robot has already completed a trade and cannot be used to take new orders.',
                    )}
              </Typography>
              <Typography variant='body2' sx={{ mt: 2 }}>
                {action === 'make'
                  ? t(
                      'You can switch to your next unused robot and create the order immediately, or go back to the form.',
                    )
                  : t(
                      'You can switch to your next unused robot and take this order immediately, or go back.',
                    )}
              </Typography>
            </>
          )}
          {isRangeOrder && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              {t('Your selected amount will be preserved after switching robots.')}
            </Typography>
          )}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='primary'>
          {t('Go back')}
        </Button>
        <Tooltip
          title={isLegacyMode ? t('Switch to Garage Key mode to use this feature') : ''}
          placement='top'
        >
          <span>
            <LoadingButton
              loading={loading}
              onClick={onChangeRobot}
              color='primary'
              variant='contained'
              disabled={isLegacyMode}
            >
              {action === 'make'
                ? t('Change Robot & Create Order')
                : t('Change Robot & Take Order')}
            </LoadingButton>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default UsedRobotDialog;
