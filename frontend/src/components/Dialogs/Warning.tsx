import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  longAlias: string;
}

const WarningDialog = ({ open, onClose, longAlias }: Props): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Warning')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t(
            'Coordinators of p2p trades are the source of trust, provide the infrastructure, pricing and will mediate in case of dispute. Make sure you research and trust "{{coordinator_name}}" before locking your bond. A malicious p2p coordinator can find ways to steal from you.',
            { coordinator_name: longAlias },
          )}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('I understand')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarningDialog;
