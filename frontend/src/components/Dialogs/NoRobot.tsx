import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppContext, AppContextProps } from '../../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NoRobotDialog = ({ open, onClose }: Props): JSX.Element => {
  const { setPage } = useContext<AppContextProps>(AppContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClickGenerate = function () {
    onClose();
    setPage('robot');
    navigate('/robot');
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
