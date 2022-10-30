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
import { useHistory } from 'react-router-dom';
import { Page } from '../../basic/NavBar';

interface Props {
  open: boolean;
  onClose: () => void;
  setPage: (state: Page) => void;
}

const NoRobotDialog = ({ open, onClose, setPage }: Props): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleClickGenerate = function () {
    onClose();
    setPage('robot');
    history.push('/robot');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('You do not have a robot avatar')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t('Generate a robot avatar first. Then create your own order.')}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClickGenerate}>{t('Generate Robot')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoRobotDialog;
