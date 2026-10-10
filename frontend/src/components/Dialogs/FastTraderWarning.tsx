import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { Bolt } from '@mui/icons-material';

import { Order } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickDone: () => void;
  order: Order;
}

const TimerBox = ({ label, value }: { label: string; value: string }): React.JSX.Element => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        padding: '0.5em',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderRadius: '4px',
        borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
        textAlign: 'center',
      }}
    >
      <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Box>
  );
};

/**
 * Hard gate shown to a taker before they accept an instant order. The reduced timers are
 * invisible in the book otherwise, and a taker who accepts one without being ready loses time
 * they cannot get back. Accepting here is what proceeds to the usual robot confirmation.
 */
const FastTraderWarningDialog = ({
  open,
  onClose,
  onClickDone,
  order,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();

  // The order carries the actual timers the maker chose, so show those rather than the
  // coordinator's ceilings: an instant order may well be tighter than the maximum.
  const escrowHours = order?.escrow_duration ? (order.escrow_duration / 3600).toFixed(1) : '?';
  const chatHours = order?.chat_duration ? (order.chat_duration / 3600).toFixed(1) : '?';

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
        <Bolt sx={{ color: 'primary.main' }} />
        {t('This trader is a fast trader')}
      </DialogTitle>

      <DialogContent>
        <Alert severity='warning' sx={{ mb: 2 }}>
          {t('This is an Instant Order. Take it only if you are ready to complete it right now.')}
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TimerBox label={t('Escrow / invoice step')} value={`${escrowHours}h`} />
          <TimerBox label={t('Chat window')} value={`${chatHours}h`} />
        </Box>

        <Typography variant='body2'>
          {t(
            'If you miss these deadlines the order expires and your bond can be slashed. The timer does not pause while you are away.',
          )}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <Button variant='contained' color='warning' onClick={onClickDone}>
          {t('CONFIRM')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FastTraderWarningDialog;
