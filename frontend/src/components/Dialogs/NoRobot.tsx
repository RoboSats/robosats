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
import { Link } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NoRobotDialog = ({ open, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('You do not have a robot avatar')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t('You need to generate a robot avatar in order to become an order maker')}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          {t('Go back')}
        </Button>
        <Button onClick={onClose} to='/' component={Link}>
          {t('Generate Robot')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoRobotDialog;
