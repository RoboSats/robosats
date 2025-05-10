import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  useTheme,
  CircularProgress,
} from '@mui/material';

import { Check } from '@mui/icons-material';

interface WebLNDialogProps {
  open: boolean;
  onClose: () => void;
  waitingWebln: boolean;
  isBuyer: boolean;
}

export const WebLNDialog = ({
  open,
  onClose,
  waitingWebln,
  isBuyer,
}: WebLNDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('WebLN')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {waitingWebln ? (
            <>
              <CircularProgress
                size={1.1 * theme.typography.fontSize}
                thickness={5}
                style={{ marginRight: '0.8em' }}
              />
              {isBuyer
                ? t('Invoice not received, please check your WebLN wallet.')
                : t('Amount not yet locked, please check your WebLN wallet.')}
            </>
          ) : (
            <>
              <Check color='success' />
              {t('You can close now your WebLN wallet popup.')}
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebLNDialog;
